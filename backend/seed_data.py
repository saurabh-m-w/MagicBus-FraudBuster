import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

FIRST_NAMES_MALE = ["Rahul", "Vikram", "Amit", "Suresh", "Arjun", "Ravi", "Manjunath", "Karan", "Sanjay", "Ajay", "Rajesh", "Vinod"]
FIRST_NAMES_FEMALE = ["Priya", "Anita", "Neha", "Pooja", "Kavitha", "Sneha", "Deepika", "Lakshmi", "Divya", "Meera", "Sunita", "Anjali", "Rekha"]
LAST_NAMES = ["Sharma", "Kumar", "Patel", "Singh", "Gupta", "Verma", "Yadav", "Reddy", "Nair", "Das", "Joshi", "Rao", "Malhotra", "Menon", "Dubey", "Iyer", "Thakur", "Devi", "Pillai", "Mishra", "Bhat"]

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]
STATES = {
    "Mumbai": "Maharashtra", "Delhi": "Delhi", "Bangalore": "Karnataka", 
    "Chennai": "Tamil Nadu", "Hyderabad": "Telangana", "Pune": "Maharashtra",
    "Kolkata": "West Bengal", "Ahmedabad": "Gujarat", "Jaipur": "Rajasthan", "Lucknow": "Uttar Pradesh"
}
AREAS = {
    "Mumbai": ["Dharavi", "Kurla", "Andheri", "Bandra"],
    "Delhi": ["Dwarka", "Rohini", "Karol Bagh", "Laxmi Nagar"],
    "Bangalore": ["Whitefield", "Electronic City", "Koramangala", "HSR Layout"],
    "Chennai": ["Tambaram", "Velachery", "T Nagar", "Anna Nagar"],
    "Hyderabad": ["Secunderabad", "Kukatpally", "Gachibowli", "Madhapur"],
    "Pune": ["Hadapsar", "Kothrud", "Wakad", "Hinjewadi"],
    "Kolkata": ["Salt Lake", "Howrah", "Dum Dum", "Park Street"],
    "Ahmedabad": ["Navrangpura", "Satellite", "Maninagar", "Bopal"],
    "Jaipur": ["Malviya Nagar", "Vaishali Nagar", "Raja Park", "C Scheme"],
    "Lucknow": ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar"]
}

EDUCATION_LEVELS = ["10th", "12th", "graduate", "diploma", "iti"]
EDUCATION_DETAILS = {
    "10th": "Secondary School Certificate (SSC)",
    "12th": "Higher Secondary Certificate (HSC)",
    "graduate": "Bachelor's Degree",
    "diploma": "Diploma in Technical Education",
    "iti": "Industrial Training Institute Certificate"
}
INSTITUTIONS = ["Government School", "Private School", "State Board School", "CBSE School", "Government College", "Private College", "ITI Center", "Polytechnic"]

INCOME_BRACKETS = ["low", "middle-low", "middle"]
CHANNELS = ["whatsapp", "sms", "community_event", "social_media", "referral", "school_partnership", "self_registration"]
STATUSES = ["discovered", "interested", "documents_pending", "documents_submitted", "verified", "enrolled"]
SKILLS = ["communication", "computer_basics", "english", "retail", "hospitality", "data_entry", "customer_service", "accounting", "ms_office", "typing"]
INTERESTS = ["retail", "hospitality", "it", "banking", "healthcare", "manufacturing", "logistics", "education"]

COMPANIES = ["TCS", "Infosys", "Flipkart", "Amazon", "Reliance Retail", "BigBasket", "Swiggy", "Zomato", "HDFC Bank", "ICICI Bank"]
JOB_TITLES = ["Customer Service Executive", "Data Entry Operator", "Retail Associate", "Delivery Executive", "Office Assistant", "Receptionist", "Telecaller", "Warehouse Associate"]


def generate_aadhar():
    return ''.join([str(random.randint(0, 9)) for _ in range(12)])


def generate_pan():
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return ''.join([
        random.choice(letters) for _ in range(5)
    ]) + ''.join([str(random.randint(0, 9)) for _ in range(4)]) + random.choice(letters)


def generate_bpl_card():
    state_codes = ["MH", "DL", "KA", "TN", "TS", "RJ", "UP", "WB", "GJ"]
    return f"{random.choice(state_codes)}-BPL-{random.randint(100000, 999999)}"


def create_admins(db: Session):
    admin_exists = db.query(models.Admin).filter(models.Admin.email == "admin@magicbus.org").first()
    if admin_exists:
        print("Admin already exists")
        return
    
    admins = [
        {"email": "admin@magicbus.org", "name": "Admin User", "password": "admin123"},
        {"email": "coordinator@magicbus.org", "name": "Programme Coordinator", "password": "coord123"},
    ]
    
    for admin_data in admins:
        admin = models.Admin(
            email=admin_data["email"],
            password_hash=pwd_context.hash(admin_data["password"]),
            name=admin_data["name"],
            role="admin",
            is_active=True
        )
        db.add(admin)
    
    db.commit()
    print(f"Created {len(admins)} admin users")


def create_synthetic_youth(db: Session, count: int = 100):
    for i in range(count):
        gender = random.choice(["Male", "Female"])
        if gender == "Male":
            first_name = random.choice(FIRST_NAMES_MALE)
        else:
            first_name = random.choice(FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)
        
        age = random.randint(18, 25)
        dob = datetime.utcnow() - timedelta(days=age * 365 + random.randint(0, 365))
        
        city = random.choice(CITIES)
        state = STATES[city]
        area = random.choice(AREAS[city])
        
        education = random.choice(EDUCATION_LEVELS)
        channel = random.choice(CHANNELS)
        status = random.choices(STATUSES, weights=[10, 15, 20, 15, 15, 25])[0]
        
        base_score = 50
        if education in ["graduate", "diploma"]:
            base_score += 15
        elif education == "12th":
            base_score += 10
        if channel in ["referral", "community_event"]:
            base_score += 10
        base_score += random.uniform(-10, 20)
        scout_score = min(100, max(0, base_score))
        
        created_days_ago = random.randint(1, 90)
        created_at = datetime.utcnow() - timedelta(days=created_days_ago)
        
        enrolled_date = None
        if status == "enrolled":
            days_to_enroll = random.randint(5, 30)
            enrolled_date = created_at + timedelta(days=days_to_enroll)
        
        attendance = random.uniform(0.3, 1.0) if status == "enrolled" else 0
        assignment = random.uniform(0.2, 1.0) if status == "enrolled" else 0
        sentiment = random.uniform(0.3, 0.9)
        
        dropout_risk = 0
        if status == "enrolled":
            if attendance < 0.5:
                dropout_risk += 30
            if assignment < 0.5:
                dropout_risk += 25
            if sentiment < 0.4:
                dropout_risk += 20
        
        has_bpl = random.random() < 0.4
        income = random.choice(INCOME_BRACKETS)
        if has_bpl:
            income = "low"
        
        profile_complete = status not in ["discovered"]
        docs_uploaded = status in ["documents_submitted", "verified", "enrolled"]
        
        # Generate parent names
        father_first = random.choice(FIRST_NAMES_MALE)
        mother_first = random.choice(FIRST_NAMES_FEMALE)
        
        youth = models.Youth(
            email=f"{first_name.lower()}.{last_name.lower()}{i}@email.com" if random.random() > 0.3 else None,
            password_hash=pwd_context.hash("user123") if random.random() > 0.5 else None,
            name=f"{first_name} {last_name}",
            first_name=first_name,
            last_name=last_name,
            age=age,
            date_of_birth=dob,
            gender=gender,
            phone=f"+91{random.randint(7000000000, 9999999999)}",
            alternate_phone=f"+91{random.randint(7000000000, 9999999999)}" if random.random() > 0.7 else None,
            location=f"{city} - {area}",
            address=f"{random.randint(1, 500)}, {area}, {city}",
            city=city,
            state=state,
            pincode=str(random.randint(100000, 999999)),
            
            # Family details
            father_name=f"{father_first} {last_name}" if profile_complete else None,
            mother_name=f"{mother_first} {last_name}" if profile_complete else None,
            guardian_phone=f"+91{random.randint(7000000000, 9999999999)}" if profile_complete else None,
            
            # Identity documents
            aadhar_number=generate_aadhar() if docs_uploaded else None,
            pan_number=generate_pan() if random.random() > 0.6 else None,
            bpl_card_number=generate_bpl_card() if has_bpl else None,
            
            # Education details
            education_level=education,
            education_details=EDUCATION_DETAILS[education],
            institution_name=random.choice(INSTITUTIONS),
            year_of_passing=random.randint(2018, 2024),
            percentage_10th=round(random.uniform(45, 95), 2) if profile_complete else None,
            percentage_12th=round(random.uniform(45, 95), 2) if education in ["12th", "graduate", "diploma"] else None,
            percentage_graduation=round(random.uniform(50, 85), 2) if education == "graduate" else None,
            income_bracket=income,
            family_income=random.randint(5000, 50000) if random.random() > 0.3 else None,
            
            scout_score=round(scout_score, 2),
            onboarding_status=status,
            dropout_risk=dropout_risk,
            source_channel=channel,
            
            skills=random.sample(SKILLS, random.randint(1, 4)),
            interests=random.sample(INTERESTS, random.randint(1, 3)),
            work_experience=[{"company": "Local Shop", "duration": "6 months", "role": "Helper"}] if random.random() > 0.7 else [],
            preferred_job_roles=random.sample(JOB_TITLES, random.randint(1, 3)),
            
            attendance_rate=round(attendance, 2),
            assignment_completion=round(assignment, 2),
            sentiment_score=round(sentiment, 2),
            
            profile_completed=profile_complete,
            documents_uploaded=docs_uploaded,
            is_active=True,
            
            enrolled_date=enrolled_date,
            created_at=created_at
        )
        db.add(youth)
    
    db.commit()


def create_jobs(db: Session):
    for i in range(15):
        job = models.Job(
            title=random.choice(JOB_TITLES),
            company=random.choice(COMPANIES),
            location=f"{random.choice(CITIES)} - {random.choice(list(AREAS.values()))[0]}",
            salary_min=random.randint(10000, 15000),
            salary_max=random.randint(18000, 30000),
            required_skills=random.sample(SKILLS, random.randint(2, 4)),
            description="Entry level position for freshers",
            is_active=1
        )
        db.add(job)
    db.commit()


def create_channel_performance(db: Session):
    for channel in CHANNELS:
        for days_ago in range(30):
            date = datetime.utcnow() - timedelta(days=days_ago)
            reach = random.randint(50, 500)
            clicks = int(reach * random.uniform(0.05, 0.3))
            conversions = int(clicks * random.uniform(0.1, 0.4))
            
            cost_map = {"whatsapp": 20, "sms": 50, "community_event": 150, "social_media": 100, "referral": 30, "school_partnership": 80, "self_registration": 0}
            cost = reach * (cost_map.get(channel, 50) / 100)
            
            perf = models.ChannelPerformance(
                channel=channel,
                date=date,
                reach=reach,
                clicks=clicks,
                conversions=conversions,
                cost=cost,
                campaign_name=f"{channel}_campaign_{days_ago % 5}"
            )
            db.add(perf)
    db.commit()


def create_placements(db: Session):
    enrolled_youth = db.query(models.Youth).filter(models.Youth.onboarding_status == "enrolled").limit(20).all()
    jobs = db.query(models.Job).all()
    
    for youth in enrolled_youth:
        if random.random() > 0.5:
            job = random.choice(jobs)
            placement = models.Placement(
                youth_id=youth.id,
                job_id=job.id,
                match_score=random.uniform(60, 95),
                status=random.choice(["matched", "placed", "retained"]),
                placed_date=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                retention_days=random.randint(30, 180)
            )
            db.add(placement)
    db.commit()


def seed_database(force: bool = False):
    init_db()
    db = SessionLocal()
    
    try:
        if force:
            print("Force mode: Clearing existing data...")
            db.query(models.Placement).delete()
            db.query(models.ChannelPerformance).delete()
            db.query(models.EngagementLog).delete()
            db.query(models.Intervention).delete()
            db.query(models.Job).delete()
            db.query(models.Youth).delete()
            db.query(models.Admin).delete()
            db.commit()
        
        existing = db.query(models.Youth).count()
        if existing > 0 and not force:
            print(f"Database already has {existing} records. Use --force to reset.")
            return
        
        print("Creating admin users...")
        create_admins(db)
        
        print("Creating synthetic youth data...")
        create_synthetic_youth(db, 150)
        
        print("Creating jobs...")
        create_jobs(db)
        
        print("Creating channel performance data...")
        create_channel_performance(db)
        
        print("Creating placements...")
        create_placements(db)
        
        print("\n=== Database seeded successfully! ===")
        print(f"Admins: {db.query(models.Admin).count()}")
        print(f"Youth: {db.query(models.Youth).count()}")
        print(f"Jobs: {db.query(models.Job).count()}")
        print(f"\nAdmin login: admin@magicbus.org / admin123")
        
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    seed_database(force=force)
