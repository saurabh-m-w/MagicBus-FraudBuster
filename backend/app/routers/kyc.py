from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

from ..database import get_db
from .. import models
from .auth import get_current_youth

load_dotenv()

router = APIRouter(prefix="/kyc", tags=["KYC Verification"])

SANDBOX_API_BASE = "https://api.sandbox.co.in"
SANDBOX_API_KEY = os.getenv("SANDBOX_API_KEY", "key_live_127dbc12d8294d4ea054f95acba11732")
SANDBOX_AUTH_KEY = os.getenv("SANDBOX_AUTH_KEY", "")


class AadharOTPRequest(BaseModel):
    aadhaar_number: str


class AadharOTPVerifyRequest(BaseModel):
    reference_id: int
    otp: str


@router.post("/aadhaar/send-otp")
async def send_aadhaar_otp(
    request: AadharOTPRequest,
    current_youth: models.Youth = Depends(get_current_youth)
):
    if len(request.aadhaar_number) != 12 or not request.aadhaar_number.isdigit():
        raise HTTPException(status_code=400, detail="Invalid Aadhaar number format")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SANDBOX_API_BASE}/kyc/aadhaar/okyc/otp",
                headers={
                    "x-api-key": SANDBOX_API_KEY,
                    "x-api-version": "1.0",
                    "Authorization": SANDBOX_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
                    "aadhaar_number": request.aadhaar_number,
                    "consent": "y",
                    "reason": "for kyc"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "reference_id": result["data"]["reference_id"],
                    "message": result["data"]["message"]
                }
            else:
                error_data = response.json() if response.text else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Failed to send OTP")
                )
                
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"KYC service unavailable: {str(e)}")


@router.post("/aadhaar/verify-otp")
async def verify_aadhaar_otp(
    request: AadharOTPVerifyRequest,
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SANDBOX_API_BASE}/kyc/aadhaar/okyc/otp/verify",
                headers={
                    "x-api-key": SANDBOX_API_KEY,
                    "x-api-version": "1.0",
                    "Authorization": SANDBOX_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
                    "reference_id": request.reference_id,
                    "otp": request.otp
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                data = result.get("data", {})
                
                if data.get("status") == "VALID":
                    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
                    
                    youth.aadhar_number = str(request.reference_id)[:12]
                    youth.aadhar_verified = True
                    
                    name_parts = data.get("name", "").split()
                    if len(name_parts) >= 2 and not youth.first_name:
                        youth.first_name = name_parts[0]
                        youth.last_name = " ".join(name_parts[1:])
                        youth.name = data.get("name")
                    
                    if data.get("gender") and not youth.gender:
                        youth.gender = "Male" if data.get("gender") == "M" else "Female"
                    
                    if data.get("date_of_birth"):
                        dob = data.get("date_of_birth")
                        year_of_birth = int(dob.split("-")[-1]) if "-" in dob else data.get("year_of_birth")
                        if year_of_birth and not youth.age:
                            from datetime import datetime
                            current_year = datetime.now().year
                            youth.age = current_year - year_of_birth
                    
                    address = data.get("address", {})
                    if address.get("state") and not youth.state:
                        youth.state = address.get("state")
                    if address.get("district") and not youth.city:
                        youth.city = address.get("district")
                    if address.get("pincode") and not youth.pincode:
                        youth.pincode = str(address.get("pincode"))
                    
                    db.commit()
                    db.refresh(youth)
                    
                    return {
                        "success": True,
                        "message": "Aadhaar verified successfully",
                        "verified": True,
                        "data": {
                            "name": data.get("name"),
                            "gender": data.get("gender"),
                            "date_of_birth": data.get("date_of_birth"),
                            "state": address.get("state"),
                            "district": address.get("district"),
                            "pincode": address.get("pincode")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "verified": False,
                        "message": "Aadhaar verification failed"
                    }
            else:
                error_data = response.json() if response.text else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "OTP verification failed")
                )
                
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"KYC service unavailable: {str(e)}")
