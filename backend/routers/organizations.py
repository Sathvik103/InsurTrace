from typing import List, Literal, Optional

from fastapi import APIRouter, Depends

from dependencies import get_current_profile, supabase

router = APIRouter(prefix="/organizations", tags=["Organisations"])

ShareableType = Literal["GARAGE", "INSURER", "SURVEYOR", "FLEET_OPERATOR"]


@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def list_organizations(type: Optional[ShareableType] = None, profile: dict = Depends(get_current_profile)):
    """
    Directory of organisations an owner can share records with. Returns only
    public identity fields (id, name, type), never members or data.
    """
    q = supabase.table("organizations").select("id, name, type")
    if type:
        q = q.eq("type", type)
    rows = q.limit(200).execute().data or []
    return sorted(rows, key=lambda r: str(r.get("name", "")).lower())
