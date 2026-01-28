import asyncio
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from ..database import get_db
from .. import models

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp - Messaging"])

TWILIO_ENABLED = False
twilio_client = None
WA_FROM = "simulation_mode"

try:
    from twilio.rest import Client as TwilioClient
    
    ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    WA_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    CONTENT_SID = os.getenv("TWILIO_CONTENT_SID")
    DEFAULT_RPS = float(os.getenv("DEFAULT_RATE_LIMIT_PER_SEC", "5"))
    
    if ACCOUNT_SID and AUTH_TOKEN:
        twilio_client = TwilioClient(ACCOUNT_SID, AUTH_TOKEN)
        TWILIO_ENABLED = True
        print(f"[WhatsApp] Twilio ENABLED - From: {WA_FROM}")
    else:
        print(f"[WhatsApp] Twilio credentials not found - running in SIMULATION mode")
except ImportError:
    print("[WhatsApp] Twilio library not installed - running in SIMULATION mode")


class Recipient(BaseModel):
    to: str = Field(..., description="WhatsApp number with country code")
    variables: Optional[Dict[str, str]] = Field(default=None)
    
    @field_validator("to")
    @classmethod
    def format_whatsapp_number(cls, v: str) -> str:
        if not v.startswith("whatsapp:"):
            if v.startswith("+"):
                v = f"whatsapp:{v}"
            else:
                v = f"whatsapp:+{v}"
        return v


class SendMessageRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=4096)
    recipients: List[str]
    
    @field_validator("recipients")
    @classmethod
    def validate_recipients(cls, v):
        if not v:
            raise ValueError("At least one recipient required")
        return v


class OnboardingMessageRequest(BaseModel):
    youth_id: int
    message_type: str = Field(..., description="welcome, documents, reminder, enrolled")


class NudgeRequest(BaseModel):
    youth_id: int
    nudge_type: str = Field(default="motivational")
    custom_message: Optional[str] = None


class BulkCampaignRequest(BaseModel):
    campaign_name: str
    channel: str = "whatsapp"
    message_body: str
    target_segment: Optional[str] = Field(default=None, description="all, high_potential, at_risk")
    location_filter: Optional[str] = None


class MessageResult(BaseModel):
    to: str
    status: str
    sid: Optional[str] = None
    error: Optional[str] = None


class BulkResponse(BaseModel):
    total: int
    success: int
    failed: int
    results: List[MessageResult]


ONBOARDING_TEMPLATES = {
    "welcome": {
        "en": "Welcome to Magic Bus! You've taken the first step towards a brighter future. Reply with your preferred language: 1. English 2. Hindi 3. Marathi",
        "hi": "Magic Bus में आपका स्वागत है! आपने एक उज्जवल भविष्य की ओर पहला कदम बढ़ाया है।"
    },
    "documents": {
        "en": "Please upload the following documents to complete your enrollment:\n1. Aadhaar Card (photo)\n2. 10th Marksheet\n3. Recent photograph\n\nReply HELP if you need assistance.",
        "hi": "कृपया अपना नामांकन पूरा करने के लिए निम्नलिखित दस्तावेज़ अपलोड करें:\n1. आधार कार्ड\n2. 10वीं की मार्कशीट\n3. हालिया फोटो"
    },
    "reminder": {
        "en": "Reminder: Your Magic Bus application is pending. Complete your profile to secure your spot. Visit the center or reply here.",
        "hi": "अनुस्मारक: आपका Magic Bus आवेदन लंबित है। अपनी जगह सुरक्षित करने के लिए अपनी प्रोफ़ाइल पूरी करें।"
    },
    "enrolled": {
        "en": "Congratulations! You are now enrolled in Magic Bus. Your journey to success begins! Check your schedule and meet your mentor soon.",
        "hi": "बधाई हो! आप अब Magic Bus में नामांकित हैं। सफलता की आपकी यात्रा शुरू होती है!"
    }
}

NUDGE_TEMPLATES = {
    "motivational": "We noticed you've been away. Your peers miss you! Tomorrow's session covers {topic}. Don't miss out on your journey to success.",
    "attendance": "Hi {name}, you've missed {missed_days} sessions. We're here to support you. Reply YES to schedule a catch-up call.",
    "milestone": "Great progress {name}! You've completed {milestone}. Keep going - your dedication is inspiring!",
    "job_opportunity": "Hi {name}, we have a new job opportunity that matches your skills: {job_title} at {company}. Interested? Reply YES."
}


async def send_whatsapp_message(to: str, body: str) -> MessageResult:
    if not to.startswith("whatsapp:"):
        to = f"whatsapp:+{to.lstrip('+')}"
    
    if not TWILIO_ENABLED:
        return MessageResult(
            to=to,
            status="simulated",
            sid=f"SIM_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            error=None
        )
    
    try:
        msg = twilio_client.messages.create(
            from_=WA_FROM,
            to=to,
            body=body
        )
        return MessageResult(to=to, status="queued", sid=msg.sid)
    except Exception as e:
        return MessageResult(to=to, status="failed", error=str(e))


def log_message(db: Session, youth_id: int, action: str, channel: str = "whatsapp"):
    log = models.EngagementLog(
        youth_id=youth_id,
        action=action,
        channel=channel,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()


@router.get("/status")
def get_whatsapp_status():
    return {
        "twilio_enabled": TWILIO_ENABLED,
        "whatsapp_from": WA_FROM if TWILIO_ENABLED else "simulation_mode",
        "mode": "live" if TWILIO_ENABLED else "simulation"
    }


@router.post("/send/onboarding", response_model=MessageResult)
async def send_onboarding_message(
    request: OnboardingMessageRequest,
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == request.youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    if request.message_type not in ONBOARDING_TEMPLATES:
        raise HTTPException(status_code=400, detail="Invalid message type")
    
    template = ONBOARDING_TEMPLATES[request.message_type]["en"]
    result = await send_whatsapp_message(youth.phone, template)
    
    log_message(db, youth.id, f"whatsapp_onboarding_{request.message_type}")
    
    return result


@router.post("/send/nudge", response_model=MessageResult)
async def send_nudge(
    request: NudgeRequest,
    db: Session = Depends(get_db)
):
    youth = db.query(models.Youth).filter(models.Youth.id == request.youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    if request.custom_message:
        message = request.custom_message
    else:
        template = NUDGE_TEMPLATES.get(request.nudge_type, NUDGE_TEMPLATES["motivational"])
        message = template.format(
            name=youth.name.split()[0],
            topic="interview skills",
            missed_days="2",
            milestone="Week 1",
            job_title="Customer Service",
            company="TCS"
        )
    
    result = await send_whatsapp_message(youth.phone, message)
    
    log_message(db, youth.id, f"whatsapp_nudge_{request.nudge_type}")
    
    intervention = models.Intervention(
        youth_id=youth.id,
        intervention_type=f"whatsapp_nudge",
        notes=f"Sent {request.nudge_type} nudge via WhatsApp",
        status="sent"
    )
    db.add(intervention)
    db.commit()
    
    return result


@router.post("/send/bulk", response_model=BulkResponse)
async def send_bulk_messages(
    request: SendMessageRequest,
    db: Session = Depends(get_db)
):
    results = []
    
    for recipient in request.recipients:
        phone = recipient
        if not phone.startswith("whatsapp:"):
            phone = f"whatsapp:+{phone.lstrip('+')}"
        
        result = await send_whatsapp_message(phone, request.body)
        results.append(result)
        await asyncio.sleep(0.2)
    
    success = sum(1 for r in results if r.status in ["queued", "simulated"])
    failed = len(results) - success
    
    return BulkResponse(total=len(results), success=success, failed=failed, results=results)


@router.post("/campaign", response_model=BulkResponse)
async def run_campaign(
    request: BulkCampaignRequest,
    db: Session = Depends(get_db)
):
    query = db.query(models.Youth)
    
    if request.target_segment == "high_potential":
        query = query.filter(models.Youth.scout_score >= 80)
    elif request.target_segment == "at_risk":
        query = query.filter(
            models.Youth.onboarding_status == "enrolled",
            models.Youth.dropout_risk >= 50
        )
    elif request.target_segment == "enrolled":
        query = query.filter(models.Youth.onboarding_status == "enrolled")
    
    if request.location_filter:
        query = query.filter(models.Youth.location == request.location_filter)
    
    youth_list = query.all()
    
    if not youth_list:
        raise HTTPException(status_code=404, detail="No recipients match the criteria")
    
    results = []
    for youth in youth_list:
        personalized_message = request.message_body.replace("{name}", youth.name.split()[0])
        result = await send_whatsapp_message(youth.phone, personalized_message)
        results.append(result)
        
        log_message(db, youth.id, f"campaign_{request.campaign_name}")
        await asyncio.sleep(0.2)
    
    success = sum(1 for r in results if r.status in ["queued", "simulated"])
    failed = len(results) - success
    
    campaign_log = models.ChannelPerformance(
        channel="whatsapp",
        campaign_name=request.campaign_name,
        date=datetime.utcnow(),
        reach=len(results),
        clicks=0,
        conversions=0,
        cost=len(results) * 0.5
    )
    db.add(campaign_log)
    db.commit()
    
    return BulkResponse(total=len(results), success=success, failed=failed, results=results)


@router.get("/templates")
def get_message_templates():
    return {
        "onboarding": list(ONBOARDING_TEMPLATES.keys()),
        "nudges": list(NUDGE_TEMPLATES.keys()),
        "templates": {
            "onboarding": {k: v["en"] for k, v in ONBOARDING_TEMPLATES.items()},
            "nudges": NUDGE_TEMPLATES
        }
    }


@router.post("/simulate/conversation")
async def simulate_onboarding_conversation(
    phone: str,
    name: str,
    age: int,
    location: str,
    education: str,
    db: Session = Depends(get_db)
):
    from .scout import calculate_scout_score
    
    existing = db.query(models.Youth).filter(models.Youth.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    conversation_flow = []
    
    conversation_flow.append({
        "direction": "outbound",
        "message": ONBOARDING_TEMPLATES["welcome"]["en"],
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation_flow.append({
        "direction": "inbound",
        "message": f"Hi, I am {name}",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation_flow.append({
        "direction": "outbound",
        "message": f"Great {name}! Let me collect some details. What is your age?",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation_flow.append({
        "direction": "inbound",
        "message": str(age),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation_flow.append({
        "direction": "outbound",
        "message": "What is your highest education qualification?",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation_flow.append({
        "direction": "inbound",
        "message": education,
        "timestamp": datetime.utcnow().isoformat()
    })
    
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
        income_bracket="middle",
        scout_score=scout_score,
        onboarding_status="interested",
        skills=[],
        interests=[]
    )
    db.add(db_youth)
    db.commit()
    db.refresh(db_youth)
    
    conversation_flow.append({
        "direction": "outbound",
        "message": f"Thank you {name}! You've been registered. Your SCOUT score is {scout_score:.0f}. " + ONBOARDING_TEMPLATES["documents"]["en"],
        "timestamp": datetime.utcnow().isoformat()
    })
    
    log_message(db, db_youth.id, "whatsapp_onboarding_complete")
    
    return {
        "youth_id": db_youth.id,
        "scout_score": scout_score,
        "status": "interested",
        "conversation": conversation_flow,
        "next_step": "document_upload"
    }


class MarketingRecipient(BaseModel):
    to: str
    name: Optional[str] = "User"


class MarketingSendRequest(BaseModel):
    message_template: str = Field(..., min_length=1, max_length=4096)
    recipients: List[MarketingRecipient]


@router.post("/marketing/send", response_model=BulkResponse)
async def send_marketing_messages(request: MarketingSendRequest):
    results = []
    
    for recipient in request.recipients:
        to_number = recipient.to
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
        
        personalized_message = request.message_template.replace("{name}", recipient.name or "User")
        
        if not TWILIO_ENABLED:
            results.append(MessageResult(
                to=to_number,
                status="queued",
                sid=f"SIM_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(results)}",
                error=None
            ))
        else:
            try:
                msg = twilio_client.messages.create(
                    from_=WA_FROM,
                    to=to_number,
                    body=personalized_message
                )
                results.append(MessageResult(to=to_number, status="queued", sid=msg.sid))
            except Exception as e:
                results.append(MessageResult(to=to_number, status="failed", error=str(e)))
        
        await asyncio.sleep(0.2)
    
    success = sum(1 for r in results if r.status == "queued")
    failed = len(results) - success
    
    return BulkResponse(total=len(results), success=success, failed=failed, results=results)
