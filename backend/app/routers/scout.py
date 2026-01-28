from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from .. import models, schemas
from ..ml.propensity_model import get_propensity_score, get_dropout_risk

router = APIRouter(prefix="/scout", tags=["SCOUT - Predictive Targeting"])


def calculate_scout_score(youth_data: dict) -> float:
    result = get_propensity_score(youth_data)
    return result["score"]


@router.get("/candidates", response_model=List[schemas.Youth])
def get_candidates(
    skip: int = 0,
    limit: int = 50,
    min_score: float = 0,
    db: Session = Depends(get_db)
):
    candidates = db.query(models.Youth)\
        .filter(models.Youth.scout_score >= min_score)\
        .order_by(models.Youth.scout_score.desc())\
        .offset(skip).limit(limit).all()
    return candidates


@router.get("/candidates/{youth_id}", response_model=schemas.YouthDetail)
def get_candidate_detail(youth_id: int, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return youth


@router.post("/candidates", response_model=schemas.Youth)
def create_candidate(youth: schemas.YouthCreate, db: Session = Depends(get_db)):
    youth_dict = youth.model_dump()
    scout_score = calculate_scout_score(youth_dict)
    
    db_youth = models.Youth(
        **youth_dict,
        scout_score=scout_score,
        onboarding_status=models.OnboardingStatusEnum.DISCOVERED.value
    )
    db.add(db_youth)
    db.commit()
    db.refresh(db_youth)
    return db_youth


@router.get("/score/{youth_id}")
def recalculate_score(youth_id: int, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    youth_data = {
        "age": youth.age,
        "education_level": youth.education_level,
        "source_channel": youth.source_channel,
        "income_bracket": youth.income_bracket
    }
    new_score = calculate_scout_score(youth_data)
    youth.scout_score = new_score
    db.commit()
    
    return {"youth_id": youth_id, "scout_score": new_score}


@router.get("/segments")
def get_segments(db: Session = Depends(get_db)):
    total = db.query(models.Youth).count()
    high = db.query(models.Youth).filter(models.Youth.scout_score >= 80).count()
    medium = db.query(models.Youth).filter(
        models.Youth.scout_score >= 50,
        models.Youth.scout_score < 80
    ).count()
    low = db.query(models.Youth).filter(models.Youth.scout_score < 50).count()
    
    return {
        "total": total,
        "high_potential": {"count": high, "percentage": (high/total*100) if total else 0},
        "medium_potential": {"count": medium, "percentage": (medium/total*100) if total else 0},
        "needs_support": {"count": low, "percentage": (low/total*100) if total else 0}
    }


@router.get("/zone-analysis")
def get_zone_analysis(db: Session = Depends(get_db)):
    zones = db.query(
        models.Youth.location,
        func.count(models.Youth.id).label("count"),
        func.avg(models.Youth.scout_score).label("avg_score")
    ).group_by(models.Youth.location).all()
    
    return [
        {"location": z[0], "candidate_count": z[1], "avg_scout_score": round(z[2], 2)}
        for z in zones
    ]


@router.get("/propensity/{youth_id}")
def get_propensity_analysis(youth_id: int, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    youth_data = {
        "age": youth.age,
        "education_level": youth.education_level,
        "source_channel": youth.source_channel,
        "income_bracket": youth.income_bracket,
        "skills": youth.skills,
        "interests": youth.interests,
        "profile_completed": youth.profile_completed,
        "documents_uploaded": youth.documents_uploaded,
        "total_sessions": 0,
        "avg_session_duration": 0,
        "total_notifications": 0,
        "notifications_opened": 0
    }
    
    result = get_propensity_score(youth_data)
    
    return {
        "youth_id": youth_id,
        "name": youth.name,
        "current_score": youth.scout_score,
        **result
    }


@router.get("/risk/{youth_id}")
def get_dropout_risk_analysis(youth_id: int, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    youth_data = {
        "attendance_rate": youth.attendance_rate,
        "assignment_completion": youth.assignment_completion,
        "sentiment_score": youth.sentiment_score,
        "total_sessions": 0,
        "notification_open_rate": 0
    }
    
    result = get_dropout_risk(youth_data)
    
    return {
        "youth_id": youth_id,
        "name": youth.name,
        "current_risk": youth.dropout_risk,
        **result
    }
