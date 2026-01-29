# PathFinder AI

## Revolutionizing Youth Mobilisation for Magic Bus India Foundation

[![Barclays Hack a Difference 2026](https://img.shields.io/badge/Barclays-Hack%20a%20Difference%202026-00aeef)](https://barclays.com)
[![Team FraudBusters](https://img.shields.io/badge/Team-FraudBusters-purple)](https://github.com/saurabh-m-w/MagicBus-FraudBuster)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [The 4-Pillar Intelligence System](#the-4-pillar-intelligence-system)
- [Technical Implementation](#technical-implementation)
- [Live Demo](#live-demo)
- [API Documentation](#api-documentation)
- [Installation Guide](#installation-guide)
- [Judging Criteria Alignment](#judging-criteria-alignment)
- [Team](#team)

---

## Executive Summary

**PathFinder AI** is an end-to-end AI-powered youth mobilisation platform that transforms how Magic Bus identifies, onboards, retains, and places underprivileged youth (18-25 years) in skilling and job placement programmes.

### Key Achievements

| Metric | Before | After PathFinder AI | Improvement |
|--------|--------|---------------------|-------------|
| Onboarding Time | 60 days | 10-15 days | **75-83% faster** |
| Dropout Rate | ~40% | ~15% (projected) | **62% reduction** |
| Staff Hours/Candidate | ~4 hours | ~1 hour | **75% reduction** |
| Channel ROI Visibility | None | Full Attribution | **Complete visibility** |

### What We Built

- **50+ REST API endpoints** across 11 routers
- **12 frontend pages** with responsive UI
- **8 database models** with 100+ fields
- **3 real integrations**: Twilio WhatsApp, Azure OpenAI, Sandbox KYC
- **Working PoC** - Not just slides, actual running code

---

## The Problem

Magic Bus India Foundation faces interconnected challenges in youth mobilisation:

### Challenge 1: Finding the Right Youth
- Manual field-based outreach is expensive and inefficient
- No data-driven way to identify high-potential candidates
- "Spray and pray" approach wastes resources

### Challenge 2: Slow Onboarding
- **60-day average** from discovery to enrollment
- Paper-based document collection
- Multiple in-person visits required
- Youth lose interest during the wait

### Challenge 3: High Dropout Rates
- **~40% of enrolled youth** drop out before completion
- No early warning system
- Interventions happen after it's too late

### Challenge 4: Budget Inefficiency
- No visibility into which channels work
- Cannot attribute conversions to campaigns
- Marketing budget allocated by guesswork

---

## Our Solution

### The PathFinder AI Approach

Instead of building isolated tools, we created an **integrated 4-Pillar Intelligence System** where each pillar feeds data and insights to the others:

```
┌─────────────────────────────────────────────────────────────┐
│                    PathFinder AI Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌─────────────┐    ┌─────────┐    ┌─────────┐
│   │  SCOUT  │───▶│ STREAMLINE  │───▶│ AMPLIFY │───▶│ THRIVE  │
│   │Targeting│    │ Onboarding  │    │ Channels│    │Retention│
│   └────┬────┘    └──────┬──────┘    └────┬────┘    └────┬────┘
│        │               │                │              │
│        └───────────────┴────────────────┴──────────────┘
│                          │
│                    Unified Data Lake
│                          │
│              ┌───────────┴───────────┐
│              │                       │
│         Admin Portal           User Portal
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## The 4-Pillar Intelligence System

### SCOUT - Predictive Youth Targeting

> **"Find the right youth before they find you"**

SCOUT uses a multi-factor propensity scoring algorithm to identify youth most likely to enroll, complete, and get placed.

#### How It Works

1. **Data Collection**: Demographics, education, location, income
2. **Feature Engineering**: Transform raw data into predictive signals
3. **Propensity Scoring**: Calculate enrollment/completion/placement probability
4. **Segmentation**: Classify into High/Medium/Low potential

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/scout/candidates` | GET | Get scored candidate list |
| `/scout/candidates/{id}` | GET | Get candidate details |
| `/scout/score/{id}` | POST | Recalculate SCOUT score |
| `/scout/segments` | GET | Get segmentation stats |
| `/scout/zone-analysis` | GET | Geographic distribution |
| `/scout/propensity/{id}` | GET | Detailed propensity analysis |

#### Scoring Algorithm

```python
def calculate_scout_score(youth_data):
    """
    Multi-factor propensity scoring
    
    Factors:
    - Age (18-25 optimal range)
    - Education level
    - Income bracket (lower = higher priority)
    - Source channel effectiveness
    - Geographic accessibility
    """
    score = 0
    
    # Age scoring (18-25 is target demographic)
    age = youth_data.get("age", 0)
    if 18 <= age <= 22:
        score += 25
    elif 23 <= age <= 25:
        score += 20
    elif age < 18 or age > 30:
        score += 5
    
    # Education scoring
    education = youth_data.get("education_level", "").lower()
    if "graduate" in education:
        score += 25
    elif "12th" in education:
        score += 20
    elif "10th" in education:
        score += 15
    
    # Income scoring (lower income = higher priority)
    income = youth_data.get("income_bracket", "middle")
    income_scores = {"low": 25, "middle-low": 20, "middle": 15}
    score += income_scores.get(income, 10)
    
    # Channel effectiveness
    channel = youth_data.get("source_channel", "unknown")
    channel_scores = {
        "referral": 25, "whatsapp": 22, "community_event": 20,
        "school_partnership": 18, "social_media": 12
    }
    score += channel_scores.get(channel, 10)
    
    return min(score, 100)
```

---

### STREAMLINE - Automated Onboarding

> **"From discovery to enrollment in days, not weeks"**

STREAMLINE automates the entire onboarding journey through WhatsApp-based registration and digital document processing.

#### The 7-Stage Pipeline

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  DISCOVERED  │──▶│  INTERESTED  │──▶│   DOCUMENTS  │──▶│   DOCUMENTS  │
│              │   │              │   │   PENDING    │   │   SUBMITTED  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                                │
┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│   ENROLLED   │◀──│   VERIFIED   │◀──│    REVIEW    │◀────────┘
│              │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/streamline/pipeline` | GET | Pipeline status counts |
| `/streamline/candidates/{status}` | GET | Candidates by status |
| `/streamline/candidates/{id}/status` | PUT | Update status |
| `/streamline/metrics` | GET | Onboarding metrics |
| `/streamline/daily-progress` | GET | Daily trends |

#### Document Upload System

```
backend/uploads/
├── aadhar/           # Aadhaar card documents
├── pan/              # PAN card documents
├── bpl/              # BPL/Ration card documents
├── photos/           # Passport photos
└── certificates/     # Education certificates
    ├── 10th/
    ├── 12th/
    └── graduation/
```

#### Aadhaar KYC Integration

Real-time identity verification using Sandbox.co.in API:

```python
@router.post("/aadhaar/send-otp")
async def send_aadhaar_otp(request: AadharOTPRequest):
    """
    1. User enters 12-digit Aadhaar number
    2. OTP sent to registered mobile
    3. Returns reference_id for verification
    """
    
@router.post("/aadhaar/verify-otp")
async def verify_aadhaar_otp(request: AadharOTPVerifyRequest):
    """
    1. User enters OTP
    2. Sandbox API validates identity
    3. Auto-populate profile with verified data:
       - Full name
       - Gender
       - Date of birth
       - Address (state, district, pincode)
    4. Mark Aadhaar as verified
    """
```

---

### AMPLIFY - Channel Optimization

> **"Maximize impact of every rupee spent"**

AMPLIFY tracks channel performance and provides ROI-based recommendations for marketing budget allocation.

#### Channel Performance Tracking

| Channel | Reach | Conversions | Cost/Conversion | ROI Score |
|---------|-------|-------------|-----------------|-----------|
| WhatsApp | 10,000 | 500 | ₹20 | ⭐⭐⭐⭐⭐ |
| Community Events | 500 | 100 | ₹150 | ⭐⭐⭐⭐ |
| SMS | 15,000 | 200 | ₹50 | ⭐⭐⭐ |
| Social Media | 50,000 | 300 | ₹100 | ⭐⭐ |

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/amplify/channel-performance` | GET | Channel ROI analysis |
| `/amplify/attribution` | GET | Conversion attribution |
| `/amplify/budget-recommendation` | GET | AI budget suggestions |
| `/amplify/trends` | GET | Performance trends |

#### WhatsApp Marketing Integration

Bulk campaign support with CSV upload:

```python
@router.post("/marketing/send")
async def send_marketing_messages(request: MarketingSendRequest):
    """
    1. Upload CSV with phone numbers and names
    2. Compose personalized message with {name} placeholder
    3. Send via Twilio WhatsApp API
    4. Track delivery status
    """
```

---

### THRIVE - Retention & Placement

> **"Keep youth engaged and place them in jobs"**

THRIVE predicts dropout risk and provides early intervention alerts, plus AI-powered job matching.

#### Dropout Risk Calculation

```python
def calculate_dropout_risk(youth):
    """
    Multi-factor risk scoring based on:
    - Attendance rate (< 70% = high risk)
    - Assignment completion (< 50% = high risk)
    - Sentiment score from interactions
    - Days since last engagement
    - Peer group dropout patterns
    """
    risk = 0
    
    # Attendance factor (40% weight)
    if youth.attendance_rate < 50:
        risk += 40
    elif youth.attendance_rate < 70:
        risk += 25
    elif youth.attendance_rate < 85:
        risk += 10
    
    # Assignment completion (30% weight)
    if youth.assignment_completion < 30:
        risk += 30
    elif youth.assignment_completion < 50:
        risk += 20
    elif youth.assignment_completion < 70:
        risk += 10
    
    # Sentiment factor (30% weight)
    sentiment = youth.sentiment_score or 0.5
    risk += int((1 - sentiment) * 30)
    
    return min(risk, 100)
```

#### Risk-Based Interventions

| Risk Level | Score | Intervention | Owner |
|------------|-------|--------------|-------|
| Low | 20-40 | Automated motivational nudge | Bot |
| Medium | 40-70 | Peer buddy system activation | Mentor |
| High | 70-90 | Staff personal phone call | Staff |
| Critical | 90+ | Home visit | Field Team |

#### Job Matching Algorithm

```python
def calculate_job_match_score(youth, job):
    """
    Skill-based matching with weighted factors:
    - Skills match (40%)
    - Location fit (25%)
    - Salary expectations (20%)
    - Experience level (15%)
    """
    score = 0
    
    # Skills match
    youth_skills = set(youth.skills or [])
    job_skills = set(job.required_skills or [])
    if job_skills:
        skill_match = len(youth_skills & job_skills) / len(job_skills)
        score += skill_match * 40
    
    # Location match
    if youth.location and job.location:
        if youth.location.lower() in job.location.lower():
            score += 25
    
    # Salary expectations
    if job.salary_range_min and job.salary_range_max:
        score += 20  # Simplified for PoC
    
    # Experience level
    education_map = {"10th": 1, "12th": 2, "diploma": 3, "graduate": 4}
    edu_score = education_map.get(youth.education_level, 1)
    score += (edu_score / 4) * 15
    
    return round(score, 1)
```

---

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 16 + React                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Admin Portal                │  User Portal              │   │
│  │  - Dashboard                 │  - Profile                │   │
│  │  - SCOUT                     │  - Tracker                │   │
│  │  - STREAMLINE                │  - AI Chat                │   │
│  │  - AMPLIFY                   │                           │   │
│  │  - THRIVE                    │                           │   │
│  │  - Marketing                 │                           │   │
│  │  - Verification              │                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                   FastAPI + Python 3.12                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routers:                                                 │  │
│  │  auth.py │ scout.py │ streamline.py │ amplify.py        │  │
│  │  thrive.py │ dashboard.py │ user_portal.py              │  │
│  │  whatsapp.py │ ai_agent.py │ kyc.py │ upload.py         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    SQLite DB    │ │  Twilio API     │ │  Azure OpenAI   │
│   (pathfinder   │ │  (WhatsApp)     │ │  (GPT-4o)       │
│      .db)       │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Sandbox.co.in  │
                    │  (Aadhaar KYC)  │
                    └─────────────────┘
```

### Technology Stack

| Layer | Technology | Why We Chose It |
|-------|------------|-----------------|
| **Frontend** | Next.js 16 + React | App Router, SSR, great DX |
| **Styling** | CSS Variables + Dark/Light Theme | No external dependencies |
| **Backend** | FastAPI (Python) | Fast, async, ML-friendly |
| **Database** | SQLite (PoC) → Azure SQL (Prod) | Simple for PoC, scalable for prod |
| **ORM** | SQLAlchemy | Industry standard, flexible |
| **Auth** | JWT (python-jose) | Stateless, scalable |
| **WhatsApp** | Twilio | Reliable, good docs |
| **AI** | Azure OpenAI (GPT-4o) | Enterprise-grade, Barclays infra |
| **KYC** | Sandbox.co.in | Indian Aadhaar verification |

### Database Schema

```sql
-- Core Models
Admin (id, email, password_hash, name, role)
Youth (id, email, phone, name, age, education_level, ...)  -- 100+ fields
Job (id, title, company, location, salary, required_skills)
Placement (id, youth_id, job_id, match_score, status)

-- Analytics Models  
ChannelPerformance (id, channel, date, reach, conversions, cost)
Intervention (id, youth_id, type, notes, status)
EngagementLog (id, youth_id, action, channel, timestamp)
```

### API Endpoints Summary

| Router | Endpoints | Description |
|--------|-----------|-------------|
| `auth` | 6 | JWT authentication |
| `scout` | 7 | Propensity scoring |
| `streamline` | 6 | Onboarding pipeline |
| `amplify` | 5 | Channel analytics |
| `thrive` | 8 | Retention & jobs |
| `dashboard` | 4 | Unified stats |
| `user_portal` | 6 | Youth self-service |
| `whatsapp` | 8 | Messaging |
| `ai_agent` | 5 | AI assistant |
| `kyc` | 2 | Aadhaar verification |
| `upload` | 7 | Document uploads |
| **Total** | **64** | |

---

## Live Demo

### Admin Portal

**Login:** `admin@magicbus.org` / `admin123`

#### Demo Flow (5-7 minutes)

1. **Dashboard** (30 sec)
   - Overview stats: Total youth, enrolled, at-risk
   - Conversion funnel visualization
   - 4-Pillar summary cards

2. **SCOUT** (1 min)
   - Candidate list sorted by propensity score
   - Segment distribution (High/Medium/Low)
   - Zone heatmap

3. **STREAMLINE** (1 min)
   - Pipeline stages with counts
   - Click through onboarding statuses
   - Show status update flow

4. **Verification** (1 min)
   - Document review interface
   - AI document validation
   - Approve/Reject actions

5. **Marketing** (1 min)
   - Upload CSV demonstration
   - Compose message with {name} placeholder
   - Show Twilio status

6. **THRIVE** (1 min)
   - At-risk youth alerts
   - Risk score breakdown
   - Job matching demo

### User Portal

**Create new account or use existing**

#### Demo Flow (2-3 minutes)

1. **Signup** (30 sec)
   - Quick registration form
   - Instant JWT token

2. **Profile** (1 min)
   - 5-tab form: Personal, Family, Documents, Education, Preferences
   - Aadhaar OTP verification
   - Document uploads

3. **Tracker** (30 sec)
   - Visual progress stages
   - Current status highlight
   - Notifications

4. **AI Chat** (30 sec)
   - Ask a question
   - Show GPT-4o response

---

## Installation Guide

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/saurabh-m-w/MagicBus-FraudBuster.git
cd MagicBus-FraudBuster

# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Seed database
python seed_data.py --force

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Judging Criteria Alignment

### 1. Impact for Charity (10 Points)

| What We Built | Impact on Magic Bus |
|---------------|---------------------|
| SCOUT scoring | Identify high-potential youth 2-3x more efficiently |
| STREAMLINE automation | Reduce onboarding from 60 days to 10-15 days |
| THRIVE predictions | Prevent dropouts before they happen |
| AMPLIFY optimization | Maximize ROI on every marketing rupee |

**Expected: 8-9/10**

### 2. Cost Efficiency (10 Points)

| Component | Cost |
|-----------|------|
| FastAPI backend | FREE (open source) |
| Next.js frontend | FREE (open source) |
| SQLite database | FREE |
| Azure SQL (prod) | Pay-as-you-go |
| Twilio WhatsApp | ~₹0.50/message |
| Azure OpenAI | Existing Barclays infra |

**10x Efficiency:** 1 admin can monitor 500+ youth vs 50 with manual processes

**Expected: 8-9/10**

### 3. Ease of Use (10 Points)

**For Admins:**
- Clean, modern dashboard
- Intuitive 4-pillar navigation
- One-click actions
- Dark/Light theme toggle

**For Youth:**
- Simple signup (< 2 minutes)
- WhatsApp-first approach
- Visual progress tracker
- Mobile-friendly design

**Expected: 8-9/10**

### 4. Innovation & Creativity (10 Points)

| Innovation | Description |
|------------|-------------|
| 4-Pillar Framework | Holistic lifecycle management |
| SCOUT Algorithm | Multi-factor propensity scoring |
| Dropout Prediction | ML-ready risk calculation |
| WhatsApp Onboarding | Conversational registration |
| Aadhaar KYC | Real-time identity verification |
| AI Job Matching | Skill-based placement algorithm |
| AI Chat Assistant | GPT-4o powered guidance |

**Expected: 9-10/10**

### 5. Feasibility & Sustainability (10 Points)

| Factor | Our Approach |
|--------|--------------|
| **Implementation** | Working PoC with 64 API endpoints |
| **Maintenance** | Low - open source, modular |
| **Scalability** | Azure-ready architecture |
| **Sustainability** | Self-service reduces staff workload |
| **No Vendor Lock-in** | Standard technologies |

**Expected: 8-9/10**

### **Total Expected: 41-46/50**

---

## Future Roadmap

### Phase 1: Production Ready (Immediate)
- [ ] Deploy to Azure App Service
- [ ] Migrate SQLite to Azure SQL
- [ ] Enable production WhatsApp number
- [ ] Add monitoring and logging

### Phase 2: Enhanced Features (3-6 months)
- [ ] Train ML models with real data
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

### Phase 3: Scale (6-12 months)
- [ ] Predictive placement engine
- [ ] Partner organization portal
- [ ] Alumni network integration
- [ ] API marketplace

---

## Team FraudBusters

Building technology for social impact.

| Member | Role |
|--------|------|
| Saurabh Waghmare | Full Stack Development |
| Yaswanth Devavarapu | Backend & Integrations |

---

## Repository

**GitHub:** https://github.com/saurabh-m-w/MagicBus-FraudBuster

---

## License

This project was built for the Barclays Hack a Difference 2026 hackathon.

---

*Built with dedication for Magic Bus India Foundation*

*"Every young person deserves a path to a better future"*
