from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from collections import defaultdict
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging early so it's available to all handlers
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firebase Admin — optional but used for token verification on /coach
# ---------------------------------------------------------------------------
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials as fb_credentials
    _fb_cred_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if _fb_cred_path and not firebase_admin._apps:
        firebase_admin.initialize_app(fb_credentials.Certificate(_fb_cred_path))
    _firebase_available = bool(firebase_admin._apps)
except Exception as _e:
    logger.warning("Firebase Admin SDK not initialised: %s", _e)
    _firebase_available = False

# ---------------------------------------------------------------------------
# Simple in-memory rate limiter: max 10 requests per UID per 60 seconds
# ---------------------------------------------------------------------------
_rate_store: dict = defaultdict(list)  # uid -> [timestamps]
RATE_LIMIT = int(os.environ.get('COACH_RATE_LIMIT', '10'))
RATE_WINDOW = 60  # seconds

def _check_rate_limit(uid: str):
    now = time.time()
    window_start = now - RATE_WINDOW
    calls = [t for t in _rate_store[uid] if t > window_start]
    if len(calls) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")
    calls.append(now)
    _rate_store[uid] = calls

# ---------------------------------------------------------------------------
# Auth dependency — verifies Firebase ID token from Authorization header
# ---------------------------------------------------------------------------
_bearer_scheme = HTTPBearer(auto_error=False)

async def verify_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> str:
    """Returns the verified UID, or raises 401."""
    if not _firebase_available:
        # Firebase Admin not configured — fall back to an unverified stub in dev.
        # In production FIREBASE_SERVICE_ACCOUNT_JSON must be set.
        logger.warning("Firebase Admin unavailable — skipping token verification (dev mode)")
        return "dev-uid"
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
        return decoded['uid']
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


# ---------------------------------------------------------------------------
# AI Coach
# ---------------------------------------------------------------------------

# Allowed accent hex colours (whitelist — prevents arbitrary CSS injection)
ACCENT_HEX_RE = r'^#?[0-9a-fA-F]{3,6}$'

class CoachRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    unit: str = "kg"
    current: Optional[float] = None
    total_change: Optional[float] = None
    last_change: Optional[float] = None
    streak: int = 0
    logged_today: bool = False
    goal_progress: Optional[float] = None
    to_goal: Optional[float] = None
    goal_target: Optional[float] = None
    calories: int = 0
    water: int = 0
    steps: int = 0
    total_entries: int = 0
    name: Optional[str] = None
    rate_per_week: Optional[float] = None
    eta_weeks: Optional[float] = None
    plateau: bool = False


COACH_SYSTEM = (
    "You are an upbeat, emotionally intelligent weight-loss and wellness coach inside an "
    "app called WL Pro. You write SHORT, punchy, genuinely encouraging messages (max 2 "
    "sentences, under 45 words). Be warm and human, never preachy, never give medical advice, "
    "never shame the user about weight gain or fluctuations. Celebrate consistency and effort "
    "over outcomes. Use at most one tasteful emoji. Output ONLY the message text — no quotes, "
    "no preamble, no headline."
)


def _build_coach_prompt(r: CoachRequest) -> str:
    u = r.unit
    parts = ["User stats today:"]
    if r.name:
        parts.append(f"- Name: {r.name}")
    if r.total_entries == 0:
        parts.append("- They have not logged any weigh-ins yet. Welcome them and nudge them to log their first.")
    if r.current is not None:
        parts.append(f"- Current weight: {r.current:.1f} {u}")
    if r.total_change is not None:
        parts.append(f"- Change since start: {r.total_change:+.1f} {u} (negative means weight lost)")
    if r.last_change is not None:
        parts.append(f"- Change since last entry: {r.last_change:+.1f} {u}")
    parts.append(f"- Logging streak: {r.streak} days")
    parts.append(f"- Logged today: {'yes' if r.logged_today else 'no'}")
    if r.goal_progress is not None:
        parts.append(f"- Goal progress: {round(r.goal_progress * 100)}%")
    if r.to_goal is not None and r.goal_target is not None:
        parts.append(f"- {abs(r.to_goal):.1f} {u} to their target of {r.goal_target:.1f} {u}")
    parts.append(f"- Today: {r.calories} kcal, {r.water} glasses water, {r.steps} steps")
    if r.rate_per_week is not None:
        parts.append(f"- Current pace: {r.rate_per_week:+.2f} {u}/week")
    if r.eta_weeks is not None and r.eta_weeks > 0:
        parts.append(f"- At this pace they reach their goal in about {round(r.eta_weeks)} weeks")
    if r.plateau:
        parts.append(
            "- They have PLATEAUED (weight flat ~2 weeks). Gently normalize this, "
            "reassure them, and offer one small encouraging suggestion."
        )
    parts.append("\nWrite one fresh, specific, motivating coaching message based on the most noteworthy detail above.")
    return "\n".join(parts)


@api_router.post("/coach")
async def coach(req: CoachRequest, uid: str = Depends(verify_firebase_token)):
    """Requires a valid Firebase ID token in the Authorization: Bearer header."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")

    # Rate limit per authenticated user
    _check_rate_limit(uid)

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"coach-{uuid.uuid4()}",
            system_message=COACH_SYSTEM,
        ).with_model("openai", "gpt-4o")
        message = await chat.send_message(UserMessage(text=_build_coach_prompt(req)))
        text = (message or "").strip().strip('"')
        return {"message": text}
    except Exception:
        logger.exception("coach generation failed")
        raise HTTPException(status_code=500, detail="Coach unavailable")


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
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


app.include_router(api_router)

# ---------------------------------------------------------------------------
# CORS — never default to wildcard; raise clearly if env var is missing
# ---------------------------------------------------------------------------
_cors_origins_raw = os.environ.get('CORS_ORIGINS', '').strip()
if not _cors_origins_raw:
    logger.warning(
        "CORS_ORIGINS env var is not set. Defaulting to no allowed origins. "
        "Set CORS_ORIGINS to your Firebase Hosting URL in Cloud Run."
    )
_cors_origins = [o.strip() for o in _cors_origins_raw.split(',') if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
