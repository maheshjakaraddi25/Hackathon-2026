from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import random

app = FastAPI(title="FinGuard AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ────────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    age: int
    income_range: str          # "under_30k" | "30k_60k" | "60k_100k" | "over_100k"
    dependents: int
    housing_type: str          # "rent" | "own" | "other"
    zip_code: str
    employment: str            # "employed" | "self_employed" | "unemployed" | "retired"
    has_savings: bool
    savings_months: int        # months of expenses saved

class ChatMessage(BaseModel):
    message: str
    profile: Optional[UserProfile] = None

# ─── Mock Data ─────────────────────────────────────────────────────────────────

FLOOD_RISK_BY_ZIP_PREFIX = {
    "1": "low", "2": "medium", "3": "high", "4": "medium",
    "5": "low",  "6": "medium", "7": "high", "8": "low",
    "9": "medium", "0": "high",
}

INCOME_BRACKETS = {
    "under_30k":  {"monthly": 2000, "label": "Under $30k/yr"},
    "30k_60k":    {"monthly": 3750, "label": "$30k–$60k/yr"},
    "60k_100k":   {"monthly": 6667, "label": "$60k–$100k/yr"},
    "over_100k":  {"monthly": 10000, "label": "Over $100k/yr"},
}

INSURANCE_PRODUCTS = {
    "renters": {
        "name": "Renters Insurance",
        "avg_cost": 15,
        "description": "Covers your belongings if stolen or damaged. Also covers liability if someone gets hurt in your home.",
        "importance": "high",
        "for_housing": ["rent"],
    },
    "homeowners": {
        "name": "Homeowners Insurance",
        "avg_cost": 125,
        "description": "Protects your home structure and belongings. Required by most mortgage lenders.",
        "importance": "critical",
        "for_housing": ["own"],
    },
    "life": {
        "name": "Life Insurance",
        "avg_cost": 30,
        "description": "Provides income replacement for your family if you pass away. Essential if you have dependents.",
        "importance": "high",
        "for_dependents": True,
    },
    "disability": {
        "name": "Disability Insurance",
        "avg_cost": 50,
        "description": "Replaces 60–70% of your income if you're unable to work due to illness or injury.",
        "importance": "medium",
    },
    "auto": {
        "name": "Auto Insurance",
        "avg_cost": 120,
        "description": "Required by law in most states. Covers accidents, theft, and liability.",
        "importance": "critical",
    },
    "umbrella": {
        "name": "Umbrella Insurance",
        "avg_cost": 20,
        "description": "Extra liability protection beyond your auto/home policies. Great if you own assets.",
        "importance": "low",
    },
}

MOCK_AI_RESPONSES = {
    "emergency_fund": """**Emergency Fund Basics**

An emergency fund is 3–6 months of living expenses saved in an easily accessible account (like a high-yield savings account).

**Why it matters:** Job loss, medical bills, or car repairs can derail your finances without a cushion.

**How to start:**
1. Calculate your monthly expenses (rent + food + utilities + transport)
2. Set a target: 3 months minimum, 6 months ideal
3. Open a separate savings account so you're not tempted to spend it
4. Auto-transfer even $25/week — consistency beats amount

A $1,000 starter emergency fund is your first milestone. It handles 90% of common financial emergencies.""",

    "renters_insurance": """**Renters Insurance — What It Actually Covers**

Renters insurance typically costs **$10–$20/month** and covers three things:

1. **Your belongings** — If your laptop, furniture, or clothes are stolen or destroyed in a fire, renters insurance pays to replace them (up to your policy limit)

2. **Liability** — If your dog bites a neighbor or someone slips in your apartment, you're covered for legal fees and medical costs

3. **Temporary housing** — If your apartment becomes unlivable (fire, flooding), your policy pays for a hotel or short-term rental

**What it does NOT cover:**
- The building itself (that's your landlord's responsibility)
- Flood damage (needs separate flood insurance)
- Earthquakes (separate policy)
- Your roommate's stuff (they need their own policy)

**State Farm tip:** Bundle renters + auto insurance for discounts up to 17%.""",

    "life_insurance": """**Life Insurance — Do You Need It?**

**Yes, if:** You have dependents (kids, spouse, aging parents) who rely on your income.
**Maybe, if:** You have significant debt someone else would inherit.
**Probably not yet, if:** You're young, single, and debt-free.

**Two main types:**

**Term Life** (recommended for most people)
- Coverage for a set period (10, 20, 30 years)
- Much cheaper — a healthy 30-year-old pays ~$25/month for $500k coverage
- Best for: Young families, people with mortgages

**Whole Life**
- Permanent coverage + cash value component
- 5–10x more expensive
- Best for: High-net-worth estate planning

**Rule of thumb:** Coverage = 10–12x your annual income if you have dependents.""",

    "default": """I can help you understand:

• **Emergency funds** — how much to save and where
• **Renters insurance** — what's covered and what's not
• **Life insurance** — term vs whole, how much you need
• **Disability insurance** — protecting your income
• **Budgeting basics** — 50/30/20 rule and beyond
• **Flood & disaster risk** — what coverage you might need

Ask me anything about financial wellness or insurance in plain English — no jargon, no sales pitch.""",
}

# ─── Helpers ───────────────────────────────────────────────────────────────────

def get_flood_risk(zip_code: str) -> str:
    if not zip_code:
        return "unknown"
    prefix = zip_code[0]
    return FLOOD_RISK_BY_ZIP_PREFIX.get(prefix, "medium")

def calculate_risk_scores(profile: UserProfile) -> dict:
    monthly_income = INCOME_BRACKETS.get(profile.income_range, {}).get("monthly", 3000)
    
    # Emergency fund score (0–100, lower = worse)
    target_months = 6 if profile.dependents > 0 else 3
    fund_score = min(100, int((profile.savings_months / target_months) * 100))
    fund_gap_months = max(0, target_months - profile.savings_months)
    fund_gap_amount = fund_gap_months * monthly_income * 0.7  # ~70% of income = expenses

    # Insurance gap score
    needed = []
    if profile.housing_type == "rent":
        needed.append("renters")
    elif profile.housing_type == "own":
        needed.append("homeowners")
    if profile.dependents > 0:
        needed.append("life")
    needed.extend(["auto", "disability"])
    insurance_score = random.randint(30, 70)  # mock — real app would ask what they have

    # Flood risk
    flood_risk = get_flood_risk(profile.zip_code)
    flood_score = {"low": 85, "medium": 50, "high": 20, "unknown": 50}[flood_risk]

    # Overall
    overall = int((fund_score * 0.4) + (insurance_score * 0.35) + (flood_score * 0.25))

    return {
        "overall": overall,
        "emergency_fund": {
            "score": fund_score,
            "current_months": profile.savings_months,
            "target_months": target_months,
            "gap_months": fund_gap_months,
            "gap_amount": round(fund_gap_amount),
            "monthly_income_est": monthly_income,
        },
        "insurance": {
            "score": insurance_score,
            "recommended": needed,
            "flood_risk": flood_risk,
        },
        "flood": {
            "score": flood_score,
            "risk_level": flood_risk,
            "zip_code": profile.zip_code,
        },
    }

def build_action_plan(profile: UserProfile, scores: dict) -> list:
    plan = []
    monthly = scores["emergency_fund"]["monthly_income_est"]
    gap = scores["emergency_fund"]["gap_amount"]
    
    # Week 1
    plan.append({
        "week": 1,
        "title": "Know your numbers",
        "tasks": [
            "List all monthly expenses (rent, food, utilities, subscriptions)",
            "Calculate your take-home pay after taxes",
            "Find out what insurance you currently have (check employer benefits)",
        ],
        "time_estimate": "2 hours",
        "priority": "high",
    })

    # Week 2
    starter_tasks = [
        "Open a high-yield savings account (look for 4%+ APY — Ally, Marcus, or SoFi)",
        f"Set up auto-transfer of ${int(monthly * 0.05)}/month to your emergency fund",
        "Set a 90-day goal: save $1,000 as your starter fund",
    ]
    plan.append({
        "week": 2,
        "title": "Start your emergency fund",
        "tasks": starter_tasks,
        "time_estimate": "30 minutes",
        "priority": "high",
    })

    # Week 3 — insurance
    insurance_tasks = []
    if profile.housing_type == "rent":
        insurance_tasks.append("Get a renters insurance quote (avg $15/month) — try State Farm or Lemonade")
    if profile.dependents > 0:
        insurance_tasks.append("Research term life insurance — compare quotes on Policygenius.com")
    insurance_tasks.append("Review your auto insurance — are you getting all discounts you qualify for?")
    plan.append({
        "week": 3,
        "title": "Close your insurance gaps",
        "tasks": insurance_tasks,
        "time_estimate": "1–2 hours",
        "priority": "high" if profile.dependents > 0 else "medium",
    })

    # Week 4 — budget
    plan.append({
        "week": 4,
        "title": "Set up a simple budget",
        "tasks": [
            "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings & debt payoff",
            "Download a free budgeting app (YNAB free trial, or just a spreadsheet)",
            f"If you have debt: list balances + interest rates, target highest rate first",
        ],
        "time_estimate": "1 hour",
        "priority": "medium",
    })

    # Weeks 5-12 — ongoing
    monthly_save = int(monthly * 0.1)
    plan.append({
        "week": "5–12",
        "title": f"Build toward {scores['emergency_fund']['target_months']}-month fund",
        "tasks": [
            f"Keep saving ${monthly_save}/month (10% of estimated income)",
            f"Goal: reach ${gap:,.0f} in emergency savings",
            "Revisit insurance annually or after major life changes",
            "Check in on your budget every 2 weeks — adjust as needed",
        ],
        "time_estimate": "15 min/week",
        "priority": "medium",
    })

    return plan

def get_insurance_recommendations(profile: UserProfile) -> list:
    recs = []
    for key, product in INSURANCE_PRODUCTS.items():
        include = True
        if "for_housing" in product and profile.housing_type not in product["for_housing"]:
            include = False
        if key == "life" and profile.dependents == 0:
            include = False
        if key == "umbrella" and profile.income_range in ["under_30k", "30k_60k"]:
            include = False
        if include:
            recs.append({
                "id": key,
                **product,
            })
    return recs

def mock_ai_chat(message: str, profile: Optional[UserProfile]) -> str:
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["emergency", "fund", "savings", "save", "saving"]):
        return MOCK_AI_RESPONSES["emergency_fund"]
    elif any(w in msg_lower for w in ["renters", "renter", "apartment", "tenant"]):
        return MOCK_AI_RESPONSES["renters_insurance"]
    elif any(w in msg_lower for w in ["life insurance", "life", "term", "whole life", "beneficiary"]):
        return MOCK_AI_RESPONSES["life_insurance"]
    else:
        return MOCK_AI_RESPONSES["default"]

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "FinGuard AI API", "version": "1.0.0", "status": "running"}

@app.post("/api/analyze")
def analyze_profile(profile: UserProfile):
    scores = calculate_risk_scores(profile)
    action_plan = build_action_plan(profile, scores)
    insurance_recs = get_insurance_recommendations(profile)
    return {
        "scores": scores,
        "action_plan": action_plan,
        "insurance_recommendations": insurance_recs,
        "income_info": INCOME_BRACKETS.get(profile.income_range, {}),
    }

@app.post("/api/chat")
def chat(msg: ChatMessage):
    if not msg.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    response = mock_ai_chat(msg.message, msg.profile)
    return {"response": response, "source": "mock"}

@app.get("/api/flood-risk/{zip_code}")
def flood_risk(zip_code: str):
    risk = get_flood_risk(zip_code)
    tips = {
        "low": "Your area has relatively low flood risk. Basic homeowners/renters insurance should suffice.",
        "medium": "Moderate flood risk in your area. Consider checking FEMA flood maps for your specific address.",
        "high": "Higher flood risk detected. Standard home/renters insurance does NOT cover floods — consider a separate flood policy.",
    }
    return {"zip_code": zip_code, "risk_level": risk, "tip": tips.get(risk, "")}

@app.get("/api/insurance-products")
def list_insurance_products():
    return {"products": INSURANCE_PRODUCTS}
