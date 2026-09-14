from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
import datetime

class ProvenanceMetadata(BaseModel):
    """Tracks the origin, license, and trustworthiness of any ingested data"""
    source_name: str
    source_url: Optional[str] = None
    retrieval_date: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    license_type: str = "UNKNOWN"
    dataset_version: Optional[str] = None
    transformation_version: str = "v1.0"
    is_real_world: bool = False
    is_synthetic: bool = False
    
class IngestedPolicyDocument(BaseModel):
    """Raw extraction of an insurance policy wording document"""
    provenance: ProvenanceMetadata
    raw_text: str
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    
class IngestedVehicleData(BaseModel):
    """Standardized vehicle data from an external registry"""
    provenance: ProvenanceMetadata
    registration_number: str
    make: str
    model: str
    variant: Optional[str]
    manufacture_year: int
    engine_capacity_cc: Optional[int]
    fuel_type: Optional[str]
    
class IngestedClaimRecord(BaseModel):
    """Standardized public claim dataset record for ML training"""
    provenance: ProvenanceMetadata
    claim_id: str
    vehicle_age_years: int
    reported_damage_components: List[str]
    admissible_amount: float
    total_estimate: float
    is_fraudulent: Optional[bool] = None
