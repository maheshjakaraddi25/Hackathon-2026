import os
import httpx
import random
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from jose import jwt, JWTError

import google.generativeai as genai

load_dotenv()

# ─── Config ────────────────────────────────────────────────────────────────────
AUTH0_DOMAIN       = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE     = os.getenv("AUTH0_AUDIENCE", "https://finguard-api")
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — warm, clear voice

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="FinGuard AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ─── Auth0 JWT Verification ────────────────────────────────────────────────────

def get_auth0_jwks():
    import urllib.request, json
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        jwks = get_auth0_jwks()
        header = jwt.get_unverified_header(token)
        rsa_key = next(
            ({"kty": k["kty"], "kid": k["kid"], "use": k["use"], "n": k["n"], "e": k["e"]}
             for k in jwks["keys"] if k["kid"] == header["kid"]),
            None
        )
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find matching key")
        return jwt.decode(
            token, rsa_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def optional_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        return None
    try:
        return verify_token(credentials)
    except HTTPException:
        return None

# ─── Models ────────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    age: int
    annual_income: float = Field(gt=0)
    monthly_expenses: float = Field(gt=0)
    dependents: int
    housing_type: str
    zip_code: str
    employment: str
    has_savings: bool
    savings_months: float = Field(ge=0)

class ChatMessage(BaseModel):
    message: str
    profile: Optional[UserProfile] = None

class TTSRequest(BaseModel):
    text: str

# ─── Static Data ───────────────────────────────────────────────────────────────

FLOOD_RISK_BY_ZIP_PREFIX = {
    "1": "low", "2": "medium", "3": "high", "4": "medium",
    "5": "low",  "6": "medium", "7": "high", "8": "low",
    "9": "medium", "0": "high",
}

INSURANCE_PRODUCTS = {
    "renters":    {"name": "Renters Insurance",    "avg_cost": 15,  "importance": "high",     "description": "Covers your belongings if stolen or damaged. Also covers liability if someone gets hurt in your home.", "for_housing": ["rent"]},
    "homeowners": {"name": "Homeowners Insurance", "avg_cost": 125, "importance": "critical", "description": "Protects your home structure and belongings. Required by most mortgage lenders.",                      "for_housing": ["own"]},
    "life":       {"name": "Life Insurance",       "avg_cost": 30,  "importance": "high",     "description": "Provides income replacement for your family if you pass away. Essential if you have dependents.",       "for_dependents": True},
    "disability": {"name": "Disability Insurance", "avg_cost": 50,  "importance": "medium",   "description": "Replaces 60-70% of your income if you cannot work due to illness or injury."},
    "auto":       {"name": "Auto Insurance",       "avg_cost": 120, "importance": "critical", "description": "Required by law in most states. Covers accidents, theft, and liability."},
    "umbrella":   {"name": "Umbrella Insurance",   "avg_cost": 20,  "importance": "low",      "description": "Extra liability protection beyond your auto/home policies. Great if you own assets."},
}

# ─── Gemini AI ─────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are FinGuard AI, a friendly financial wellness coach helping everyday 
Americans understand personal finance, insurance, and emergency preparedness in plain English.

Guidelines:
- Keep responses concise and practical (under 250 words)
- Use simple language (Grade 8 reading level)
- Use bullet points and bold text for key points  
- Give specific, actionable steps
- Never recommend specific investment products
- Focus on: emergency funds, insurance basics, budgeting, debt, disaster preparedness
- Always be warm, non-judgmental, and encouraging
"""

def gemini_chat(message: str, profile: Optional[UserProfile] = None) -> str:
    if not GEMINI_API_KEY:
        return fallback_chat(message)
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        context = ""
        if profile:
            context = (f"\n\n[User context: Age {profile.age}, "
                       f"Income ${profile.annual_income:,.0f}/year, "
                       f"Essential expenses ${profile.monthly_expenses:,.0f}/month, "
                       f"Housing: {profile.housing_type}, "
                       f"Dependents: {profile.dependents}, "
                       f"Savings: {profile.savings_months} months]")
        response = model.generate_content(message + context)
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return fallback_chat(message)

def fallback_chat(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["emergency", "fund", "savings", "save"]):
        return "**Emergency Fund Basics**\n\nAim for 3-6 months of expenses in a high-yield savings account. Start with a $1,000 goal — it covers 90% of common emergencies. Auto-transfer even $25/week to build the habit."
    if any(w in msg for w in ["renters", "renter", "apartment"]):
        return "**Renters Insurance** costs about $15/month and covers your belongings, liability, and temporary housing. Your landlord's insurance covers the building only — not your stuff."
    if any(w in msg for w in ["life insurance", "life", "term"]):
        return "**Life Insurance** is essential if you have dependents. Term life is cheapest — a healthy 30-year-old pays about $25/month for $500k coverage. Aim for 10-12x your annual income as coverage."
    return "I can help with **emergency funds**, **insurance basics**, **budgeting**, and **disaster preparedness**. What would you like to know?"

# ─── Risk Scoring ──────────────────────────────────────────────────────────────

def get_flood_risk(zip_code: str) -> str:
    if not zip_code:
        return "unknown"
    return FLOOD_RISK_BY_ZIP_PREFIX.get(zip_code[0], "medium")

def calculate_risk_scores(profile: UserProfile) -> dict:
    monthly = profile.monthly_expenses
    target_months = 6 if profile.dependents > 0 else 3
    fund_score = min(100, int((profile.savings_months / target_months) * 100))
    fund_gap_months = max(0, target_months - profile.savings_months)
    fund_gap_amount = fund_gap_months * monthly

    needed = []
    if profile.housing_type == "rent":
        needed.append("renters")
    elif profile.housing_type == "own":
        needed.append("homeowners")
    if profile.dependents > 0:
        needed.append("life")
    needed.extend(["auto", "disability"])
    insurance_score = random.randint(30, 70)

    flood_risk = get_flood_risk(profile.zip_code)
    flood_score = {"low": 85, "medium": 50, "high": 20, "unknown": 50}[flood_risk]
    overall = int((fund_score * 0.4) + (insurance_score * 0.35) + (flood_score * 0.25))

    return {
        "overall": overall,
        "emergency_fund": {
            "score": fund_score,
            "current_months": profile.savings_months,
            "target_months": target_months,
            "gap_months": fund_gap_months,
            "gap_amount": round(fund_gap_amount),
            "monthly_expenses": monthly,
        },
        "insurance": {"score": insurance_score, "recommended": needed, "flood_risk": flood_risk},
        "flood":     {"score": flood_score, "risk_level": flood_risk, "zip_code": profile.zip_code},
    }

def build_action_plan(profile: UserProfile, scores: dict) -> list:
    monthly = scores["emergency_fund"]["monthly_expenses"]
    gap     = scores["emergency_fund"]["gap_amount"]
    ins_tasks = []
    if profile.housing_type == "rent":
        ins_tasks.append("Get a renters insurance quote (avg $15/month) — try State Farm or Lemonade")
    if profile.dependents > 0:
        ins_tasks.append("Research term life insurance — compare quotes on Policygenius.com")
    ins_tasks.append("Review your auto insurance — are you getting all discounts you qualify for?")
    return [
        {"week": 1,      "title": "Know your numbers",            "priority": "high",   "time_estimate": "2 hours",     "tasks": ["List all monthly expenses (rent, food, utilities, subscriptions)", "Calculate your take-home pay after taxes", "Find out what insurance you currently have (check employer benefits)"]},
        {"week": 2,      "title": "Start your emergency fund",    "priority": "high",   "time_estimate": "30 minutes",  "tasks": ["Open a high-yield savings account (look for 4%+ APY)", f"Set up auto-transfer of ${int(monthly * 0.05)}/month", "Set a 90-day goal: save $1,000 as your starter fund"]},
        {"week": 3,      "title": "Close your insurance gaps",    "priority": "high" if profile.dependents > 0 else "medium", "time_estimate": "1-2 hours", "tasks": ins_tasks},
        {"week": 4,      "title": "Set up a simple budget",       "priority": "medium", "time_estimate": "1 hour",      "tasks": ["Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings", "Download a free budgeting app (YNAB free trial, or a spreadsheet)", "If you have debt: target highest interest rate first"]},
        {"week": "5-12", "title": f"Build toward {scores['emergency_fund']['target_months']}-month fund", "priority": "medium", "time_estimate": "15 min/week", "tasks": [f"Keep saving ${int(monthly * 0.1)}/month", f"Goal: reach ${gap:,.0f} in emergency savings", "Revisit insurance annually or after life changes", "Check your budget every 2 weeks"]},
    ]

def get_insurance_recommendations(profile: UserProfile) -> list:
    recs = []
    for key, product in INSURANCE_PRODUCTS.items():
        if "for_housing" in product and profile.housing_type not in product["for_housing"]:
            continue
        if key == "life" and profile.dependents == 0:
            continue
        if key == "umbrella" and profile.annual_income < 60000:
            continue
        recs.append({"id": key, **product})
    return recs

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "FinGuard AI API", "version": "2.0.0", "status": "running",
        "integrations": {
            "auth0":      bool(AUTH0_DOMAIN),
            "gemini":     bool(GEMINI_API_KEY),
            "elevenlabs": bool(ELEVENLABS_API_KEY),
        }
    }

@app.post("/api/analyze")
def analyze_profile(profile: UserProfile, user=Depends(optional_auth)):
    scores        = calculate_risk_scores(profile)
    action_plan   = build_action_plan(profile, scores)
    insurance_recs = get_insurance_recommendations(profile)
    return {
        "scores": scores,
        "action_plan": action_plan,
        "insurance_recommendations": insurance_recs,
        "income_info": {
            "annual_income": round(profile.annual_income, 2),
            "monthly_expenses": round(profile.monthly_expenses, 2),
        },
        "user": user.get("name") if user else None,
    }

@app.post("/api/chat")
def chat(msg: ChatMessage, user=Depends(optional_auth)):
    if not msg.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    response = gemini_chat(msg.message, msg.profile)
    return {
        "response": response,
        "source": "gemini" if GEMINI_API_KEY else "fallback",
        "user": user.get("name") if user else None,
    }

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest, user=Depends(verify_token)):
    """ElevenLabs TTS — requires Auth0 login."""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs not configured")
    import re
    clean = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', req.text)
    clean = re.sub(r'^#+\s+', '', clean, flags=re.MULTILINE)
    clean = clean[:1000]
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={"text": clean, "model_id": "eleven_multilingual_v2",
                  "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}},
            timeout=30.0,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="ElevenLabs API error")
    from fastapi.responses import Response
    return Response(content=resp.content, media_type="audio/mpeg")

@app.get("/api/me")
def get_me(user=Depends(verify_token)):
    return {"sub": user.get("sub"), "name": user.get("name"),
            "email": user.get("email"), "picture": user.get("picture")}

@app.get("/api/flood-risk/{zip_code}")
def flood_risk(zip_code: str):
    risk = get_flood_risk(zip_code)
    tips = {
        "low":    "Your area has relatively low flood risk. Basic homeowners/renters insurance should suffice.",
        "medium": "Moderate flood risk. Consider checking FEMA flood maps for your specific address.",
        "high":   "Higher flood risk detected. Standard insurance does NOT cover floods — consider a separate flood policy.",
    }
    return {"zip_code": zip_code, "risk_level": risk, "tip": tips.get(risk, "")}

@app.get("/api/insurance-products")
def list_insurance_products():
    return {"products": INSURANCE_PRODUCTS}
