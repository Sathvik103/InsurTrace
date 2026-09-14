from fastapi import APIRouter, Depends
from services.financial_engine.models import ClaimDecisionInput, ClaimDecisionOutput
from services.financial_engine.calculator import calculate_decision

router = APIRouter(prefix="/financial", tags=["Financial Engine"])

@router.post("/analyze-claim", response_model=ClaimDecisionOutput)
async def analyze_claim(data: ClaimDecisionInput):
    """
    Analyzes a potential claim deterministically.
    This does NOT use ML for the financial calculation.
    """
    decision = calculate_decision(data)
    # TODO: Log decision to database for provenance mapping if requested by authenticated user
    return decision
