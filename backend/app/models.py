from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class RiskLevelEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class OnboardingStatusEnum(str, enum.Enum):
    DISCOVERED = "discovered"
    INTERESTED = "interested"
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_SUBMITTED = "documents_submitted"
    VERIFIED = "verified"
    ENROLLED = "enrolled"
    DROPPED = "dropped"


class ChannelEnum(str, enum.Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    COMMUNITY_EVENT = "community_event"
    SOCIAL_MEDIA = "social_media"
    REFERRAL = "referral"
    SCHOOL_PARTNERSHIP = "school_partnership"


class UserRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    YOUTH = "youth"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Youth(Base):
    __tablename__ = "youth"

    id = Column(Integer, primary_key=True, index=True)
    
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    
    name = Column(String(100), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    age = Column(Integer, nullable=False)
    date_of_birth = Column(DateTime)
    gender = Column(String(20), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    alternate_phone = Column(String(20))
    location = Column(String(200), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    
    aadhar_number = Column(String(12))
    aadhar_verified = Column(Boolean, default=False)
    pan_number = Column(String(10))
    bpl_card_number = Column(String(50))
    
    # Document file paths
    aadhar_doc_path = Column(String(500))
    pan_doc_path = Column(String(500))
    bpl_doc_path = Column(String(500))
    photo_path = Column(String(500))
    
    # Education certificates
    cert_10th_path = Column(String(500))
    cert_12th_path = Column(String(500))
    cert_graduation_path = Column(String(500))
    cert_other_path = Column(String(500))
    
    education_level = Column(String(50), nullable=False)
    education_details = Column(String(200))
    institution_name = Column(String(200))
    year_of_passing = Column(Integer)
    percentage_10th = Column(Float)
    percentage_12th = Column(Float)
    percentage_graduation = Column(Float)
    income_bracket = Column(String(50))
    family_income = Column(Float)
    
    # Additional details
    father_name = Column(String(100))
    mother_name = Column(String(100))
    guardian_phone = Column(String(20))
    
    scout_score = Column(Float, default=0.0)
    onboarding_status = Column(String(30), default=OnboardingStatusEnum.DISCOVERED.value)
    dropout_risk = Column(Float, default=0.0)
    source_channel = Column(String(30), default="self_registration")
    
    skills = Column(JSON, default=list)
    interests = Column(JSON, default=list)
    work_experience = Column(JSON, default=list)
    preferred_job_roles = Column(JSON, default=list)
    
    attendance_rate = Column(Float, default=0.0)
    assignment_completion = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.5)
    
    profile_completed = Column(Boolean, default=False)
    documents_uploaded = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    enrolled_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    interventions = relationship("Intervention", back_populates="youth")
    engagement_logs = relationship("EngagementLog", back_populates="youth")


class ChannelPerformance(Base):
    __tablename__ = "channel_performance"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(30), nullable=False)
    date = Column(DateTime, nullable=False)
    reach = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    campaign_name = Column(String(100))


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    youth_id = Column(Integer, ForeignKey("youth.id"), nullable=False)
    intervention_type = Column(String(50), nullable=False)
    notes = Column(String(500))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)

    youth = relationship("Youth", back_populates="interventions")


class EngagementLog(Base):
    __tablename__ = "engagement_logs"

    id = Column(Integer, primary_key=True, index=True)
    youth_id = Column(Integer, ForeignKey("youth.id"), nullable=False)
    action = Column(String(50), nullable=False)
    channel = Column(String(30))
    session_duration = Column(Integer, default=0)
    sentiment = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

    youth = relationship("Youth", back_populates="engagement_logs")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    company = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    required_skills = Column(JSON, default=list)
    description = Column(String(1000))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())


class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, index=True)
    youth_id = Column(Integer, ForeignKey("youth.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    match_score = Column(Float)
    status = Column(String(20), default="matched")
    placed_date = Column(DateTime)
    retention_days = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
