import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import scout, streamline, amplify, thrive, dashboard, whatsapp, auth, user_portal, ai_agent, upload

app = FastAPI(
    title="PathFinder AI",
    description="AI-powered Youth Mobilisation Platform for Magic Bus",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user_portal.router)
app.include_router(upload.router)
app.include_router(ai_agent.router)
app.include_router(dashboard.router)
app.include_router(scout.router)
app.include_router(streamline.router)
app.include_router(amplify.router)
app.include_router(thrive.router)
app.include_router(whatsapp.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "name": "PathFinder AI",
        "version": "1.0.0",
        "pillars": ["SCOUT", "STREAMLINE", "AMPLIFY", "THRIVE"],
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
