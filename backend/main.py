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

load_dotenv()

# ─── Config ────────────────────────────────────────────────────────────────────
AUTH0_DOMAIN        = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE      = os.getenv("AUTH0_AUDIENCE", "https://finguard-api")
GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY", "")
ELEVENLABS_API_KEY  = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

app = FastAPI(title="FinGuard AI API", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
security = HTTPBearer(auto_error=False)

# ─── Auth0 ─────────────────────────────────────────────────────────────────────
def get_auth0_jwks():
    import urllib.request, json
    with urllib.request.urlopen(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json") as r:
        return json.loads(r.read())

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        jwks = get_auth0_jwks()
        header = jwt.get_unverified_header(credentials.credentials)
        rsa_key = next(({"kty":k["kty"],"kid":k["kid"],"use":k["use"],"n":k["n"],"e":k["e"]} for k in jwks["keys"] if k["kid"]==header["kid"]), None)
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find matching key")
        return jwt.decode(credentials.credentials, rsa_key, algorithms=["RS256"], audience=AUTH0_AUDIENCE, issuer=f"https://{AUTH0_DOMAIN}/")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def optional_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials: return None
    try: return verify_token(credentials)
    except HTTPException: return None

# ─── MODELS ────────────────────────────────────────────────────────────────────

# Your original FinGuard profile
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

# Charan's new simulation profile
class SimulationProfile(BaseModel):
    age: int
    income_range: str       # under_30k | 30k_60k | 60k_100k | over_100k
    employment: str         # employed | self_employed | unemployed | retired
    dependents: int
    current_savings: int    # months of savings 0-6
    stress_level: int       # 2 | 5 | 8
    goal_priority: str      # emergency_fund | family_security | homeownership | career_growth
    decision_type: str      # buy_car | move_city | take_loan | change_job
    decision_cost: int      # expected monthly cost
    time_horizon: int       # planning months 3-36

class ChatMessage(BaseModel):
    message: str
    profile: Optional[UserProfile] = None

class SimChatMessage(BaseModel):
    message: str
    profile: Optional[SimulationProfile] = None

class TTSRequest(BaseModel):
    text: str

# ─── YOUR ORIGINAL STATIC DATA ─────────────────────────────────────────────────
FLOOD_RISK_BY_ZIP_PREFIX = {"1":"low","2":"medium","3":"high","4":"medium","5":"low","6":"medium","7":"high","8":"low","9":"medium","0":"high"}
INSURANCE_PRODUCTS = {
    "renters":    {"name":"Renters Insurance",    "avg_cost":15,  "importance":"high",     "description":"Covers your belongings if stolen or damaged. Also covers liability if someone gets hurt in your home.",     "for_housing":["rent"]},
    "homeowners": {"name":"Homeowners Insurance", "avg_cost":125, "importance":"critical", "description":"Protects your home structure and belongings. Required by most mortgage lenders.",                           "for_housing":["own"]},
    "life":       {"name":"Life Insurance",       "avg_cost":30,  "importance":"high",     "description":"Provides income replacement for your family if you pass away. Essential if you have dependents.",           "for_dependents":True},
    "disability": {"name":"Disability Insurance", "avg_cost":50,  "importance":"medium",   "description":"Replaces 60-70% of your income if you cannot work due to illness or injury."},
    "auto":       {"name":"Auto Insurance",       "avg_cost":120, "importance":"critical", "description":"Required by law in most states. Covers accidents, theft, and liability."},
    "umbrella":   {"name":"Umbrella Insurance",   "avg_cost":20,  "importance":"low",      "description":"Extra liability protection beyond your auto/home policies. Great if you own assets."},
}

# ─── CHARAN'S STATIC DATA ──────────────────────────────────────────────────────
INCOME_BRACKETS = {
    "under_30k":{"monthly":2200,"label":"Under $30,000"},
    "30k_60k":  {"monthly":3900,"label":"$30,000 - $60,000"},
    "60k_100k": {"monthly":6500,"label":"$60,000 - $100,000"},
    "over_100k":{"monthly":9800,"label":"Over $100,000"},
}
EMPLOYMENT_STABILITY = {"employed":1.0,"self_employed":0.82,"unemployed":0.45,"retired":0.72}
DECISION_LIBRARY = {
    "buy_car":   {"label":"Buy a car",          "baseline_cost":850,  "stress_load":0.55,"risk_load":0.45},
    "move_city": {"label":"Move to a new city", "baseline_cost":1100, "stress_load":0.70,"risk_load":0.58},
    "take_loan": {"label":"Take a loan",         "baseline_cost":600,  "stress_load":0.50,"risk_load":0.72},
    "change_job":{"label":"Change jobs",         "baseline_cost":350,  "stress_load":0.62,"risk_load":0.40},
}
GOAL_PROFILES = {
    "emergency_fund":  {"label":"Build emergency fund",   "target_amount":12000,"monthly_target":500, "description":"Protect near-term stability and absorb unexpected life events."},
    "family_security": {"label":"Support family security","target_amount":18000,"monthly_target":650, "description":"Keep more margin for dependents, care needs, and recurring obligations."},
    "homeownership":   {"label":"Save for homeownership", "target_amount":35000,"monthly_target":800, "description":"Preserve down-payment momentum and reduce goal delays."},
    "career_growth":   {"label":"Invest in career growth","target_amount":10000,"monthly_target":450, "description":"Keep flexibility for training, relocation, and income mobility."},
}
EVENT_LIBRARY = {"job_loss":{"label":"Job loss","income_loss_months":2,"extra_cost":600,"stress_hit":22,"risk_hit":24}}
SCENARIO_MODIFIERS = {
    "safe":    {"title":"Safe choice",    "decision_factor":0.80,"discretionary_cut":0.12,"buffer_release":0.00,"stress_bonus": 8,"risk_bonus": 10},
    "balanced":{"title":"Balanced choice","decision_factor":1.00,"discretionary_cut":0.05,"buffer_release":0.02,"stress_bonus": 0,"risk_bonus":  0},
    "risky":   {"title":"Risky choice",   "decision_factor":1.18,"discretionary_cut":0.00,"buffer_release":0.06,"stress_bonus":-10,"risk_bonus":-14},
}

# ─── GEMINI ─────────────────────────────────────────────────────────────────────
FINGUARD_PROMPT = """You are FinGuard AI, a friendly financial wellness coach helping everyday Americans understand personal finance, insurance, and emergency preparedness in plain English.\n\nGuidelines:\n- Keep responses concise and practical (under 250 words)\n- Use simple language (Grade 8 reading level)\n- Use bullet points and bold text for key points\n- Give specific, actionable steps\n- Never recommend specific investment products\n- Focus on: emergency funds, insurance basics, budgeting, debt, disaster preparedness\n- Always be warm, non-judgmental, and encouraging\n"""
SIMULATOR_PROMPT = """You are Life Impact AI, a friendly financial decision coach. Help people evaluate how financial decisions affect their money, stress, resilience, and goals. Keep responses concise (under 200 words) and give specific actionable guidance.\n"""

def gemini_chat(message: str, system_prompt: str = FINGUARD_PROMPT, context: str = "") -> str:
    # if not GEMINI_API_KEY:
    return fallback_chat(message)
    # payload = {
    #     "contents": [{"parts": [{"text": f"{system_prompt}\n\nUser question: {message}{context}"}]}],
    #     "generationConfig": {"maxOutputTokens": 500, "temperature": 0.7}
    # }
    # import urllib.request, urllib.error, json as jm, time
    # for api_ver, model in [("v1","gemini-2.0-flash-001"),("v1","gemini-2.0-flash"),("v1beta","gemini-2.0-flash"),("v1beta","gemini-2.0-flash-lite")]:
    #     url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{model}:generateContent?key={GEMINI_API_KEY}"
    #     for attempt in range(2):
    #         try:
    #             req = urllib.request.Request(url, data=jm.dumps(payload).encode(), headers={"Content-Type":"application/json"}, method="POST")
    #             with urllib.request.urlopen(req, timeout=20) as r:
    #                 return jm.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"]
    #         except urllib.error.HTTPError as e:
    #             if e.code == 429: time.sleep(5*(attempt+1)); continue
    #             break
    #         except Exception: break
    # return fallback_chat(message)

def fallback_chat(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["emergency","fund","savings","save"]):
        return "**Emergency Fund Basics**\n\nAim for 3-6 months of expenses in a high-yield savings account. Start with a $1,000 goal — it covers 90% of common emergencies."
    if any(w in msg for w in ["renters","renter","apartment"]):
        return "**Renters Insurance** costs about $15/month and covers your belongings, liability, and temporary housing."
    if any(w in msg for w in ["life insurance","life","term"]):
        return "**Life Insurance** is essential if you have dependents. Term life is cheapest — aim for 10-12x your annual income as coverage."
    return "I can help with **emergency funds**, **insurance basics**, **budgeting**, and **disaster preparedness**. What would you like to know?"

# ─── YOUR ORIGINAL SCORING ─────────────────────────────────────────────────────
def get_flood_risk(zip_code: str) -> str:
    return FLOOD_RISK_BY_ZIP_PREFIX.get(zip_code[0] if zip_code else "", "medium")

def calculate_risk_scores(profile: UserProfile) -> dict:
    monthly = profile.monthly_expenses
    target_months = 6 if profile.dependents > 0 else 3
    fund_score = min(100, int((profile.savings_months / target_months) * 100))
    fund_gap_months = max(0, target_months - profile.savings_months)
    needed = []
    if profile.housing_type == "rent": needed.append("renters")
    elif profile.housing_type == "own": needed.append("homeowners")
    if profile.dependents > 0: needed.append("life")
    needed.extend(["auto","disability"])
    insurance_score = random.randint(30, 70)
    flood_risk = get_flood_risk(profile.zip_code)
    flood_score = {"low":85,"medium":50,"high":20,"unknown":50}[flood_risk]
    return {
        "overall": int((fund_score*0.4) + (insurance_score*0.35) + (flood_score*0.25)),
        "emergency_fund": {"score":fund_score,"current_months":profile.savings_months,"target_months":target_months,
                           "gap_months":fund_gap_months,"gap_amount":round(fund_gap_months*monthly),"monthly_expenses":monthly},
        "insurance": {"score":insurance_score,"recommended":needed,"flood_risk":flood_risk},
        "flood": {"score":flood_score,"risk_level":flood_risk,"zip_code":profile.zip_code},
    }

def build_action_plan_finguard(profile: UserProfile, scores: dict) -> list:
    monthly = scores["emergency_fund"]["monthly_expenses"]
    gap = scores["emergency_fund"]["gap_amount"]
    ins_tasks = []
    if profile.housing_type == "rent": ins_tasks.append("Get a renters insurance quote (avg $15/month) — try State Farm or Lemonade")
    if profile.dependents > 0: ins_tasks.append("Research term life insurance — compare quotes on Policygenius.com")
    ins_tasks.append("Review your auto insurance — are you getting all discounts you qualify for?")
    return [
        {"week":1,"title":"Know your numbers","priority":"high","time_estimate":"2 hours",
         "tasks":["List all monthly expenses (rent, food, utilities, subscriptions)","Calculate your take-home pay after taxes","Find out what insurance you currently have (check employer benefits)"]},
        {"week":2,"title":"Start your emergency fund","priority":"high","time_estimate":"30 minutes",
         "tasks":["Open a high-yield savings account (look for 4%+ APY)",f"Set up auto-transfer of ${int(monthly*0.05)}/month","Set a 90-day goal: save $1,000 as your starter fund"]},
        {"week":3,"title":"Close your insurance gaps","priority":"high" if profile.dependents>0 else "medium","time_estimate":"1-2 hours","tasks":ins_tasks},
        {"week":4,"title":"Set up a simple budget","priority":"medium","time_estimate":"1 hour",
         "tasks":["Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings","Download a free budgeting app (YNAB free trial, or a spreadsheet)","If you have debt: target highest interest rate first"]},
        {"week":"5-12","title":f"Build toward {scores['emergency_fund']['target_months']}-month fund","priority":"medium","time_estimate":"15 min/week",
         "tasks":[f"Keep saving ${int(monthly*0.1)}/month",f"Goal: reach ${gap:,.0f} in emergency savings","Revisit insurance annually or after life changes","Check your budget every 2 weeks"]},
    ]

def get_insurance_recommendations(profile: UserProfile) -> list:
    recs = []
    for key, product in INSURANCE_PRODUCTS.items():
        if "for_housing" in product and profile.housing_type not in product["for_housing"]: continue
        if key == "life" and profile.dependents == 0: continue
        if key == "umbrella" and profile.annual_income < 60000: continue
        recs.append({"id": key, **product})
    return recs

# ─── CHARAN'S SIMULATION ENGINE ────────────────────────────────────────────────
def clamp(v: float, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, int(round(v))))

def s_income(p: SimulationProfile) -> float:
    return INCOME_BRACKETS.get(p.income_range, {}).get("monthly", 4000)

def s_expenses(p: SimulationProfile) -> float:
    income = s_income(p)
    base = 0.55 if income<=3900 else 0.5 if income<=6500 else 0.46
    drag = 0.04 if p.employment=="self_employed" else 0.07 if p.employment=="unemployed" else 0.03 if p.employment=="retired" else 0.0
    return (income*(base+drag)) + (p.dependents*280) + (120 if p.age>=55 else 0)

def s_savings(p: SimulationProfile) -> float:
    return p.current_savings * s_expenses(p)

def s_discretionary(p: SimulationProfile) -> float:
    return max(0.0, s_income(p) - s_expenses(p))

def s_decision_cost(p: SimulationProfile, sk: str) -> float:
    d = DECISION_LIBRARY[p.decision_type]; m = SCENARIO_MODIFIERS[sk]
    base = max(p.decision_cost, d["baseline_cost"])
    return (base + p.dependents*70 + (80 if p.age>=45 else 0)) * m["decision_factor"]

def s_goal_capacity(p: SimulationProfile, sk: str) -> float:
    m = SCENARIO_MODIFIERS[sk]
    retained = max(0.0, s_discretionary(p) * (1 - m["discretionary_cut"]))
    return max(0.0, retained - s_decision_cost(p, sk))

def s_savings_after(p: SimulationProfile, sk: str) -> float:
    start = s_savings(p); m = SCENARIO_MODIFIERS[sk]
    return max(0.0, start - start*m["buffer_release"] + s_goal_capacity(p,sk)*p.time_horizon)

def s_buffer_months(p: SimulationProfile, sk: str) -> float:
    return s_savings_after(p, sk) / max(s_expenses(p), 1)

def s_goal_delay(p: SimulationProfile, sk: str) -> int:
    g = GOAL_PROFILES[p.goal_priority]; target = g["target_amount"]; current = s_savings(p)
    baseline = max(1.0, (target-current)/max(g["monthly_target"],1))
    cap = s_goal_capacity(p, sk)
    scenario = max(1.0,(target-current)/max(cap,1)) if cap>0 else baseline*2.5
    return max(0, int(round(scenario-baseline)))

def s_fin_score(p: SimulationProfile, sk: str) -> int:
    return clamp((s_buffer_months(p,sk)/6)*65 + (s_goal_capacity(p,sk)/max(s_income(p),1)/0.2)*35)

def s_stress_score(p: SimulationProfile, sk: str) -> int:
    d=DECISION_LIBRARY[p.decision_type]; m=SCENARIO_MODIFIERS[sk]
    cp = s_decision_cost(p,sk)/max(s_income(p),1); buf=s_buffer_months(p,sk)
    return clamp(100-(p.stress_level*8 + d["stress_load"]*26 + cp*40 + p.dependents*3 + max(0,3-buf)*6 - m["stress_bonus"]))

def s_risk_score(p: SimulationProfile, sk: str) -> int:
    d=DECISION_LIBRARY[p.decision_type]; m=SCENARIO_MODIFIERS[sk]
    buf=s_buffer_months(p,sk); ef=EMPLOYMENT_STABILITY.get(p.employment,0.75); cp=s_decision_cost(p,sk)/max(s_income(p),1)
    return clamp(ef*32 + min(buf,6)/6*38 + (1-min(cp,1.2)/1.2)*20 + m["risk_bonus"] - d["risk_load"]*10)

def s_goal_score(p: SimulationProfile, sk: str) -> int:
    g=GOAL_PROFILES[p.goal_priority]
    cr=s_goal_capacity(p,sk)/max(g["monthly_target"],1)
    pr=s_savings_after(p,sk)/max(g["target_amount"],1)
    return clamp(55*min(cr,1.4) + 25*min(pr,1.0) + 20 - s_goal_delay(p,sk)*4)

def s_resilience(p: SimulationProfile, sk: str, fin: int, risk: int, stress: int, goal: int) -> int:
    return clamp(fin*0.35 + risk*0.3 + stress*0.2 + goal*0.15 + min(s_buffer_months(p,sk),6)/6*25)

def s_timeline(p: SimulationProfile, sk: str) -> list:
    months = sorted({0, max(1,p.time_horizon//2), p.time_horizon})
    m = SCENARIO_MODIFIERS[sk]
    start = max(0.0, s_savings(p)*(1-m["buffer_release"]))
    net = s_discretionary(p) - s_decision_cost(p,sk)
    return [{"month":mo,"savings":round(max(0.0,start+net*mo))} for mo in months]

def build_sim_scenario(p: SimulationProfile, sk: str) -> dict:
    g=GOAL_PROFILES[p.goal_priority]
    mi=round(s_decision_cost(p,sk)); fin=s_fin_score(p,sk); stress=s_stress_score(p,sk)
    risk=s_risk_score(p,sk); gv=s_goal_score(p,sk); res=s_resilience(p,sk,fin,risk,stress,gv)
    scores=[("financial stability",fin),("stress control",stress),("risk protection",risk),(g["label"].lower(),gv)]
    return {
        "id":sk,"title":SCENARIO_MODIFIERS[sk]["title"],"monthly_impact":mi,
        "financial_score":fin,"stress_score":stress,"risk_score":risk,"goal_score":gv,"resilience_score":res,
        "goal_delay_months":s_goal_delay(p,sk),"emergency_months":round(s_buffer_months(p,sk),2),
        "monthly_free_cash_before":round(s_discretionary(p)),"monthly_free_cash_after":round(s_goal_capacity(p,sk)),
        "timeline":s_timeline(p,sk),
        "summary":f"{SCENARIO_MODIFIERS[sk]['title']} costs ${mi}/mo. Strongest: {max(scores,key=lambda x:x[1])[0]}. Weakest: {min(scores,key=lambda x:x[1])[0]}.",
    }

def simulate_shock(p: SimulationProfile, scenario: dict, ek: str) -> dict:
    e=EVENT_LIBRARY[ek]; income=s_income(p)
    hit=(income*e["income_loss_months"]*(1-EMPLOYMENT_STABILITY.get(p.employment,0.75)))+e["extra_cost"]
    shocked_buf=max(0.0,s_savings_after(p,scenario["id"])-hit)/max(s_expenses(p),1)
    cr=hit/max(income*max(p.time_horizon,1),1)
    sf=clamp(scenario["financial_score"]-cr*220-max(0,2-shocked_buf)*8)
    ss=clamp(scenario["stress_score"]-e["stress_hit"]-max(0,2-shocked_buf)*5)
    sr=clamp(scenario["risk_score"]-e["risk_hit"]-cr*180)
    sg=clamp(scenario["goal_score"]-cr*150)
    res=clamp(sf*0.35+sr*0.3+ss*0.2+sg*0.15)
    status="holds" if res>=65 else "under pressure" if res>=45 else "fails"
    return {"event":e["label"],"status":status,"financial_score":sf,"stress_score":ss,"risk_score":sr,
            "goal_score":sg,"resilience_score":res,"cash_hit":round(hit),
            "buffer_after_event_months":round(shocked_buf,2),
            "insight":f"{e['label']} removes ~${round(hit):,}. Leaves {round(shocked_buf,2)} months covered — this path {status}."}

def build_simulation_analysis(p: SimulationProfile) -> dict:
    scenarios=[build_sim_scenario(p,sk) for sk in ("safe","balanced","risky")]
    event_results=[{"scenario_id":s["id"],"scenario_title":s["title"],"shock":simulate_shock(p,s,"job_loss")} for s in scenarios]
    best=max(scenarios,key=lambda s:s["resilience_score"])
    weakest=min(event_results,key=lambda e:e["shock"]["resilience_score"])
    goal=GOAL_PROFILES[p.goal_priority]
    avg_risk=sum(s["risk_score"] for s in scenarios)/3
    safest=max(scenarios,key=lambda s:s["resilience_score"])
    balanced=next(s for s in scenarios if s["id"]=="balanced")
    riskiest_event=min(event_results,key=lambda e:e["shock"]["resilience_score"])
    nudges=[
        {"title":"Strongest scenario","message":f"{safest['title']} is strongest — ${safest['monthly_free_cash_after']:,} free/month and {safest['emergency_months']} months of essentials covered."},
        {"title":"Stress driver","message":f"Your stress level is {p.stress_level}/10. Any path above ${balanced['monthly_impact']:,}/month pushes the stress score down faster."},
        {"title":"Shock warning","message":f"Under {riskiest_event['shock']['event'].lower()}, the weakest path falls to {riskiest_event['shock']['buffer_after_event_months']} months of coverage. That is the break point to watch."},
    ]
    emergency_target=round(s_expenses(p)*3)
    action_plan=[
        {"week":"Week 1","title":"Lock in the real monthly math","priority":"high","time_estimate":"45 min",
         "tasks":[f"Your estimated monthly income is ${round(s_income(p)):,} and essentials are ~${round(s_expenses(p)):,}.",f"Keep the decision at or below ${best['monthly_impact']:,}/month to protect cash flow.","Write down the fixed monthly cost before committing, including hidden fees."]},
        {"week":"Week 2","title":"Protect your buffer","priority":"high","time_estimate":"30 min",
         "tasks":[f"Build toward at least ${emergency_target:,} (3 months of essentials).",f"Your weakest event is {weakest['shock']['event'].lower()}, creating a cash shock of ${weakest['shock']['cash_hit']:,}.","Delay optional upgrades until the buffer can absorb that shock."]},
        {"week":"Week 3","title":"Protect the goal contribution","priority":"medium","time_estimate":"1 hour",
         "tasks":[f"The strongest path keeps ${best['monthly_free_cash_after']:,}/month after the decision.","Automate that amount toward your main goal before increasing discretionary spending.","If free cash drops below zero, step down to the safer version."]},
        {"week":"Week 4","title":"Review leading indicators","priority":"medium","time_estimate":"20 min/week",
         "tasks":["Track four numbers weekly: savings balance, monthly free cash, stress level, and goal contribution.",f"If resilience falls under {max(40,best['resilience_score']-10)}, pause the risky path.","Rerun the simulator after any income or expense change."]},
    ]
    return {
        "headline":f"{DECISION_LIBRARY[p.decision_type]['label']} works best as the {best['title'].lower()} because it keeps more monthly free cash and protects your {goal['label'].lower()} goal better.",
        "decision":{"type":p.decision_type,"label":DECISION_LIBRARY[p.decision_type]["label"],"time_horizon":p.time_horizon},
        "goal":goal,
        "metrics":{"life_impact_score":clamp(sum(s["resilience_score"] for s in scenarios)/3),"stress_readiness":clamp(sum(s["stress_score"] for s in scenarios)/3),"risk_exposure":clamp(100-avg_risk),"goal_protection":clamp(sum(s["goal_score"] for s in scenarios)/3)},
        "base_math":{"monthly_income":round(s_income(p)),"essential_expenses":round(s_expenses(p)),"starting_savings":round(s_savings(p)),"free_cash_before_decision":round(s_discretionary(p)),"employment_stability":EMPLOYMENT_STABILITY.get(p.employment,0.75)},
        "scenarios":scenarios,
        "shock_test":{"event":"Job loss","results":event_results,"weakest_path":weakest},
        "coach_nudges":nudges,
        "action_plan":action_plan,
    }

# ─── ROUTES ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message":"FinGuard AI + Life Impact Simulator","version":"3.0.0","status":"running",
            "integrations":{"auth0":bool(AUTH0_DOMAIN),"gemini":bool(GEMINI_API_KEY),"elevenlabs":bool(ELEVENLABS_API_KEY)}}

# Your original routes — UNCHANGED
@app.post("/api/analyze")
def analyze_profile(profile: UserProfile, user=Depends(optional_auth)):
    scores=calculate_risk_scores(profile); action_plan=build_action_plan_finguard(profile,scores); insurance_recs=get_insurance_recommendations(profile)
    return {"scores":scores,"action_plan":action_plan,"insurance_recommendations":insurance_recs,
            "income_info":{"annual_income":round(profile.annual_income,2),"monthly_expenses":round(profile.monthly_expenses,2)},
            "user":user.get("name") if user else None}

@app.post("/api/chat")
def chat(msg: ChatMessage, user=Depends(optional_auth)):
    if not msg.message.strip(): raise HTTPException(status_code=400, detail="Message cannot be empty")
    context=""
    if msg.profile:
        context=f"\n\n[User: Age {msg.profile.age}, Income ${msg.profile.annual_income:,.0f}, Housing: {msg.profile.housing_type}, Dependents: {msg.profile.dependents}, Savings: {msg.profile.savings_months} months]"
    return {"response":gemini_chat(msg.message,FINGUARD_PROMPT,context),"source":"gemini" if GEMINI_API_KEY else "fallback","user":user.get("name") if user else None}

@app.get("/api/flood-risk/{zip_code}")
def flood_risk(zip_code: str):
    risk=get_flood_risk(zip_code)
    return {"zip_code":zip_code,"risk_level":risk,"tip":{"low":"Your area has relatively low flood risk. Basic homeowners/renters insurance should suffice.","medium":"Moderate flood risk. Consider checking FEMA flood maps for your specific address.","high":"Higher flood risk. Standard insurance does NOT cover floods — consider a separate flood policy."}.get(risk,"")}

@app.get("/api/insurance-products")
def list_insurance_products():
    return {"products":INSURANCE_PRODUCTS}

# Charan's new routes
@app.post("/api/simulate")
def simulate(profile: SimulationProfile, user=Depends(optional_auth)):
    """Life Impact Simulator — 3-scenario decision analysis with shock testing."""
    return build_simulation_analysis(profile)

@app.post("/api/simulate/chat")
def simulate_chat(msg: SimChatMessage, user=Depends(optional_auth)):
    if not msg.message.strip(): raise HTTPException(status_code=400, detail="Message cannot be empty")
    context=""
    if msg.profile:
        d=DECISION_LIBRARY.get(msg.profile.decision_type,{}); g=GOAL_PROFILES.get(msg.profile.goal_priority,{})
        context=f"\n\n[Decision: {d.get('label',msg.profile.decision_type)}, Goal: {g.get('label',msg.profile.goal_priority)}, Monthly cost: ${msg.profile.decision_cost}, Horizon: {msg.profile.time_horizon} months, Stress: {msg.profile.stress_level}/10]"
    return {"response":gemini_chat(msg.message,SIMULATOR_PROMPT,context),"source":"gemini" if GEMINI_API_KEY else "fallback"}

# Shared auth routes
@app.post("/api/tts")
async def text_to_speech(req: TTSRequest, user=Depends(verify_token)):
    if not ELEVENLABS_API_KEY: raise HTTPException(status_code=503, detail="ElevenLabs not configured")
    import re
    clean=re.sub(r'\*{1,2}([^*]+)\*{1,2}',r'\1',req.text)
    clean=re.sub(r'^#+\s+','',clean,flags=re.MULTILINE)[:1000]
    async with httpx.AsyncClient() as client:
        resp=await client.post(f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers={"xi-api-key":ELEVENLABS_API_KEY,"Content-Type":"application/json"},
            json={"text":clean,"model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.5,"similarity_boost":0.75}},timeout=30.0)
    if resp.status_code!=200: raise HTTPException(status_code=502, detail="ElevenLabs API error")
    from fastapi.responses import Response
    return Response(content=resp.content, media_type="audio/mpeg")

@app.get("/api/me")
def get_me(user=Depends(verify_token)):
    return {"sub":user.get("sub"),"name":user.get("name"),"email":user.get("email"),"picture":user.get("picture")}
