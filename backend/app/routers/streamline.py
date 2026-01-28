from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/streamline", tags=["STREAMLINE - Automated Onboarding"])

ONBOARDING_STEPS = [
    "discovery", "interest", "documents_pending", 
    "documents_submitted", "verified", "enrolled"
]


@router.get("/pipeline")
def get_onboarding_pipeline(db: Session = Depends(get_db)):
    pipeline = {}
    for status in models.OnboardingStatusEnum:
        count = db.query(models.Youth)\
            .filter(models.Youth.onboarding_status == status.value).count()
        pipeline[status.value] = count
    
    return pipeline


@router.get("/candidates/{status}", response_model=List[schemas.YouthDetail])
def get_candidates_by_status(
    status: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    candidates = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == status)\
        .order_by(models.Youth.created_at.desc())\
        .offset(skip).limit(limit).all()
    return candidates


@router.get("/candidates/detail/{youth_id}", response_model=schemas.YouthDetail)
def get_candidate_detail(
    youth_id: int,
    db: Session = Depends(get_db)
):
    """Get full details of a candidate including documents"""
    candidate = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.put("/candidates/{youth_id}/status")
def update_onboarding_status(
    youth_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    valid_statuses = [s.value for s in models.OnboardingStatusEnum]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    youth.onboarding_status = new_status
    
    if new_status == "enrolled":
        youth.enrolled_date = datetime.utcnow()
    
    db.commit()
    
    return {"youth_id": youth_id, "status": new_status}


@router.get("/metrics")
def get_onboarding_metrics(db: Session = Depends(get_db)):
    total = db.query(models.Youth).count()
    enrolled = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").count()
    dropped = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "dropped").count()
    
    enrolled_with_dates = db.query(models.Youth)\
        .filter(
            models.Youth.onboarding_status == "enrolled",
            models.Youth.enrolled_date.isnot(None)
        ).all()
    
    if enrolled_with_dates:
        total_days = sum(
            (y.enrolled_date - y.created_at).days 
            for y in enrolled_with_dates
        )
        avg_days = total_days / len(enrolled_with_dates)
    else:
        avg_days = 0
    
    return {
        "total_candidates": total,
        "enrolled": enrolled,
        "dropped": dropped,
        "in_progress": total - enrolled - dropped,
        "enrollment_rate": (enrolled / total * 100) if total else 0,
        "dropout_rate": (dropped / total * 100) if total else 0,
        "avg_onboarding_days": round(avg_days, 1)
    }


@router.get("/daily-progress")
def get_daily_progress(days: int = 7, db: Session = Depends(get_db)):
    from datetime import timedelta
    
    progress = []
    today = datetime.utcnow().date()
    
    for i in range(days):
        date = today - timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        enrolled = db.query(models.Youth)\
            .filter(
                models.Youth.enrolled_date >= datetime.combine(date, datetime.min.time()),
                models.Youth.enrolled_date < datetime.combine(next_date, datetime.min.time())
            ).count()
        
        new_candidates = db.query(models.Youth)\
            .filter(
                models.Youth.created_at >= datetime.combine(date, datetime.min.time()),
                models.Youth.created_at < datetime.combine(next_date, datetime.min.time())
            ).count()
        
        progress.append({
            "date": date.isoformat(),
            "new_candidates": new_candidates,
            "enrolled": enrolled
        })
    
    return progress[::-1]


@router.post("/simulate-whatsapp-onboarding")
def simulate_whatsapp_onboarding(
    name: str,
    phone: str,
    age: int,
    location: str,
    education: str,
    db: Session = Depends(get_db)
):
    existing = db.query(models.Youth).filter(models.Youth.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    from .scout import calculate_scout_score
    
    youth_data = {
        "name": name,
        "phone": phone,
        "age": age,
        "location": location,
        "education_level": education,
        "source_channel": "whatsapp",
        "gender": "Not specified",
        "income_bracket": "middle"
    }
    
    scout_score = calculate_scout_score(youth_data)
    
    db_youth = models.Youth(
        name=name,
        phone=phone,
        age=age,
        location=location,
        education_level=education,
        gender="Not specified",
        source_channel="whatsapp",
        scout_score=scout_score,
        onboarding_status="interested"
    )
    db.add(db_youth)
    db.commit()
    db.refresh(db_youth)
    
    return {
        "message": f"Welcome {name}! You've been registered for Magic Bus programme.",
        "youth_id": db_youth.id,
        "next_step": "Please upload your documents",
        "scout_score": scout_score
    }
