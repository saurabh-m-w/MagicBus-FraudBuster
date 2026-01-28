from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from .auth import get_current_youth
from .scout import calculate_scout_score

router = APIRouter(prefix="/user", tags=["User Portal"])


ONBOARDING_STAGES = [
    {"id": "discovered", "label": "Profile Created", "description": "Your profile has been created"},
    {"id": "interested", "label": "Details Submitted", "description": "Basic details have been submitted"},
    {"id": "documents_pending", "label": "Documents Pending", "description": "Please upload required documents"},
    {"id": "documents_submitted", "label": "Documents Submitted", "description": "Documents are under review"},
    {"id": "verified", "label": "Verified", "description": "Your documents have been verified"},
    {"id": "enrolled", "label": "Enrolled", "description": "You are enrolled in the programme"},
]


@router.get("/profile", response_model=schemas.YouthPublicProfile)
def get_my_profile(current_youth: models.Youth = Depends(get_current_youth)):
    return current_youth


@router.put("/profile", response_model=schemas.YouthPublicProfile)
def update_my_profile(
    profile_data: schemas.YouthProfileUpdate,
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    update_data = profile_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            setattr(youth, field, value)
    
    if profile_data.first_name or profile_data.last_name:
        first = profile_data.first_name or youth.first_name or ""
        last = profile_data.last_name or youth.last_name or ""
        youth.name = f"{first} {last}".strip()
    
    if profile_data.city and profile_data.state:
        youth.location = f"{profile_data.city}, {profile_data.state}"
    elif profile_data.city:
        youth.location = profile_data.city
    
    required_fields = ['age', 'gender', 'education_level', 'location']
    all_filled = all(getattr(youth, f) and getattr(youth, f) != "Not specified" for f in required_fields)
    
    if all_filled and not youth.profile_completed:
        youth.profile_completed = True
        if youth.onboarding_status == "discovered":
            youth.onboarding_status = "interested"
    
    youth_data = {
        "age": youth.age,
        "education_level": youth.education_level,
        "source_channel": youth.source_channel,
        "income_bracket": youth.income_bracket or "middle"
    }
    youth.scout_score = calculate_scout_score(youth_data)
    
    youth.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(youth)
    
    return youth


@router.post("/submit-documents")
def submit_documents(
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    # Validate required fields
    errors = []
    
    # Personal details
    if not youth.first_name or not youth.last_name:
        errors.append("First name and last name are required")
    if not youth.age:
        errors.append("Age is required")
    if not youth.address or not youth.city or not youth.state or not youth.pincode:
        errors.append("Complete address is required")
    
    # Family details
    if not youth.father_name or not youth.mother_name:
        errors.append("Parent names are required")
    if not youth.guardian_phone:
        errors.append("Guardian phone is required")
    if not youth.income_bracket:
        errors.append("Income bracket is required")
    
    # Identity documents
    if not youth.aadhar_number or len(youth.aadhar_number) != 12:
        errors.append("Valid 12-digit Aadhar number is required")
    if not youth.aadhar_doc_path:
        errors.append("Aadhar document upload is required")
    if not youth.photo_path:
        errors.append("Passport photo is required")
    
    # Education
    if not youth.education_level:
        errors.append("Education level is required")
    if not youth.institution_name:
        errors.append("Institution name is required")
    if not youth.year_of_passing:
        errors.append("Year of passing is required")
    if not youth.cert_10th_path:
        errors.append("10th certificate is required")
    
    # Check 12th certificate if education is 12th or above
    edu = (youth.education_level or "").lower()
    if any(x in edu for x in ["12", "graduate", "diploma", "iti", "post"]):
        if not youth.cert_12th_path:
            errors.append("12th certificate is required for your qualification")
    
    # Check graduation certificate if graduate
    if any(x in edu for x in ["graduate", "post"]):
        if not youth.cert_graduation_path:
            errors.append("Graduation certificate is required for your qualification")
    
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    
    youth.documents_uploaded = True
    youth.profile_completed = True
    
    if youth.onboarding_status in ["discovered", "interested", "documents_pending"]:
        youth.onboarding_status = "documents_submitted"
    
    db.commit()
    
    return {
        "message": "Application submitted successfully for verification",
        "status": youth.onboarding_status
    }


@router.get("/tracker")
def get_application_tracker(current_youth: models.Youth = Depends(get_current_youth)):
    current_status = current_youth.onboarding_status
    
    status_order = [s["id"] for s in ONBOARDING_STAGES]
    
    try:
        current_index = status_order.index(current_status)
    except ValueError:
        current_index = 0
    
    stages = []
    for i, stage in enumerate(ONBOARDING_STAGES):
        if i < current_index:
            status = "completed"
        elif i == current_index:
            status = "current"
        else:
            status = "pending"
        
        stages.append({
            "id": stage["id"],
            "label": stage["label"],
            "description": stage["description"],
            "status": status,
            "order": i + 1
        })
    
    return {
        "current_status": current_status,
        "current_stage": current_index + 1,
        "total_stages": len(ONBOARDING_STAGES),
        "progress_percentage": round((current_index + 1) / len(ONBOARDING_STAGES) * 100),
        "stages": stages,
        "profile_completed": current_youth.profile_completed,
        "documents_uploaded": current_youth.documents_uploaded
    }


@router.get("/status")
def get_my_status(current_youth: models.Youth = Depends(get_current_youth)):
    return {
        "id": current_youth.id,
        "name": current_youth.name,
        "email": current_youth.email,
        "phone": current_youth.phone,
        "onboarding_status": current_youth.onboarding_status,
        "profile_completed": current_youth.profile_completed,
        "documents_uploaded": current_youth.documents_uploaded,
        "scout_score": current_youth.scout_score,
        "created_at": current_youth.created_at
    }


@router.get("/notifications")
def get_notifications(current_youth: models.Youth = Depends(get_current_youth)):
    notifications = []
    
    if not current_youth.profile_completed:
        notifications.append({
            "type": "action_required",
            "title": "Complete Your Profile",
            "message": "Please fill in all required details to proceed with your application.",
            "priority": "high"
        })
    
    if current_youth.profile_completed and not current_youth.documents_uploaded:
        notifications.append({
            "type": "action_required",
            "title": "Upload Documents",
            "message": "Please upload your Aadhar card and other documents.",
            "priority": "high"
        })
    
    if current_youth.onboarding_status == "documents_submitted":
        notifications.append({
            "type": "info",
            "title": "Documents Under Review",
            "message": "Your documents are being verified. This usually takes 2-3 business days.",
            "priority": "medium"
        })
    
    if current_youth.onboarding_status == "verified":
        notifications.append({
            "type": "success",
            "title": "Documents Verified",
            "message": "Congratulations! Your documents have been verified. You will be enrolled soon.",
            "priority": "high"
        })
    
    if current_youth.onboarding_status == "enrolled":
        notifications.append({
            "type": "success",
            "title": "Welcome to Magic Bus!",
            "message": "You are now enrolled in the programme. Check your email for next steps.",
            "priority": "high"
        })
    
    return {"notifications": notifications, "count": len(notifications)}
