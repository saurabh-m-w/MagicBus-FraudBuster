from datetime import datetime, timedelta
from typing import Optional
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "pathfinder-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if user_type == "admin":
        user = db.query(models.Admin).filter(models.Admin.email == email).first()
    else:
        user = db.query(models.Youth).filter(models.Youth.email == email).first()
    
    if user is None:
        raise credentials_exception
    
    return {"user": user, "user_type": user_type}


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user["user"]


async def get_current_youth(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "youth":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Youth access required"
        )
    return current_user["user"]


@router.post("/admin/signup", response_model=schemas.AdminResponse)
def admin_signup(admin_data: schemas.AdminCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Admin).filter(models.Admin.email == admin_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(admin_data.password)
    db_admin = models.Admin(
        email=admin_data.email,
        password_hash=hashed_password,
        name=admin_data.name,
        role="admin"
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


@router.post("/admin/login", response_model=schemas.Token)
def admin_login(login_data: schemas.AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.email == login_data.email).first()
    if not admin or not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={"sub": admin.email, "user_type": "admin"}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "admin",
        "user_id": admin.id,
        "name": admin.name
    }


@router.post("/youth/signup", response_model=schemas.Token)
def youth_signup(signup_data: schemas.YouthSignup, db: Session = Depends(get_db)):
    existing_email = db.query(models.Youth).filter(models.Youth.email == signup_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_phone = db.query(models.Youth).filter(models.Youth.phone == signup_data.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_password = get_password_hash(signup_data.password)
    
    full_name = f"{signup_data.first_name} {signup_data.last_name}"
    
    db_youth = models.Youth(
        email=signup_data.email,
        password_hash=hashed_password,
        phone=signup_data.phone,
        first_name=signup_data.first_name,
        last_name=signup_data.last_name,
        name=full_name,
        age=0,
        gender="Not specified",
        location="Not specified",
        education_level="Not specified",
        source_channel="self_registration",
        onboarding_status="discovered",
        profile_completed=False
    )
    db.add(db_youth)
    db.commit()
    db.refresh(db_youth)
    
    access_token = create_access_token(
        data={"sub": db_youth.email, "user_type": "youth"}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "youth",
        "user_id": db_youth.id,
        "name": full_name
    }


@router.post("/youth/login", response_model=schemas.Token)
def youth_login(login_data: schemas.YouthLogin, db: Session = Depends(get_db)):
    youth = db.query(models.Youth).filter(models.Youth.email == login_data.email).first()
    if not youth or not youth.password_hash or not verify_password(login_data.password, youth.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={"sub": youth.email, "user_type": "youth"}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "youth",
        "user_id": youth.id,
        "name": youth.name
    }


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    user = current_user["user"]
    user_type = current_user["user_type"]
    
    if user_type == "admin":
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "user_type": "admin"
        }
    else:
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "onboarding_status": user.onboarding_status,
            "profile_completed": user.profile_completed,
            "user_type": "youth"
        }


@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    admin = db.query(models.Admin).filter(models.Admin.email == form_data.username).first()
    if admin and verify_password(form_data.password, admin.password_hash):
        access_token = create_access_token(data={"sub": admin.email, "user_type": "admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_type": "admin",
            "user_id": admin.id,
            "name": admin.name
        }
    
    youth = db.query(models.Youth).filter(models.Youth.email == form_data.username).first()
    if youth and youth.password_hash and verify_password(form_data.password, youth.password_hash):
        access_token = create_access_token(data={"sub": youth.email, "user_type": "youth"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_type": "youth",
            "user_id": youth.id,
            "name": youth.name
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
