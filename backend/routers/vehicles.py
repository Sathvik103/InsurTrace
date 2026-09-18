from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import datetime
from dependencies import get_current_profile, supabase

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

class VehicleBase(BaseModel):
    registration_number: str
    vin: Optional[str]
    make: str
    model: str
    manufacture_year: int
    fuel_type: Optional[str]

class VehicleResponse(VehicleBase):
    id: str
    created_at: datetime.datetime

@router.get("/", response_model=List[VehicleResponse])
async def list_vehicles(profile: dict = Depends(get_current_profile)):
    # Depending on role, fetch relevant vehicles
    # Simplification: Admin gets all, others get vehicles they have relation to
    role = profile["role"]
    if role == "ADMIN":
        res = supabase.table("vehicles").select("*").execute()
    elif role == "POLICYHOLDER":
        # Get vehicles owned by them via ownership_history
        # Real query would join, but Supabase python client doesn't support complex joins well without RPC.
        # Workaround: fetch ownership, then vehicles
        ownership = supabase.table("ownership_history").select("vehicle_id").eq("owner_profile_id", profile["id"]).execute()
        v_ids = [o["vehicle_id"] for o in ownership.data]
        if not v_ids:
            return []
        res = supabase.table("vehicles").select("*").in_("id", v_ids).execute()
    else:
        # Insurers / Garages / Surveyors logic would go here. 
        # For demo, returning an empty list or specific logic.
        res = supabase.table("vehicles").select("*").limit(50).execute()
        
    return res.data

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, profile: dict = Depends(get_current_profile)):
    res = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return res.data[0]

@router.post("/", response_model=VehicleResponse)
async def create_vehicle(vehicle: VehicleBase, profile: dict = Depends(get_current_profile)):
    # Create the vehicle
    res = supabase.table("vehicles").insert(vehicle.dict()).execute()
    v_data = res.data[0]
    
    # If policyholder, create ownership record
    if profile["role"] == "POLICYHOLDER":
        supabase.table("ownership_history").insert({
            "vehicle_id": v_data["id"],
            "owner_profile_id": profile["id"],
            "start_date": datetime.date.today().isoformat()
        }).execute()
        
    # TODO: Blockchain commit
    
    return v_data
