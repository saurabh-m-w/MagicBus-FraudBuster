# PathFinder AI

AI-powered Youth Mobilisation Platform for Magic Bus - Revolutionizing how young people are identified, onboarded, engaged, and placed in jobs.

## Architecture

```
HackaDifference/
├── backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── database.py      # SQLite connection
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/         # API endpoints
│   │       ├── scout.py     # Predictive targeting
│   │       ├── streamline.py # Automated onboarding
│   │       ├── amplify.py   # Channel optimization
│   │       ├── thrive.py    # Retention & placement
│   │       └── dashboard.py # Unified dashboard
│   ├── seed_data.py         # Synthetic data generator
│   └── requirements.txt
│
└── frontend/          # Next.js frontend
    ├── app/
    │   ├── layout.js        # Root layout with sidebar
    │   ├── page.js          # Dashboard
    │   ├── scout/page.js    # SCOUT page
    │   ├── streamline/page.js # STREAMLINE page
    │   ├── amplify/page.js  # AMPLIFY page
    │   └── thrive/page.js   # THRIVE page
    └── lib/
        └── api.js           # API client
```

## The 4 Pillars

| Pillar | Purpose | Key Features |
|--------|---------|--------------|
| 🎯 SCOUT | Predictive Targeting | Propensity scoring, zone analysis, candidate segmentation |
| ⚡ STREAMLINE | Automated Onboarding | Pipeline tracking, status management, enrollment metrics |
| 📡 AMPLIFY | Channel Optimization | Performance analytics, attribution, budget recommendations |
| 🌟 THRIVE | Retention & Placement | Dropout prediction, interventions, AI job matching |

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_data.py       # Generate synthetic data
uvicorn app.main:app --reload --port 8000
```

API Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## API Endpoints

- `GET /dashboard/stats` - Dashboard statistics
- `GET /scout/candidates` - Get scored candidates
- `GET /streamline/pipeline` - Onboarding pipeline
- `GET /amplify/channel-performance` - Channel analytics
- `GET /thrive/at-risk` - At-risk youth alerts
- `GET /thrive/job-matches/{id}` - Job recommendations

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: Next.js 15, React, Vanilla CSS
- **Database**: SQLite3 (can migrate to PostgreSQL)
