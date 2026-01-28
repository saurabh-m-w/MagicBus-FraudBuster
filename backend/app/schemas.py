from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class OnboardingStatus(str, Enum):
    DISCOVERED = "discovered"
    INTERESTED = "interested"
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_SUBMITTED = "documents_submitted"
    VERIFIED = "verified"
    ENROLLED = "enrolled"
    DROPPED = "dropped"


class Channel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    COMMUNITY_EVENT = "community_event"
    SOCIAL_MEDIA = "social_media"
    REFERRAL = "referral"
    SCHOOL_PARTNERSHIP = "school_partnership"
    SELF_REGISTRATION = "self_registration"


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: int
    name: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None


class AdminCreate(BaseModel):
    email: str
    password: str
    name: str


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class YouthSignup(BaseModel):
    email: str
    password: str
    phone: str
    first_name: str
    last_name: str


class YouthLogin(BaseModel):
    email: str
    password: str


class YouthProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    location: Optional[str] = None
    
    # Identity documents
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    bpl_card_number: Optional[str] = None
    
    # Education details
    education_level: Optional[str] = None
    education_details: Optional[str] = None
    institution_name: Optional[str] = None
    year_of_passing: Optional[int] = None
    percentage_10th: Optional[float] = None
    percentage_12th: Optional[float] = None
    percentage_graduation: Optional[float] = None
    
    # Family details
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    income_bracket: Optional[str] = None
    family_income: Optional[float] = None
    
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    work_experience: Optional[List[dict]] = None
    preferred_job_roles: Optional[List[str]] = None

    @field_validator('age', 'year_of_passing', mode='before')
    @classmethod
    def empty_str_to_none_int(cls, v: Any) -> Optional[int]:
        if v == '' or v is None:
            return None
        if isinstance(v, str):
            return int(v)
        return v

    @field_validator('family_income', 'percentage_10th', 'percentage_12th', 'percentage_graduation', mode='before')
    @classmethod
    def empty_str_to_none_float(cls, v: Any) -> Optional[float]:
        if v == '' or v is None:
            return None
        if isinstance(v, str):
            return float(v)
        return v

    @field_validator('aadhar_number', 'pan_number', 'bpl_card_number', 'alternate_phone', 
                     'address', 'education_details', 'institution_name', 'father_name',
                     'mother_name', 'guardian_phone', mode='before')
    @classmethod
    def empty_str_to_none_str(cls, v: Any) -> Optional[str]:
        if v == '' or v is None:
            return None
        return v


class YouthBase(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
    location: str
    education_level: str
    income_bracket: Optional[str] = None


class YouthCreate(YouthBase):
    source_channel: Channel = Channel.SELF_REGISTRATION


class Youth(YouthBase):
    id: int
    email: Optional[str] = None
    scout_score: float
    onboarding_status: OnboardingStatus
    dropout_risk: float
    source_channel: str
    enrolled_date: Optional[datetime] = None
    created_at: datetime
    profile_completed: bool = False

    class Config:
        from_attributes = True


class YouthDetail(Youth):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # Identity documents
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    bpl_card_number: Optional[str] = None
    
    # Document file paths
    aadhar_doc_path: Optional[str] = None
    pan_doc_path: Optional[str] = None
    bpl_doc_path: Optional[str] = None
    photo_path: Optional[str] = None
    cert_10th_path: Optional[str] = None
    cert_12th_path: Optional[str] = None
    cert_graduation_path: Optional[str] = None
    cert_other_path: Optional[str] = None
    
    # Education details
    education_details: Optional[str] = None
    institution_name: Optional[str] = None
    year_of_passing: Optional[int] = None
    percentage_10th: Optional[float] = None
    percentage_12th: Optional[float] = None
    percentage_graduation: Optional[float] = None
    
    # Family details
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    family_income: Optional[float] = None
    
    skills: List[str] = []
    interests: List[str] = []
    work_experience: List[dict] = []
    preferred_job_roles: List[str] = []
    attendance_rate: float = 0.0
    assignment_completion: float = 0.0
    sentiment_score: float = 0.5
    documents_uploaded: bool = False


class YouthPublicProfile(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: str
    alternate_phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # Identity documents
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    bpl_card_number: Optional[str] = None
    
    # Document status
    aadhar_doc_path: Optional[str] = None
    pan_doc_path: Optional[str] = None
    bpl_doc_path: Optional[str] = None
    photo_path: Optional[str] = None
    cert_10th_path: Optional[str] = None
    cert_12th_path: Optional[str] = None
    cert_graduation_path: Optional[str] = None
    cert_other_path: Optional[str] = None
    
    # Education
    education_level: Optional[str] = None
    education_details: Optional[str] = None
    institution_name: Optional[str] = None
    year_of_passing: Optional[int] = None
    percentage_10th: Optional[float] = None
    percentage_12th: Optional[float] = None
    percentage_graduation: Optional[float] = None
    
    # Family
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    income_bracket: Optional[str] = None
    family_income: Optional[float] = None
    
    skills: List[str] = []
    interests: List[str] = []
    preferred_job_roles: List[str] = []
    onboarding_status: str
    profile_completed: bool
    documents_uploaded: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChannelStats(BaseModel):
    channel: Channel
    reach: int
    conversions: int
    cost: float
    roi_score: float
    conversion_rate: float


class OnboardingStep(BaseModel):
    step_name: str
    status: str
    completed_at: Optional[datetime] = None


class DropoutAlert(BaseModel):
    youth_id: int
    youth_name: str
    risk_level: RiskLevel
    risk_score: float
    risk_factors: List[str]
    recommended_intervention: str


class JobMatch(BaseModel):
    job_id: int
    job_title: str
    company: str
    location: str
    salary_range: str
    match_score: float
    skills_matched: List[str]
    skills_gap: List[str]


class DashboardStats(BaseModel):
    total_candidates: int
    enrolled_count: int
    dropout_rate: float
    avg_onboarding_days: float
    placement_rate: float
    high_risk_count: int


class InterventionCreate(BaseModel):
    youth_id: int
    intervention_type: str
    notes: Optional[str] = None


class Intervention(InterventionCreate):
    id: int
    created_at: datetime
    status: str

    class Config:
        from_attributes = True
