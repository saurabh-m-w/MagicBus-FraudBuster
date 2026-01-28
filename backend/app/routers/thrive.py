from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/thrive", tags=["THRIVE - Retention & Placement"])


def calculate_dropout_risk(youth: models.Youth) -> tuple:
    risk_score = 0.0
    risk_factors = []
    
    if youth.attendance_rate < 0.5:
        risk_score += 30
        risk_factors.append("Low attendance rate")
    elif youth.attendance_rate < 0.7:
        risk_score += 15
        risk_factors.append("Below average attendance")
    
    if youth.assignment_completion < 0.5:
        risk_score += 25
        risk_factors.append("Low assignment completion")
    elif youth.assignment_completion < 0.7:
        risk_score += 10
        risk_factors.append("Below average assignment completion")
    
    if youth.sentiment_score < 0.3:
        risk_score += 25
        risk_factors.append("Negative sentiment detected")
    elif youth.sentiment_score < 0.5:
        risk_score += 10
        risk_factors.append("Neutral/low sentiment")
    
    if youth.scout_score < 50:
        risk_score += 10
        risk_factors.append("Lower initial propensity score")
    
    return min(100, risk_score), risk_factors


def get_intervention_recommendation(risk_score: float) -> str:
    if risk_score >= 70:
        return "Immediate staff call + family engagement"
    elif risk_score >= 50:
        return "Mentor check-in + peer buddy activation"
    elif risk_score >= 30:
        return "Automated motivational nudge"
    else:
        return "Continue regular engagement"


@router.get("/at-risk", response_model=List[schemas.DropoutAlert])
def get_at_risk_youth(
    min_risk: float = 30,
    db: Session = Depends(get_db)
):
    enrolled_youth = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").all()
    
    alerts = []
    for youth in enrolled_youth:
        risk_score, risk_factors = calculate_dropout_risk(youth)
        if risk_score >= min_risk:
            risk_level = "critical" if risk_score >= 70 else "high" if risk_score >= 50 else "medium" if risk_score >= 30 else "low"
            alerts.append({
                "youth_id": youth.id,
                "youth_name": youth.name,
                "risk_level": risk_level,
                "risk_score": risk_score,
                "risk_factors": risk_factors,
                "recommended_intervention": get_intervention_recommendation(risk_score)
            })
    
    return sorted(alerts, key=lambda x: x["risk_score"], reverse=True)


@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    enrolled = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").all()
    
    distribution = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    for youth in enrolled:
        risk_score, _ = calculate_dropout_risk(youth)
        if risk_score >= 70:
            distribution["critical"] += 1
        elif risk_score >= 50:
            distribution["high"] += 1
        elif risk_score >= 30:
            distribution["medium"] += 1
        else:
            distribution["low"] += 1
    
    total = len(enrolled)
    return {
        "total_enrolled": total,
        "distribution": distribution,
        "percentages": {
            k: round(v / total * 100, 2) if total else 0 
            for k, v in distribution.items()
        }
    }


@router.post("/interventions", response_model=schemas.Intervention)
def create_intervention(
    intervention: schemas.InterventionCreate,
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == intervention.youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    db_intervention = models.Intervention(
        youth_id=intervention.youth_id,
        intervention_type=intervention.intervention_type,
        notes=intervention.notes,
        status="pending"
    )
    db.add(db_intervention)
    db.commit()
    db.refresh(db_intervention)
    return db_intervention


@router.get("/interventions/{youth_id}")
def get_youth_interventions(youth_id: int, db: Session = Depends(get_db)):
    interventions = db.query(models.Intervention)\
        .filter(models.Intervention.youth_id == youth_id)\
        .order_by(models.Intervention.created_at.desc()).all()
    return interventions


@router.get("/jobs", response_model=List[dict])
def get_available_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).filter(models.Job.is_active == 1).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "salary_range": f"₹{j.salary_min}-{j.salary_max}",
            "required_skills": j.required_skills
        }
        for j in jobs
    ]


@router.get("/job-matches/{youth_id}")
def get_job_matches(youth_id: int, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    jobs = db.query(models.Job).filter(models.Job.is_active == 1).all()
    youth_skills = set(youth.skills or [])
    
    matches = []
    for job in jobs:
        job_skills = set(job.required_skills or [])
        matched_skills = youth_skills & job_skills
        gap_skills = job_skills - youth_skills
        
        if job_skills:
            match_score = len(matched_skills) / len(job_skills) * 100
        else:
            match_score = 50
        
        matches.append({
            "job_id": job.id,
            "job_title": job.title,
            "company": job.company,
            "location": job.location,
            "salary_range": f"₹{job.salary_min}-{job.salary_max}",
            "match_score": round(match_score, 2),
            "skills_matched": list(matched_skills),
            "skills_gap": list(gap_skills)
        })
    
    return sorted(matches, key=lambda x: x["match_score"], reverse=True)[:5]


@router.get("/placement-metrics")
def get_placement_metrics(db: Session = Depends(get_db)):
    total_placements = db.query(models.Placement).count()
    successful = db.query(models.Placement)\
        .filter(models.Placement.retention_days >= 90).count()
    
    avg_match_score = db.query(func.avg(models.Placement.match_score)).scalar() or 0
    avg_retention = db.query(func.avg(models.Placement.retention_days)).scalar() or 0
    
    return {
        "total_placements": total_placements,
        "successful_placements": successful,
        "success_rate": round(successful / total_placements * 100, 2) if total_placements else 0,
        "avg_match_score": round(avg_match_score, 2),
        "avg_retention_days": round(avg_retention, 1)
    }


@router.put("/update-engagement/{youth_id}")
def update_youth_engagement(
    youth_id: int,
    attendance_rate: float = None,
    assignment_completion: float = None,
    sentiment_score: float = None,
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    if attendance_rate is not None:
        youth.attendance_rate = attendance_rate
    if assignment_completion is not None:
        youth.assignment_completion = assignment_completion
    if sentiment_score is not None:
        youth.sentiment_score = sentiment_score
    
    risk_score, _ = calculate_dropout_risk(youth)
    youth.dropout_risk = risk_score
    
    db.commit()
    
    return {"youth_id": youth_id, "dropout_risk": risk_score}
