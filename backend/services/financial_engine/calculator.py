import datetime
from .models import ClaimDecisionInput, ClaimDecisionOutput, SimulationYear, SensitivityPoint

NCB_SLABS = [0, 20, 25, 35, 45, 50]

def get_metal_depreciation(age_years: float) -> float:
    if age_years <= 0.5:
        return 0.05
    elif age_years <= 1.0:
        return 0.10
    elif age_years <= 2.0:
        return 0.15
    elif age_years <= 3.0:
        return 0.25
    elif age_years <= 4.0:
        return 0.35
    elif age_years <= 5.0:
        return 0.40
    else:
        return 0.50

def get_next_ncb(current_ncb: int, claimed: bool) -> int:
    if claimed:
        return 0
    try:
        idx = NCB_SLABS.index(current_ncb)
        return NCB_SLABS[min(idx + 1, len(NCB_SLABS) - 1)]
    except ValueError:
        return 0

def simulate_3_years(base_premium: float, current_ncb: int) -> list[SimulationYear]:
    simulations = []
    claim_ncb = 0
    self_pay_ncb = current_ncb
    
    for year in range(1, 4):
        # Claim scenario
        claim_discount = base_premium * (claim_ncb / 100)
        claim_premium = base_premium - claim_discount
        
        # Self-pay scenario
        self_pay_ncb = get_next_ncb(self_pay_ncb, claimed=False)
        self_pay_discount = base_premium * (self_pay_ncb / 100)
        self_pay_premium = base_premium - self_pay_discount
        
        simulations.append(SimulationYear(
            year=year,
            claim_ncb=claim_ncb,
            self_pay_ncb=self_pay_ncb,
            claim_premium=claim_premium,
            self_pay_premium=self_pay_premium,
            difference=claim_premium - self_pay_premium
        ))
        
        # advance claim scenario safely
        claim_ncb = get_next_ncb(claim_ncb, claimed=False)
        
    return simulations

def calculate_depreciation(category: str, cost: float, age_years: float, zero_dep: bool) -> float:
    if category == "labour" or category == "glass":
        return 0.0
    if zero_dep and category != "consumables":
        return 0.0
    
    if category == "plastic" or category == "rubber" or category == "nylon" or category == "consumables":
        return cost * 0.50
    elif category == "fiberglass":
        return cost * 0.30
    elif category == "metal":
        return cost * get_metal_depreciation(age_years)
    
    return 0.0

def calculate_decision(data: ClaimDecisionInput) -> ClaimDecisionOutput:
    total_estimate = sum(item.cost for item in data.repair_items)
    
    depreciation_deduction = 0.0
    for item in data.repair_items:
        depreciation_deduction += calculate_depreciation(
            item.category, item.cost, data.vehicle.age_years, data.policy.zero_depreciation_addon
        )
        
    admissible_amount = total_estimate - depreciation_deduction
    
    # Apply deductible
    deductible_deduction = min(data.policy.deductible, admissible_amount)
    
    # Calculate initial payout
    estimated_payout = admissible_amount - deductible_deduction
    
    # Apply policy limit (IDV)
    if estimated_payout > data.policy.idv:
        estimated_payout = data.policy.idv
        
    # Ensure payout is non-negative
    estimated_payout = max(0.0, estimated_payout)

    immediate_out_of_pocket = total_estimate - estimated_payout
    
    # Future impact (1 year logic for immediate NCB impact, but 3-year for simulation)
    # The pure financial impact is the sum of lost discounts over 3 years, 
    # but for simplicity, we use the immediate next year's impact as the strict "future_ncb_impact"
    next_ncb_claim = 0
    next_ncb_no_claim = get_next_ncb(data.policy.ncb_percentage, claimed=False)
    
    discount_claim = data.estimated_base_premium_next_year * (next_ncb_claim / 100)
    discount_no_claim = data.estimated_base_premium_next_year * (next_ncb_no_claim / 100)
    
    future_ncb_impact = discount_no_claim - discount_claim
    
    effective_claim_cost = immediate_out_of_pocket + future_ncb_impact
    self_pay_cost = total_estimate
    
    estimated_saving = self_pay_cost - effective_claim_cost
    
    if estimated_saving > 2000:
        recommendation = "CLAIM"
    elif estimated_saving < -1000:
        recommendation = "SELF-PAY"
    else:
        recommendation = "BORDERLINE"
        
    # Break even threshold roughly: deductible + future_ncb_impact
    # (assuming 0 depreciation for the marginal rupee, which is a simplification)
    # A better approximation is: threshold = (deductible + future_ncb_impact) / (1 - average_depreciation_rate)
    if total_estimate > 0:
        avg_dep = depreciation_deduction / total_estimate
    else:
        avg_dep = 0
        
    if avg_dep >= 1.0:
        break_even_threshold = float('inf')
    else:
        break_even_threshold = (data.policy.deductible + future_ncb_impact) / (1 - avg_dep)
        
    explanations = []
    if data.policy.zero_depreciation_addon:
        explanations.append("Zero depreciation cover applies, significantly increasing payout for parts.")
    if depreciation_deduction > 0:
        explanations.append(f"Depreciation reduced payout by ₹{depreciation_deduction:,.2f}.")
    if deductible_deduction > 0:
        explanations.append(f"Standard compulsory deductible of ₹{deductible_deduction:,.2f} applies.")
    if estimated_payout >= data.policy.idv:
        explanations.append("Policy limit (IDV) reached.")
    if future_ncb_impact > 0:
        explanations.append(f"Making a claim drops next year's NCB to 0%, costing an estimated ₹{future_ncb_impact:,.2f}.")
        
    if recommendation == "CLAIM":
        explanations.append("The repair amount is above the break-even threshold.")
    elif recommendation == "SELF-PAY":
        explanations.append("The estimated future premium impact and immediate costs outweigh the claim payout.")
    else:
        explanations.append("The difference is marginal; consider self-paying to preserve a clean claim history.")

    simulations = simulate_3_years(data.estimated_base_premium_next_year, data.policy.ncb_percentage)
    
    # Sensitivity Analysis
    sensitivity = []
    test_points = [5000, 15000, 30000, 50000, 100000]
    for cost in test_points:
        # Simplistic sensitivity keeping same avg dep
        test_dep = cost * avg_dep
        test_admissible = cost - test_dep
        test_payout = max(0, min(test_admissible - data.policy.deductible, data.policy.idv))
        test_effective_cost = (cost - test_payout) + future_ncb_impact
        if cost - test_effective_cost > 2000:
            rec = "CLAIM"
        elif cost - test_effective_cost < -1000:
            rec = "SELF-PAY"
        else:
            rec = "BORDERLINE"
        sensitivity.append(SensitivityPoint(repair_cost=cost, recommendation=rec))

    return ClaimDecisionOutput(
        rule_version=data.policy.rule_version,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        total_estimate=total_estimate,
        admissible_amount=admissible_amount,
        depreciation_deduction=depreciation_deduction,
        deductible_deduction=deductible_deduction,
        estimated_payout=estimated_payout,
        immediate_out_of_pocket=immediate_out_of_pocket,
        future_ncb_impact=future_ncb_impact,
        effective_claim_cost=effective_claim_cost,
        self_pay_cost=self_pay_cost,
        estimated_saving=estimated_saving,
        recommendation=recommendation,
        break_even_threshold=break_even_threshold,
        explanations=explanations,
        simulation_3_year=simulations,
        sensitivity_analysis=sensitivity
    )
