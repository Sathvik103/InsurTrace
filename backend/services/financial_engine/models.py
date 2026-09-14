from pydantic import BaseModel
from typing import List, Optional
import datetime

class RepairItem(BaseModel):
    category: str # "metal", "plastic", "glass", "fiberglass", "consumables", "labour"
    cost: float

class PolicyInfo(BaseModel):
    idv: float
    deductible: float
    ncb_percentage: int
    zero_depreciation_addon: bool
    policy_start_date: datetime.date
    rule_version: str = "MOTOR_INDIA_2026_V1"

class VehicleInfo(BaseModel):
    age_years: float

class ClaimDecisionInput(BaseModel):
    vehicle: VehicleInfo
    policy: PolicyInfo
    repair_items: List[RepairItem]
    estimated_base_premium_next_year: float

class SimulationYear(BaseModel):
    year: int
    claim_ncb: int
    self_pay_ncb: int
    claim_premium: float
    self_pay_premium: float
    difference: float # > 0 means self-pay is better

class SensitivityPoint(BaseModel):
    repair_cost: float
    recommendation: str

class ClaimDecisionOutput(BaseModel):
    rule_version: str
    timestamp: str
    
    # Financial breakdown
    total_estimate: float
    admissible_amount: float
    depreciation_deduction: float
    deductible_deduction: float
    estimated_payout: float
    
    immediate_out_of_pocket: float
    future_ncb_impact: float
    effective_claim_cost: float
    self_pay_cost: float
    
    estimated_saving: float
    recommendation: str # "CLAIM", "SELF-PAY", "BORDERLINE"
    
    break_even_threshold: float
    
    # Explanations
    explanations: List[str]
    
    # Simulations
    simulation_3_year: List[SimulationYear]
    sensitivity_analysis: List[SensitivityPoint]
