import pytest
import datetime
from services.financial_engine.models import ClaimDecisionInput, VehicleInfo, PolicyInfo, RepairItem
from services.financial_engine.calculator import calculate_decision

def get_base_input() -> ClaimDecisionInput:
    return ClaimDecisionInput(
        vehicle=VehicleInfo(age_years=3.0),
        policy=PolicyInfo(
            idv=500000.0,
            deductible=2000.0,
            ncb_percentage=20,
            zero_depreciation_addon=False,
            policy_start_date=datetime.date(2026, 1, 1),
            rule_version="TEST_V1"
        ),
        repair_items=[],
        estimated_base_premium_next_year=15000.0
    )

def test_case_1_small_repair_self_pay_wins():
    data = get_base_input()
    data.repair_items = [RepairItem(category="plastic", cost=3000.0)]
    res = calculate_decision(data)
    # Estimate: 3000
    # Dep (50% plastic) = 1500
    # Admissible = 1500
    # Ded = min(2000, 1500) = 1500
    # Payout = 0
    assert res.estimated_payout == 0
    assert res.recommendation == "SELF-PAY"

def test_case_2_large_repair_claim_wins():
    data = get_base_input()
    data.repair_items = [RepairItem(category="metal", cost=150000.0)]
    res = calculate_decision(data)
    # Metal 3 yrs dep = 25% -> 37500
    # Admissible = 112500
    # Ded = 2000
    # Payout = 110500
    # Future NCB impact = 25% of 15000 (next NCB) - 0% of 15000 = 3750
    # Saving = 110500 - 3750 = 106750
    assert res.estimated_payout > 100000
    assert res.recommendation == "CLAIM"

def test_case_3_borderline():
    data = get_base_input()
    # Let's hit the threshold exactly. Payout roughly equals NCB impact
    data.repair_items = [RepairItem(category="glass", cost=5000.0)] 
    data.policy.ncb_percentage = 20
    data.policy.deductible = 1000.0
    # Payout: 5000 - 0 (dep) - 1000 (ded) = 4000
    # NCB impact: next NCB is 25%. 25% of 15000 = 3750. 
    # Effective claim cost = 1000 (out of pocket) + 3750 (ncb) = 4750
    # Self pay = 5000. Saving = 250. This should be BORDERLINE.
    res = calculate_decision(data)
    assert res.recommendation == "BORDERLINE"

def test_case_4_high_deductible():
    data = get_base_input()
    data.policy.deductible = 50000.0
    data.repair_items = [RepairItem(category="metal", cost=40000.0)]
    res = calculate_decision(data)
    # Payout = 0 due to deductible
    assert res.estimated_payout == 0
    assert res.recommendation == "SELF-PAY"

def test_case_5_high_ncb():
    data = get_base_input()
    data.policy.ncb_percentage = 50
    data.repair_items = [RepairItem(category="glass", cost=10000.0)]
    data.estimated_base_premium_next_year = 30000.0 # High base premium
    res = calculate_decision(data)
    # Payout = 10000 - 0 dep - 2000 ded = 8000
    # Next NCB without claim = 50%. NCB discount lost = 50% of 30000 = 15000.
    # Saving = 10000 (self pay) - (2000 out of pocket + 15000 future) = -7000
    assert res.recommendation == "SELF-PAY"

def test_case_6_zero_depreciation():
    data = get_base_input()
    data.policy.zero_depreciation_addon = True
    data.repair_items = [RepairItem(category="plastic", cost=50000.0)]
    res = calculate_decision(data)
    # Admissible = 50000 (no dep)
    assert res.admissible_amount == 50000.0

def test_case_7_policy_limit():
    data = get_base_input()
    data.policy.idv = 100000.0
    data.repair_items = [RepairItem(category="metal", cost=200000.0)]
    res = calculate_decision(data)
    assert res.estimated_payout <= 100000.0

def test_case_8_old_vehicle():
    data = get_base_input()
    data.vehicle.age_years = 12.0
    data.repair_items = [RepairItem(category="metal", cost=50000.0)]
    res = calculate_decision(data)
    # Depreciation should be max 50%
    assert res.depreciation_deduction == 25000.0

def test_case_9_missing_uncertain_inputs():
    # Example of a 0 repair cost estimate (waiting for inputs)
    data = get_base_input()
    data.repair_items = []
    res = calculate_decision(data)
    assert res.estimated_payout == 0.0

def test_case_10_future_impact_outweighs():
    # Addressed in test 5, but let's test exactly boundary
    data = get_base_input()
    data.policy.ncb_percentage = 45 # Next NCB is 50%
    data.estimated_base_premium_next_year = 40000.0
    data.repair_items = [RepairItem(category="glass", cost=15000.0)]
    # Payout: 13000. Future loss: 50% of 40000 = 20000. 
    # Saving = 15000 - (2000 + 20000) = -7000
    res = calculate_decision(data)
    assert res.recommendation == "SELF-PAY"
