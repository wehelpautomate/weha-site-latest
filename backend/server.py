from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from validation import validate_name, validate_email, validate_company, validate_free_text


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class AuditRequestCreate(BaseModel):
    name: str
    company: str
    country: str
    industry: str
    process: str
    contact_method: str
    email: Optional[str] = None
    slot_iso_utc: Optional[str] = None  # ISO 8601 UTC timestamp of chosen slot
    timezone: Optional[str] = None      # IANA tz of user's selection, e.g. "Asia/Dubai"

class AuditRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: str
    country: str
    industry: str
    process: str
    contact_method: str
    email: Optional[str] = None
    slot_iso_utc: Optional[str] = None
    timezone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Booking config -----------------------------------------------------------
BUSINESS_START_HOUR = 9     # local time
BUSINESS_END_HOUR = 18      # local time (exclusive)
SLOT_MINUTES = 30
WORK_DAYS = {0, 1, 2, 3, 4}  # Mon..Fri

ALLOWED_TIMEZONES = {
    "Asia/Dubai",         # UAE
    "Australia/Sydney",   # AU
    "Asia/Singapore",     # SG
    "Asia/Kolkata",       # India
    "America/New_York",   # US
}


class Slot(BaseModel):
    label: str       # display label in local tz, e.g. "09:30"
    iso_utc: str     # canonical ISO 8601 UTC string used as the slot key
    taken: bool


class PlaybookLeadCreate(BaseModel):
    name: str
    company: Optional[str] = None
    designation: Optional[str] = None
    email: EmailStr
    industry: Optional[str] = None
    country: Optional[str] = None
    session_interest: Optional[str] = None  # "Yes" | "Maybe" | "No"
    source: Optional[str] = None             # which page submitted
    asset_title: Optional[str] = None        # which asset was downloaded


class PlaybookLead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: Optional[str] = None
    designation: Optional[str] = None
    email: str
    industry: Optional[str] = None
    country: Optional[str] = None
    session_interest: Optional[str] = None
    source: Optional[str] = None
    asset_title: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/")
async def root():
    return {"message": "WeHA API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.get("/availability", response_model=List[Slot])
async def get_availability(
    date: str = Query(..., description="YYYY-MM-DD in the chosen timezone"),
    tz: str = Query(..., description="IANA timezone, e.g. Asia/Dubai"),
):
    if tz not in ALLOWED_TIMEZONES:
        raise HTTPException(status_code=400, detail=f"Unsupported timezone: {tz}")
    try:
        zone = ZoneInfo(tz)
    except ZoneInfoNotFoundError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {tz}")
    try:
        y, m, d = (int(x) for x in date.split("-"))
        local_day_start = datetime(y, m, d, 0, 0, tzinfo=zone)
    except Exception:
        raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD")

    if local_day_start.weekday() not in WORK_DAYS:
        return []

    now_utc = datetime.now(timezone.utc)
    # Build local slots, convert to UTC ISO, then check Mongo for booked
    candidate_slots = []
    cur = local_day_start.replace(hour=BUSINESS_START_HOUR, minute=0)
    end = local_day_start.replace(hour=BUSINESS_END_HOUR, minute=0)
    while cur < end:
        utc_dt = cur.astimezone(timezone.utc)
        if utc_dt > now_utc + timedelta(minutes=15):  # must be in the future
            candidate_slots.append({
                "label": cur.strftime("%H:%M"),
                "iso_utc": utc_dt.isoformat().replace("+00:00", "Z"),
            })
        cur += timedelta(minutes=SLOT_MINUTES)

    if not candidate_slots:
        return []

    iso_keys = [s["iso_utc"] for s in candidate_slots]
    booked_cursor = db.audit_requests.find(
        {"slot_iso_utc": {"$in": iso_keys}}, {"_id": 0, "slot_iso_utc": 1}
    )
    booked = {doc["slot_iso_utc"] async for doc in booked_cursor}

    return [
        Slot(label=s["label"], iso_utc=s["iso_utc"], taken=(s["iso_utc"] in booked))
        for s in candidate_slots
    ]


@api_router.post("/audit-requests", response_model=AuditRequest)
async def create_audit_request(input: AuditRequestCreate):
    # Anti-spam / junk-data validation (mirrors frontend spamGuard).
    validate_name(input.name)
    validate_company(input.company, required=True)
    validate_email(input.email, required=False)
    validate_free_text(input.process, "the process you want to fix")

    # If a slot was selected, validate it
    if input.slot_iso_utc:
        if input.timezone and input.timezone not in ALLOWED_TIMEZONES:
            raise HTTPException(status_code=422, detail="Unsupported timezone.")
        try:
            slot_dt = datetime.fromisoformat(input.slot_iso_utc.replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid slot_iso_utc format.")
        if slot_dt <= datetime.now(timezone.utc):
            raise HTTPException(status_code=422, detail="Selected slot is in the past.")
        # Atomically prevent double-booking
        existing = await db.audit_requests.find_one({"slot_iso_utc": input.slot_iso_utc}, {"_id": 1})
        if existing:
            raise HTTPException(status_code=409, detail="That slot was just taken. Please pick another.")

    obj = AuditRequest(**input.model_dump())
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.audit_requests.insert_one(doc)
    return obj

@api_router.get("/audit-requests", response_model=List[AuditRequest])
async def get_audit_requests():
    items = await db.audit_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it['created_at'], str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


# --- Playbook lead capture (AI Transformation Playbook download form) ---------
@api_router.post("/playbook-requests", response_model=PlaybookLead)
async def create_playbook_request(input: PlaybookLeadCreate):
    # Anti-spam / junk-data validation (mirrors frontend spamGuard).
    validate_name(input.name)
    validate_email(input.email, required=True)
    validate_company(input.company, required=False)
    obj = PlaybookLead(**input.model_dump())
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.playbook_requests.insert_one(doc)
    return obj


@api_router.get("/playbook-requests", response_model=List[PlaybookLead])
async def get_playbook_requests():
    items = await db.playbook_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


# --- Calculator lead capture (Services / Work hero ValueCalculators) ----------
class CalculatorLeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    source: Optional[str] = None
    inputs_json: Optional[str] = None     # selected calculator inputs, stringified JSON
    result_summary: Optional[str] = None  # computed headline, for context


class CalculatorLead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: Optional[str] = None
    source: Optional[str] = None
    inputs_json: Optional[str] = None
    result_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/calculator-leads", response_model=CalculatorLead)
async def create_calculator_lead(input: CalculatorLeadCreate):
    # Anti-spam / junk-data validation (mirrors frontend spamGuard).
    validate_name(input.name)
    validate_email(input.email, required=True)
    validate_company(input.company, required=False)

    data = input.model_dump()
    # Cap stored field lengths.
    if data.get('inputs_json'):
        data['inputs_json'] = data['inputs_json'][:4000]
    if data.get('result_summary'):
        data['result_summary'] = data['result_summary'][:500]

    obj = CalculatorLead(**data)
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.calculator_leads.insert_one(doc)
    return obj


@api_router.get("/calculator-leads", response_model=List[CalculatorLead])
async def get_calculator_leads():
    items = await db.calculator_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


# Include the router in the main app

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
