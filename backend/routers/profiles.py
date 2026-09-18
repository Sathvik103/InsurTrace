from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from dependencies import get_current_profile, supabase

router = APIRouter(prefix="/profiles", tags=["Profiles & Identity"])

@router.get("/me", response_model=Dict[str, Any])
async def get_my_profile(profile: dict = Depends(get_current_profile)):
    """
    Returns the authenticated user's authoritative profile from the database,
    including role, organization details, and permissions.
    """
    org_data = None
    if profile.get("organization_id"):
        org_res = supabase.table("organizations").select("id, name, type").eq("id", profile["organization_id"]).execute()
        if org_res.data:
            org_data = org_res.data[0]

    return {
        "id": profile["id"],
        "email": profile.get("email"),
        "full_name": profile.get("full_name"),
        "role": profile["role"],
        "organization_id": profile.get("organization_id"),
        "organization": org_data
    }

@router.get("/users", response_model=List[Dict[str, Any]])
async def list_available_profiles():
    """
    Returns the system's authorized user profiles for first-run login
    and role simulation.
    """
    profiles_res = supabase.table("profiles").select("id, role, organization_id, email, full_name").execute()
    return profiles_res.data or []
