import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from .auth import get_current_youth

router = APIRouter(prefix="/upload", tags=["File Upload"])

# Create uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Subdirectories for different document types
(UPLOAD_DIR / "aadhar").mkdir(exist_ok=True)
(UPLOAD_DIR / "pan").mkdir(exist_ok=True)
(UPLOAD_DIR / "bpl").mkdir(exist_ok=True)
(UPLOAD_DIR / "photo").mkdir(exist_ok=True)
(UPLOAD_DIR / "certificates").mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_file(file: UploadFile):
    """Validate file type and size"""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}"
        )
    return ext


def save_file(file: UploadFile, subdir: str, youth_id: int) -> str:
    """Save uploaded file and return the path"""
    ext = validate_file(file)
    
    # Generate unique filename
    filename = f"{youth_id}_{subdir}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / subdir / filename
    
    # Save file
    with open(file_path, "wb") as f:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB allowed")
        f.write(content)
    
    return str(file_path)


@router.post("/aadhar")
async def upload_aadhar(
    file: UploadFile = File(...),
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Upload Aadhar card document"""
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    # Delete old file if exists
    if youth.aadhar_doc_path and os.path.exists(youth.aadhar_doc_path):
        os.remove(youth.aadhar_doc_path)
    
    file_path = save_file(file, "aadhar", youth.id)
    youth.aadhar_doc_path = file_path
    db.commit()
    
    return {"message": "Aadhar document uploaded", "path": file_path}


@router.post("/pan")
async def upload_pan(
    file: UploadFile = File(...),
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Upload PAN card document"""
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    if youth.pan_doc_path and os.path.exists(youth.pan_doc_path):
        os.remove(youth.pan_doc_path)
    
    file_path = save_file(file, "pan", youth.id)
    youth.pan_doc_path = file_path
    db.commit()
    
    return {"message": "PAN document uploaded", "path": file_path}


@router.post("/bpl")
async def upload_bpl(
    file: UploadFile = File(...),
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Upload BPL/Ration card document"""
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    if youth.bpl_doc_path and os.path.exists(youth.bpl_doc_path):
        os.remove(youth.bpl_doc_path)
    
    file_path = save_file(file, "bpl", youth.id)
    youth.bpl_doc_path = file_path
    db.commit()
    
    return {"message": "BPL document uploaded", "path": file_path}


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Upload passport photo"""
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    if youth.photo_path and os.path.exists(youth.photo_path):
        os.remove(youth.photo_path)
    
    file_path = save_file(file, "photo", youth.id)
    youth.photo_path = file_path
    db.commit()
    
    return {"message": "Photo uploaded", "path": file_path}


@router.post("/certificate/{cert_type}")
async def upload_certificate(
    cert_type: str,
    file: UploadFile = File(...),
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Upload education certificate (10th, 12th, graduation, other)"""
    valid_types = ["10th", "12th", "graduation", "other"]
    if cert_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid cert type. Must be one of: {valid_types}")
    
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    # Get the appropriate field
    field_map = {
        "10th": "cert_10th_path",
        "12th": "cert_12th_path",
        "graduation": "cert_graduation_path",
        "other": "cert_other_path"
    }
    field_name = field_map[cert_type]
    
    # Delete old file if exists
    old_path = getattr(youth, field_name)
    if old_path and os.path.exists(old_path):
        os.remove(old_path)
    
    file_path = save_file(file, "certificates", youth.id)
    setattr(youth, field_name, file_path)
    db.commit()
    
    return {"message": f"{cert_type} certificate uploaded", "path": file_path}


@router.get("/status")
async def get_upload_status(
    current_youth: models.Youth = Depends(get_current_youth),
    db: Session = Depends(get_db)
):
    """Get status of all uploaded documents"""
    youth = db.query(models.Youth).filter(models.Youth.id == current_youth.id).first()
    
    return {
        "aadhar": {
            "number": youth.aadhar_number,
            "uploaded": bool(youth.aadhar_doc_path)
        },
        "pan": {
            "number": youth.pan_number,
            "uploaded": bool(youth.pan_doc_path)
        },
        "bpl": {
            "number": youth.bpl_card_number,
            "uploaded": bool(youth.bpl_doc_path)
        },
        "photo": {
            "uploaded": bool(youth.photo_path)
        },
        "certificates": {
            "10th": bool(youth.cert_10th_path),
            "12th": bool(youth.cert_12th_path),
            "graduation": bool(youth.cert_graduation_path),
            "other": bool(youth.cert_other_path)
        }
    }
