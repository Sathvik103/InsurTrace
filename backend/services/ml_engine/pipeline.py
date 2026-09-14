from typing import Dict, Any
from .fraud_scorer import FraudScorer, FraudFeatureVector
from .severity_predictor import SeverityPredictor, SeverityFeatureVector

fraud_model = FraudScorer()
severity_model = SeverityPredictor()

def extract_features(claim_data: Dict[str, Any], vehicle_data: Dict[str, Any], historical_claims: int) -> FraudFeatureVector:
    """
    Data Ingestion pipeline to convert raw PostgreSQL JSON into normalized model features.
    """
    return FraudFeatureVector(
        vehicle_age=vehicle_data.get("manufacture_year", 2026) - 2026,
        historical_claim_count=historical_claims,
        estimated_cost_ratio=claim_data.get("estimated_repair_cost", 0) / 100000.0
    )

def run_claim_intelligence(claim_id: str, claim_data: Dict[str, Any], vehicle_data: Dict[str, Any], historical_claims: int) -> Dict[str, Any]:
    """
    Executes the full ML pipeline for a given claim.
    """
    features = extract_features(claim_data, vehicle_data, historical_claims)
    
    fraud_result = fraud_model.predict(features)
    # Re-use the feature dict mapping since they share the same schema for now
    sev_features = SeverityFeatureVector(**features.dict())
    severity_result = severity_model.predict_severity(sev_features)
    
    return {
        "claim_id": claim_id,
        "features_extracted": list(features.dict().keys()),
        "fraud_analysis": fraud_result.dict(),
        "severity_analysis": severity_result.dict()
    }
