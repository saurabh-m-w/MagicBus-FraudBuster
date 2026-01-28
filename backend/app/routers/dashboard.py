from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(models.Youth).count()
    enrolled = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").count()
    dropped = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "dropped").count()
    
    enrolled_with_dates = db.query(models.Youth)\
        .filter(
            models.Youth.onboarding_status == "enrolled",
            models.Youth.enrolled_date.isnot(None),
            models.Youth.created_at.isnot(None)
        ).all()
    
    if enrolled_with_dates:
        total_days = sum(
            (y.enrolled_date - y.created_at).days 
            for y in enrolled_with_dates
        )
        avg_days = total_days / len(enrolled_with_dates)
    else:
        avg_days = 0
    
    placements = db.query(models.Placement).count()
    placement_rate = (placements / enrolled * 100) if enrolled else 0
    
    high_risk = db.query(models.Youth)\
        .filter(
            models.Youth.onboarding_status == "enrolled",
            models.Youth.dropout_risk >= 50
        ).count()
    
    return {
        "total_candidates": total,
        "enrolled_count": enrolled,
        "dropout_rate": round((dropped / total * 100) if total else 0, 2),
        "avg_onboarding_days": round(avg_days, 1),
        "placement_rate": round(placement_rate, 2),
        "high_risk_count": high_risk
    }


@router.get("/funnel")
def get_conversion_funnel(db: Session = Depends(get_db)):
    stages = [
        ("discovered", "Discovered"),
        ("interested", "Interested"),
        ("documents_pending", "Documents Pending"),
        ("documents_submitted", "Documents Submitted"),
        ("verified", "Verified"),
        ("enrolled", "Enrolled")
    ]
    
    funnel = []
    for status, label in stages:
        count = db.query(models.Youth)\
            .filter(models.Youth.onboarding_status == status).count()
        funnel.append({"stage": label, "status": status, "count": count})
    
    return funnel


@router.get("/recent-activity")
def get_recent_activity(limit: int = 10, db: Session = Depends(get_db)):
    recent_youth = db.query(models.Youth)\
        .order_by(models.Youth.created_at.desc())\
        .limit(limit).all()
    
    activities = []
    for y in recent_youth:
        activities.append({
            "type": "new_candidate",
            "name": y.name,
            "status": y.onboarding_status,
            "channel": y.source_channel,
            "timestamp": y.created_at.isoformat() if y.created_at else None
        })
    
    return activities


@router.get("/pillar-summary")
def get_pillar_summary(db: Session = Depends(get_db)):
    total = db.query(models.Youth).count()
    
    high_potential = db.query(models.Youth)\
        .filter(models.Youth.scout_score >= 80).count()
    
    enrolled = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").count()
    
    best_channel = db.query(
        models.Youth.source_channel,
        func.count(models.Youth.id).label("count")
    ).filter(
        models.Youth.onboarding_status == "enrolled"
    ).group_by(models.Youth.source_channel)\
        .order_by(func.count(models.Youth.id).desc()).first()
    
    at_risk = db.query(models.Youth)\
        .filter(
            models.Youth.onboarding_status == "enrolled",
            models.Youth.dropout_risk >= 50
        ).count()
    
    return {
        "scout": {
            "title": "SCOUT",
            "metric": f"{high_potential} high-potential",
            "description": "candidates identified"
        },
        "streamline": {
            "title": "STREAMLINE",
            "metric": f"{enrolled} enrolled",
            "description": f"out of {total} candidates"
        },
        "amplify": {
            "title": "AMPLIFY",
            "metric": best_channel[0] if best_channel else "N/A",
            "description": "top performing channel"
        },
        "thrive": {
            "title": "THRIVE",
            "metric": f"{at_risk} at-risk",
            "description": "need intervention"
        }
    }
