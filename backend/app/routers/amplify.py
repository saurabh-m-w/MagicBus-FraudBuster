from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import math
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
    
    # Cost per reach (cost to reach one person through this channel)
    cost_per_reach = {
        "whatsapp": 0.5,        # Very low cost per message
        "sms": 0.3,             # Low cost
        "community_event": 15,   # Higher cost (venue, logistics)
        "social_media": 2,       # Medium cost (ads)
        "referral": 5,           # Incentive cost
        "school_partnership": 8, # Partnership costs
        "self_registration": 0.1 # Almost free (organic)
    }
    
    # Channel effectiveness multipliers (based on typical conversion patterns)
    effectiveness_multiplier = {
        "whatsapp": 1.8,         # High engagement
        "sms": 0.6,              # Lower engagement
        "community_event": 2.5,   # Very high (face-to-face)
        "social_media": 0.8,      # Medium
        "referral": 3.0,          # Highest (trust factor)
        "school_partnership": 1.5, # Good (captive audience)
        "self_registration": 1.2   # Good (self-motivated)
    }
    
    results = []
    for channel in channels:
        channel_name = channel[0]
        total = channel[1]
        conversions = enrolled_map.get(channel_name, 0)
        cost_reach = cost_per_reach.get(channel_name, 1)
        effectiveness = effectiveness_multiplier.get(channel_name, 1.0)
        
        # Calculate actual conversion rate
        conversion_rate = (conversions / total * 100) if total else 0
        
        # Total cost for this channel
        total_cost = cost_reach * total
        
        # Cost per conversion
        cost_per_conversion = (total_cost / conversions) if conversions else total_cost
        
        # ROI Score formula:
        # Higher conversions + Lower cost + Higher effectiveness = Higher ROI
        # Normalize to 0-5 scale with variation
        if conversions > 0:
            # Base ROI: conversions per rupee spent, scaled
            base_roi = (conversions / max(total_cost, 1)) * 100
            # Apply effectiveness multiplier
            adjusted_roi = base_roi * effectiveness
            # Normalize to 0-5 with better distribution
            roi_score = min(5.0, max(0.5, adjusted_roi * 0.5))
        else:
            roi_score = 0.5
        
        results.append({
            "channel": channel_name,
            "reach": total,
            "conversions": conversions,
            "conversion_rate": round(conversion_rate, 2),
            "cost_per_conversion": round(cost_per_conversion, 2),
            "avg_scout_score": round(channel[2], 2) if channel[2] else 0,
            "roi_score": round(roi_score, 2)
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
    
    # Use a weighted scoring system that emphasizes differences
    # Weight = ROI^2 * log(conversions + 1) to amplify differences
    weights = []
    for p in performance:
        # Square the ROI to amplify differences
        roi_weight = p["roi_score"] ** 2
        # Add conversion volume bonus (log scale to prevent domination)
        volume_bonus = math.log(p["conversions"] + 1) + 1
        # Combined weight
        weight = roi_weight * volume_bonus
        weights.append(weight)
    
    total_weight = sum(weights) if sum(weights) > 0 else 1
    
    recommendations = []
    for i, p in enumerate(performance):
        # Allocate budget proportionally to weight
        if total_weight > 0:
            allocation = (weights[i] / total_weight) * total_budget
        else:
            allocation = total_budget / len(performance)
        
        # Calculate expected conversions based on historical cost per conversion
        if p["cost_per_conversion"] > 0:
            expected_conv = allocation / p["cost_per_conversion"]
        else:
            expected_conv = 0
        
        # Apply a conversion rate adjustment (higher ROI = better conversion)
        conversion_efficiency = p["roi_score"] / 5.0  # 0-1 scale
        adjusted_conversions = expected_conv * (0.5 + conversion_efficiency * 0.5)
        
        recommendations.append({
            "channel": p["channel"],
            "current_roi_score": p["roi_score"],
            "recommended_budget": round(allocation, 2),
            "budget_percentage": round((allocation / total_budget) * 100, 1),
            "expected_conversions": round(adjusted_conversions)
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
