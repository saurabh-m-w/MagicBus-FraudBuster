import os
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from openai import AzureOpenAI
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from ..database import get_db
from .. import models
from .auth import get_current_youth, get_current_user

router = APIRouter(prefix="/ai", tags=["AI Agent"])

AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-06")

client = None
AI_ENABLED = False

try:
    if AZURE_API_KEY and AZURE_ENDPOINT:
        client = AzureOpenAI(
            api_key=AZURE_API_KEY,
            api_version=AZURE_API_VERSION,
            azure_endpoint=AZURE_ENDPOINT.replace("/openai/v1/", "")
        )
        AI_ENABLED = True
        print(f"[AI Agent] Azure OpenAI ENABLED - Model: {AZURE_DEPLOYMENT}")
    else:
        print("[AI Agent] Azure OpenAI credentials not found - AI features disabled")
except Exception as e:
    print(f"[AI Agent] Failed to initialize Azure OpenAI: {e}")


SYSTEM_PROMPT = """You are PathFinder AI, a helpful assistant for the Magic Bus youth mobilisation programme in India.

Your role is to help young people (ages 18-25) with:
1. Understanding the Magic Bus programme and its benefits
2. Guiding them through the registration and onboarding process
3. Answering questions about skill training and job placement
4. Providing information about required documents (Aadhar, PAN, BPL card)
5. Helping them track their application status

Key information about Magic Bus:
- Free skill training programme for underprivileged youth
- Helps with job placement after training
- Requires basic documents: Aadhar card (mandatory), PAN card (optional), BPL card (if applicable)
- Programme stages: Registration → Profile Completion → Document Submission → Verification → Enrollment → Training → Placement

Be friendly, supportive, and use simple language. Respond in the same language the user writes in (Hindi or English).
Keep responses concise but helpful. Always encourage users to complete their profile and submit documents.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []


@router.get("/status")
def get_ai_status():
    return {
        "ai_enabled": AI_ENABLED,
        "model": AZURE_DEPLOYMENT if AI_ENABLED else None,
        "provider": "Azure OpenAI" if AI_ENABLED else None
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not AI_ENABLED:
        return ChatResponse(
            response="AI assistant is currently unavailable. Please try again later or contact support.",
            suggestions=["Check application status", "Update profile", "Contact support"]
        )
    
    user = current_user["user"]
    user_type = current_user["user_type"]
    
    user_context = ""
    if user_type == "youth":
        user_context = f"""
Current user context:
- Name: {user.name}
- Onboarding Status: {user.onboarding_status}
- Profile Completed: {user.profile_completed}
- Documents Uploaded: {user.documents_uploaded}
- Education: {user.education_level}
"""
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + user_context}
    ]
    
    for msg in request.conversation_history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    
    messages.append({"role": "user", "content": request.message})
    
    try:
        completion = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = completion.choices[0].message.content
        
        suggestions = generate_suggestions(user if user_type == "youth" else None, request.message)
        
        if user_type == "youth":
            log_interaction(db, user.id, request.message, response_text)
        
        return ChatResponse(response=response_text, suggestions=suggestions)
        
    except Exception as e:
        print(f"[AI Agent] Error: {e}")
        return ChatResponse(
            response="I apologize, but I'm having trouble processing your request. Please try again.",
            suggestions=["Try again", "Contact support"]
        )


@router.post("/analyze-profile")
async def analyze_profile(
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    if not AI_ENABLED:
        return {"analysis": "AI analysis unavailable", "recommendations": []}
    
    profile_data = f"""
Analyze this youth profile and provide recommendations:
- Name: {current_youth.name}
- Age: {current_youth.age}
- Education: {current_youth.education_level}
- Location: {current_youth.location}
- Skills: {current_youth.skills}
- Interests: {current_youth.interests}
- Profile Completed: {current_youth.profile_completed}
- Documents Uploaded: {current_youth.documents_uploaded}
- Onboarding Status: {current_youth.onboarding_status}

Provide:
1. A brief profile strength analysis
2. 3 specific recommendations to improve their chances
3. Suggested job roles based on their profile
"""
    
    try:
        completion = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a career counselor for Magic Bus. Analyze profiles and give actionable advice."},
                {"role": "user", "content": profile_data}
            ],
            temperature=0.7,
            max_tokens=600
        )
        
        return {
            "analysis": completion.choices[0].message.content,
            "scout_score": current_youth.scout_score,
            "profile_strength": calculate_profile_strength(current_youth)
        }
        
    except Exception as e:
        print(f"[AI Agent] Profile analysis error: {e}")
        return {"analysis": "Unable to analyze profile", "recommendations": []}


@router.post("/validate-document")
async def validate_document(
    document_type: str,
    document_value: str,
    db: Session = Depends(get_db)
):
    validations = {
        "aadhar": {
            "valid": len(document_value.replace(" ", "")) == 12 and document_value.replace(" ", "").isdigit(),
            "format": "12 digits",
            "message": "Aadhar number should be exactly 12 digits"
        },
        "pan": {
            "valid": len(document_value) == 10 and document_value[:5].isalpha() and document_value[5:9].isdigit() and document_value[9].isalpha(),
            "format": "ABCDE1234F",
            "message": "PAN should be 5 letters + 4 digits + 1 letter"
        },
        "bpl": {
            "valid": len(document_value) >= 5,
            "format": "State-specific format",
            "message": "BPL card number format varies by state"
        }
    }
    
    doc_type = document_type.lower()
    if doc_type not in validations:
        return {"valid": False, "message": "Unknown document type"}
    
    validation = validations[doc_type]
    
    return {
        "document_type": document_type,
        "valid": validation["valid"],
        "expected_format": validation["format"],
        "message": "Valid format" if validation["valid"] else validation["message"]
    }


@router.post("/generate-nudge")
async def generate_personalized_nudge(
    youth_id: int,
    nudge_type: str = "engagement",
    db: Session = Depends(get_db)
):
    if not AI_ENABLED:
        return {"nudge": "Complete your profile to unlock opportunities!", "type": nudge_type}
    
    youth = db.query(models.Youth).filter(models.Youth.id == youth_id).first()
    if not youth:
        raise HTTPException(status_code=404, detail="Youth not found")
    
    context = f"""
Generate a short, motivational WhatsApp message (max 100 words) for:
- Name: {youth.name}
- Status: {youth.onboarding_status}
- Profile Complete: {youth.profile_completed}
- Documents Uploaded: {youth.documents_uploaded}
- Nudge Type: {nudge_type}

The message should be friendly, encouraging, and include a clear call-to-action.
Write in simple English that can be understood by someone with basic English skills.
"""
    
    try:
        completion = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You write short, friendly WhatsApp messages for youth in India."},
                {"role": "user", "content": context}
            ],
            temperature=0.8,
            max_tokens=150
        )
        
        return {
            "nudge": completion.choices[0].message.content,
            "type": nudge_type,
            "youth_id": youth_id
        }
        
    except Exception as e:
        return {"nudge": f"Hi {youth.name}! Don't forget to complete your Magic Bus application.", "type": nudge_type}


def generate_suggestions(youth: Optional[models.Youth], message: str) -> List[str]:
    suggestions = []
    
    if youth:
        if not youth.profile_completed:
            suggestions.append("How do I complete my profile?")
        if not youth.documents_uploaded:
            suggestions.append("What documents do I need?")
        if youth.onboarding_status == "documents_submitted":
            suggestions.append("When will my documents be verified?")
        if youth.onboarding_status == "enrolled":
            suggestions.append("What training programmes are available?")
    
    if not suggestions:
        suggestions = [
            "Tell me about Magic Bus",
            "How do I apply?",
            "What jobs can I get?"
        ]
    
    return suggestions[:3]


def calculate_profile_strength(youth: models.Youth) -> dict:
    score = 0
    max_score = 100
    breakdown = {}
    
    if youth.first_name and youth.last_name:
        score += 10
        breakdown["name"] = True
    
    if youth.age and youth.age > 0:
        score += 10
        breakdown["age"] = True
    
    if youth.education_level and youth.education_level != "Not specified":
        score += 15
        breakdown["education"] = True
    
    if youth.city and youth.state:
        score += 10
        breakdown["location"] = True
    
    if youth.aadhar_number and len(youth.aadhar_number) == 12:
        score += 20
        breakdown["aadhar"] = True
    
    if youth.skills and len(youth.skills) > 0:
        score += 15
        breakdown["skills"] = True
    
    if youth.interests and len(youth.interests) > 0:
        score += 10
        breakdown["interests"] = True
    
    if youth.phone:
        score += 10
        breakdown["phone"] = True
    
    return {
        "score": score,
        "max_score": max_score,
        "percentage": round(score / max_score * 100),
        "breakdown": breakdown
    }


def log_interaction(db: Session, youth_id: int, user_message: str, ai_response: str):
    try:
        log = models.EngagementLog(
            youth_id=youth_id,
            action="ai_chat",
            channel="web",
            session_duration=0
        )
        db.add(log)
        db.commit()
    except:
        pass
