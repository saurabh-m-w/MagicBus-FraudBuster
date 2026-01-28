from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from .. import models

router = APIRouter(prefix="/amplify", tags=["AMPLIFY - Channel Optimization"])


@router.get("/channel-performance")
def get_channel_performance(db: Session = Depends(get_db)):
    channels = db.query(
        models.Youth.source_channel,
        func.count(models.Youth.id).label("total"),
        func.avg(models.Youth.scout_score).label("avg_score")
    ).group_by(models.Youth.source_channel).all()
    
    enrolled = db.query(
        models.Youth.source_channel,
        func.count(models.Youth.id).label("enrolled")
    ).filter(
        models.Youth.onboarding_status == "enrolled"
    ).group_by(models.Youth.source_channel).all()
    
    enrolled_map = {e[0]: e[1] for e in enrolled}
    
    cost_per_channel = {
        "whatsapp": 20, "sms": 50, "community_event": 150,
        "social_media": 100, "referral": 30, "school_partnership": 80
    }
    
    results = []
    for channel in channels:
        channel_name = channel[0]
        total = channel[1]
        conversions = enrolled_map.get(channel_name, 0)
        cost = cost_per_channel.get(channel_name, 50)
        
        conversion_rate = (conversions / total * 100) if total else 0
        cost_per_conversion = (cost * total / conversions) if conversions else 0
        roi_score = (conversion_rate / (cost / 100)) if cost else 0
        
        results.append({
            "channel": channel_name,
            "reach": total,
            "conversions": conversions,
            "conversion_rate": round(conversion_rate, 2),
            "cost_per_conversion": round(cost_per_conversion, 2),
            "avg_scout_score": round(channel[2], 2),
            "roi_score": round(min(5, roi_score), 2)
        })
    
    return sorted(results, key=lambda x: x["roi_score"], reverse=True)


@router.get("/attribution")
def get_attribution_analysis(db: Session = Depends(get_db)):
    total_enrolled = db.query(models.Youth)\
        .filter(models.Youth.onboarding_status == "enrolled").count()
    
    by_channel = db.query(
        models.Youth.source_channel,
        func.count(models.Youth.id).label("count")
    ).filter(
        models.Youth.onboarding_status == "enrolled"
    ).group_by(models.Youth.source_channel).all()
    
    return {
        "total_conversions": total_enrolled,
        "attribution": [
            {
                "channel": c[0],
                "conversions": c[1],
                "percentage": round(c[1] / total_enrolled * 100, 2) if total_enrolled else 0
            }
            for c in by_channel
        ]
    }


@router.get("/budget-recommendation")
def get_budget_recommendation(total_budget: float = 100000, db: Session = Depends(get_db)):
    performance = get_channel_performance(db)
    
    total_roi = sum(p["roi_score"] for p in performance)
    
    recommendations = []
    for p in performance:
        if total_roi > 0:
            allocation = (p["roi_score"] / total_roi) * total_budget
        else:
            allocation = total_budget / len(performance)
        
        recommendations.append({
            "channel": p["channel"],
            "current_roi_score": p["roi_score"],
            "recommended_budget": round(allocation, 2),
            "expected_conversions": round(allocation / p["cost_per_conversion"]) if p["cost_per_conversion"] else 0
        })
    
    return {
        "total_budget": total_budget,
        "recommendations": sorted(recommendations, key=lambda x: x["recommended_budget"], reverse=True)
    }


@router.get("/trends")
def get_channel_trends(days: int = 30, db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days)
    
    daily_data = db.query(
        func.date(models.Youth.created_at).label("date"),
        models.Youth.source_channel,
        func.count(models.Youth.id).label("count")
    ).filter(
        models.Youth.created_at >= datetime.combine(start_date, datetime.min.time())
    ).group_by(
        func.date(models.Youth.created_at),
        models.Youth.source_channel
    ).all()
    
    trends = {}
    for row in daily_data:
        date_str = str(row[0])
        if date_str not in trends:
            trends[date_str] = {}
        trends[date_str][row[1]] = row[2]
    
    return trends


@router.post("/log-campaign")
def log_campaign_performance(
    channel: str,
    campaign_name: str,
    reach: int,
    clicks: int,
    conversions: int,
    cost: float,
    db: Session = Depends(get_db)
):
    campaign = models.ChannelPerformance(
        channel=channel,
        campaign_name=campaign_name,
        date=datetime.utcnow(),
        reach=reach,
        clicks=clicks,
        conversions=conversions,
        cost=cost
    )
    db.add(campaign)
    db.commit()
    
    return {"message": "Campaign logged successfully", "id": campaign.id}
