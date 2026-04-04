
import os
import re
from typing import Optional

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "https://life-impact-ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Life Impact AI API", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


def get_auth0_jwks():
    import json
    import urllib.request

    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        jwks = get_auth0_jwks()
        header = jwt.get_unverified_header(token)
        rsa_key = next(
            (
                {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                for key in jwks["keys"]
                if key["kid"] == header["kid"]
            ),
            None,
        )
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find matching key")
        return jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(exc)}")


def optional_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        return None
    try:
        return verify_token(credentials)
    except HTTPException:
        return None


class UserProfile(BaseModel):
    age: int
    income_range: str
    employment: str
    dependents: int
    current_savings: int
    stress_level: int
    goal_priority: str
    decision_type: str
    decision_cost: int
    time_horizon: int


class ChatMessage(BaseModel):
    message: str
    profile: Optional[UserProfile] = None


class TTSRequest(BaseModel):
    text: str


INCOME_BRACKETS = {
    "under_30k": {"monthly": 2200, "label": "Under $30,000"},
    "30k_60k": {"monthly": 3900, "label": "$30,000 - $60,000"},
    "60k_100k": {"monthly": 6500, "label": "$60,000 - $100,000"},
    "over_100k": {"monthly": 9800, "label": "Over $100,000"},
}

EMPLOYMENT_STABILITY = {
    "employed": 1.0,
    "self_employed": 0.82,
    "unemployed": 0.45,
    "retired": 0.72,
}

EMPLOYMENT_LABELS = {
    "employed": "employed full time",
    "self_employed": "self-employed",
    "unemployed": "between jobs",
    "retired": "retired",
}

DECISION_LIBRARY = {
    "buy_car": {
        "label": "Buy a car",
        "baseline_cost": 850,
        "stress_load": 0.55,
        "risk_load": 0.45,
    },
    "move_city": {
        "label": "Move to a new city",
        "baseline_cost": 1100,
        "stress_load": 0.7,
        "risk_load": 0.58,
    },
    "take_loan": {
        "label": "Take a loan",
        "baseline_cost": 600,
        "stress_load": 0.5,
        "risk_load": 0.72,
    },
    "change_job": {
        "label": "Change jobs",
        "baseline_cost": 350,
        "stress_load": 0.62,
        "risk_load": 0.4,
    },
}

GOAL_PROFILES = {
    "emergency_fund": {
        "label": "Build emergency fund",
        "target_amount": 12000,
        "monthly_target": 500,
        "description": "Protect near-term stability and absorb unexpected life events.",
    },
    "family_security": {
        "label": "Support family security",
        "target_amount": 18000,
        "monthly_target": 650,
        "description": "Keep more margin for dependents, care needs, and recurring obligations.",
    },
    "homeownership": {
        "label": "Save for homeownership",
        "target_amount": 35000,
        "monthly_target": 800,
        "description": "Preserve down-payment momentum and reduce goal delays.",
    },
    "career_growth": {
        "label": "Invest in career growth",
        "target_amount": 10000,
        "monthly_target": 450,
        "description": "Keep flexibility for training, relocation, and income mobility.",
    },
}

EVENT_LIBRARY = {
    "job_loss": {
        "label": "Job loss",
        "income_loss_months": 2,
        "extra_cost": 600,
        "stress_hit": 22,
        "risk_hit": 24,
    },
    "medical_emergency": {
        "label": "Medical emergency",
        "income_loss_months": 0,
        "extra_cost": 4500,
        "stress_hit": 18,
        "risk_hit": 16,
    },
    "economic_downturn": {
        "label": "Economic downturn",
        "income_loss_months": 1,
        "extra_cost": 1200,
        "stress_hit": 10,
        "risk_hit": 14,
    },
}

SCENARIO_MODIFIERS = {
    "safe": {
        "title": "Safe choice",
        "decision_factor": 0.8,
        "discretionary_cut": 0.12,
        "buffer_release": 0.0,
        "stress_bonus": 8,
        "risk_bonus": 10,
    },
    "balanced": {
        "title": "Balanced choice",
        "decision_factor": 1.0,
        "discretionary_cut": 0.05,
        "buffer_release": 0.02,
        "stress_bonus": 0,
        "risk_bonus": 0,
    },
    "risky": {
        "title": "Risky choice",
        "decision_factor": 1.18,
        "discretionary_cut": 0.0,
        "buffer_release": 0.06,
        "stress_bonus": -10,
        "risk_bonus": -14,
    },
}

SYSTEM_PROMPT = """You are Life Impact AI, a friendly decision coach.

You help people evaluate how financial decisions affect their money, stress, resilience, and goals.
"""


def clamp(value: float, lower: int = 0, upper: int = 100) -> int:
    return max(lower, min(upper, int(round(value))))


def monthly_income(profile: UserProfile) -> float:
    return INCOME_BRACKETS.get(profile.income_range, {}).get("monthly", 4000)


def essential_expenses(profile: UserProfile) -> float:
    income = monthly_income(profile)
    base_ratio = 0.55 if income <= 3900 else 0.5 if income <= 6500 else 0.46
    employment_drag = 0.04 if profile.employment == "self_employed" else 0.07 if profile.employment == "unemployed" else 0.03 if profile.employment == "retired" else 0.0
    dependent_cost = profile.dependents * 280
    age_cost = 120 if profile.age >= 55 else 0
    return (income * (base_ratio + employment_drag)) + dependent_cost + age_cost


def current_savings_amount(profile: UserProfile) -> float:
    return profile.current_savings * essential_expenses(profile)


def discretionary_capacity(profile: UserProfile) -> float:
    return max(0.0, monthly_income(profile) - essential_expenses(profile))


def effective_decision_cost(profile: UserProfile, scenario_key: str) -> float:
    decision = DECISION_LIBRARY[profile.decision_type]
    modifier = SCENARIO_MODIFIERS[scenario_key]
    base_cost = max(profile.decision_cost, decision["baseline_cost"])
    dependents_addon = profile.dependents * 70
    age_addon = 80 if profile.age >= 45 else 0
    return (base_cost + dependents_addon + age_addon) * modifier["decision_factor"]


def monthly_goal_capacity(profile: UserProfile, scenario_key: str) -> float:
    modifier = SCENARIO_MODIFIERS[scenario_key]
    free_cash = discretionary_capacity(profile)
    decision_cost = effective_decision_cost(profile, scenario_key)
    retained_discretionary = max(0.0, free_cash * (1 - modifier["discretionary_cut"]))
    return max(0.0, retained_discretionary - decision_cost)


def savings_after_horizon(profile: UserProfile, scenario_key: str) -> float:
    start = current_savings_amount(profile)
    goal_capacity = monthly_goal_capacity(profile, scenario_key)
    modifier = SCENARIO_MODIFIERS[scenario_key]
    reserve_draw = current_savings_amount(profile) * modifier["buffer_release"]
    return max(0.0, start - reserve_draw + (goal_capacity * profile.time_horizon))


def emergency_months_after_horizon(profile: UserProfile, scenario_key: str) -> float:
    return savings_after_horizon(profile, scenario_key) / max(essential_expenses(profile), 1)

def goal_progress_ratio(profile: UserProfile, scenario_key: str) -> float:
    goal = GOAL_PROFILES[profile.goal_priority]
    progress = savings_after_horizon(profile, scenario_key) / max(goal["target_amount"], 1)
    return max(0.0, progress)


def goal_delay_months(profile: UserProfile, scenario_key: str) -> int:
    goal = GOAL_PROFILES[profile.goal_priority]
    target = goal["target_amount"]
    current_assets = current_savings_amount(profile)
    baseline_months = max(1.0, (target - current_assets) / max(goal["monthly_target"], 1))
    scenario_capacity = monthly_goal_capacity(profile, scenario_key)
    scenario_months = max(1.0, (target - current_assets) / max(scenario_capacity, 1)) if scenario_capacity > 0 else baseline_months * 2.5
    return max(0, int(round(scenario_months - baseline_months)))


def financial_score(profile: UserProfile, scenario_key: str) -> int:
    buffer_months = emergency_months_after_horizon(profile, scenario_key)
    surplus_ratio = monthly_goal_capacity(profile, scenario_key) / max(monthly_income(profile), 1)
    return clamp((buffer_months / 6) * 65 + (surplus_ratio / 0.2) * 35)


def stress_score(profile: UserProfile, scenario_key: str) -> int:
    decision = DECISION_LIBRARY[profile.decision_type]
    modifier = SCENARIO_MODIFIERS[scenario_key]
    cost_pressure = effective_decision_cost(profile, scenario_key) / max(monthly_income(profile), 1)
    buffer_months = emergency_months_after_horizon(profile, scenario_key)
    raw = 100 - (
        profile.stress_level * 8
        + decision["stress_load"] * 26
        + cost_pressure * 40
        + profile.dependents * 3
        + max(0, 3 - buffer_months) * 6
        - modifier["stress_bonus"]
    )
    return clamp(raw)


def risk_score(profile: UserProfile, scenario_key: str) -> int:
    decision = DECISION_LIBRARY[profile.decision_type]
    modifier = SCENARIO_MODIFIERS[scenario_key]
    buffer_months = emergency_months_after_horizon(profile, scenario_key)
    employment_factor = EMPLOYMENT_STABILITY.get(profile.employment, 0.75)
    cost_pressure = effective_decision_cost(profile, scenario_key) / max(monthly_income(profile), 1)
    raw = (
        employment_factor * 32
        + min(buffer_months, 6) / 6 * 38
        + (1 - min(cost_pressure, 1.2) / 1.2) * 20
        + modifier["risk_bonus"]
        - decision["risk_load"] * 10
    )
    return clamp(raw)


def goal_score(profile: UserProfile, scenario_key: str) -> int:
    goal = GOAL_PROFILES[profile.goal_priority]
    contribution_ratio = monthly_goal_capacity(profile, scenario_key) / max(goal["monthly_target"], 1)
    delay_penalty = goal_delay_months(profile, scenario_key) * 4
    raw = 55 * min(contribution_ratio, 1.4) + 25 * min(goal_progress_ratio(profile, scenario_key), 1.0) + 20 - delay_penalty
    return clamp(raw)


def resilience_score(profile: UserProfile, scenario_key: str, fin_score: int, risk: int, stress: int, goal_value: int) -> int:
    buffer_component = min(emergency_months_after_horizon(profile, scenario_key), 6) / 6 * 25
    return clamp(fin_score * 0.35 + risk * 0.3 + stress * 0.2 + goal_value * 0.15 + buffer_component)


def build_timeline(profile: UserProfile, scenario_key: str) -> list:
    months = sorted({0, max(1, profile.time_horizon // 2), profile.time_horizon})
    start_savings = current_savings_amount(profile)
    decision_cost = effective_decision_cost(profile, scenario_key)
    free_cash_before = discretionary_capacity(profile)
    monthly_net = free_cash_before - decision_cost
    modifier = SCENARIO_MODIFIERS[scenario_key]
    reserve_draw = current_savings_amount(profile) * modifier["buffer_release"]
    adjusted_start = max(0.0, start_savings - reserve_draw)
    timeline = []
    for month in months:
        savings = max(0.0, adjusted_start + monthly_net * month)
        stress_now = clamp(stress_score(profile, scenario_key) - (month / max(profile.time_horizon, 1)) * 8)
        timeline.append({"month": month, "savings": round(savings), "stress": stress_now})
    return timeline


def build_scenario(profile: UserProfile, scenario_key: str) -> dict:
    goal = GOAL_PROFILES[profile.goal_priority]
    monthly_impact = round(effective_decision_cost(profile, scenario_key))
    fin = financial_score(profile, scenario_key)
    stress = stress_score(profile, scenario_key)
    risk = risk_score(profile, scenario_key)
    goal_value = goal_score(profile, scenario_key)
    resilience = resilience_score(profile, scenario_key, fin, risk, stress, goal_value)
    delay = goal_delay_months(profile, scenario_key)
    free_cash_before = discretionary_capacity(profile)
    free_cash_after = monthly_goal_capacity(profile, scenario_key)
    buffer_months = emergency_months_after_horizon(profile, scenario_key)

    strongest_metric = max(
        [("financial stability", fin), ("stress control", stress), ("risk protection", risk), (goal["label"].lower(), goal_value)],
        key=lambda item: item[1],
    )[0]
    weakest_metric = min(
        [("financial stability", fin), ("stress control", stress), ("risk protection", risk), (goal["label"].lower(), goal_value)],
        key=lambda item: item[1],
    )[0]

    return {
        "id": scenario_key,
        "title": SCENARIO_MODIFIERS[scenario_key]["title"],
        "monthly_impact": monthly_impact,
        "financial_score": fin,
        "stress_score": stress,
        "risk_score": risk,
        "goal_score": goal_value,
        "resilience_score": resilience,
        "goal_delay_months": delay,
        "cash_buffer_after_6m": round(max(0.0, current_savings_amount(profile) + (free_cash_after * 6))),
        "emergency_months": round(buffer_months, 2),
        "monthly_free_cash_before": round(free_cash_before),
        "monthly_free_cash_after": round(free_cash_after),
        "goal_progress_percent": clamp(goal_progress_ratio(profile, scenario_key) * 100),
        "timeline": build_timeline(profile, scenario_key),
        "summary": (
            f"{SCENARIO_MODIFIERS[scenario_key]['title']} uses a monthly decision load of ${monthly_impact}. "
            f"It is strongest on {strongest_metric} and weakest on {weakest_metric}."
        ),
        "math": {
            "monthly_income": round(monthly_income(profile)),
            "essential_expenses": round(essential_expenses(profile)),
            "decision_cost": monthly_impact,
            "free_cash_before": round(free_cash_before),
            "free_cash_after": round(free_cash_after),
            "emergency_months_after_horizon": round(buffer_months, 2),
            "goal_target_amount": goal["target_amount"],
        },
    }


def simulate_event(profile: UserProfile, scenario: dict, event_key: str) -> dict:
    event = EVENT_LIBRARY[event_key]
    income = monthly_income(profile)
    event_cash_hit = (income * event["income_loss_months"] * (1 - EMPLOYMENT_STABILITY.get(profile.employment, 0.75))) + event["extra_cost"]
    scenario_savings = savings_after_horizon(profile, scenario["id"])
    shocked_savings = max(0.0, scenario_savings - event_cash_hit)
    shocked_buffer = shocked_savings / max(essential_expenses(profile), 1)
    cash_hit_ratio = event_cash_hit / max(income * max(profile.time_horizon, 1), 1)

    shocked_financial = clamp(scenario["financial_score"] - cash_hit_ratio * 220 - max(0, 2 - shocked_buffer) * 8)
    shocked_stress = clamp(scenario["stress_score"] - event["stress_hit"] - max(0, 2 - shocked_buffer) * 5)
    shocked_risk = clamp(scenario["risk_score"] - event["risk_hit"] - cash_hit_ratio * 180)
    shocked_goal = clamp(scenario["goal_score"] - cash_hit_ratio * 150)
    resilience_after = clamp(shocked_financial * 0.35 + shocked_risk * 0.3 + shocked_stress * 0.2 + shocked_goal * 0.15)
    status = "holds" if resilience_after >= 65 else "under pressure" if resilience_after >= 45 else "fails"

    return {
        "event": event["label"],
        "status": status,
        "financial_score": shocked_financial,
        "stress_score": shocked_stress,
        "risk_score": shocked_risk,
        "goal_score": shocked_goal,
        "resilience_score": resilience_after,
        "cash_hit": round(event_cash_hit),
        "buffer_after_event_months": round(shocked_buffer, 2),
        "insight": (
            f"{event['label']} removes about ${round(event_cash_hit):,} from the plan. "
            f"That leaves roughly {round(shocked_buffer, 2)} months of essentials covered, so this path {status}."
        ),
    }

def build_action_plan(profile: UserProfile, best_scenario: dict, weakest_event: dict) -> list:
    emergency_target = round(essential_expenses(profile) * 3)
    return [
        {
            "week": "Week 1",
            "title": "Lock in the real monthly math",
            "priority": "high",
            "time_estimate": "45 min",
            "tasks": [
                f"Your estimated monthly income is ${round(monthly_income(profile)):,} and essentials are about ${round(essential_expenses(profile)):,}.",
                f"Keep the decision at or below ${best_scenario['monthly_impact']:,} per month if you want to protect cash flow.",
                "Write down the fixed monthly cost before you commit, including hidden fees.",
            ],
        },
        {
            "week": "Week 2",
            "title": "Protect your buffer",
            "priority": "high",
            "time_estimate": "30 min",
            "tasks": [
                f"Build toward at least ${emergency_target:,}, which is about 3 months of essentials in this model.",
                f"Your weakest event is {weakest_event['event'].lower()}, which creates an estimated cash shock of ${weakest_event['cash_hit']:,}.",
                "Delay optional upgrades until the buffer can absorb that shock.",
            ],
        },
        {
            "week": "Week 3",
            "title": "Protect the goal contribution",
            "priority": "medium",
            "time_estimate": "1 hour",
            "tasks": [
                f"The strongest path keeps about ${best_scenario['monthly_free_cash_after']:,} available each month after the decision.",
                "Automate that amount toward your main goal before increasing discretionary spending.",
                "If free cash drops below zero, step down to the safer version of the decision.",
            ],
        },
        {
            "week": "Week 4",
            "title": "Review leading indicators",
            "priority": "medium",
            "time_estimate": "20 min/week",
            "tasks": [
                "Track four numbers weekly: savings balance, monthly free cash, stress level, and goal contribution.",
                f"If resilience falls under {max(40, best_scenario['resilience_score'] - 10)}, pause the risky path.",
                "Rerun the simulator after any income or expense change.",
            ],
        },
    ]


def build_coach_nudges(profile: UserProfile, scenarios: list, event_results: list) -> list:
    safest = max(scenarios, key=lambda item: item["resilience_score"])
    riskiest = min(event_results, key=lambda item: item["shock"]["resilience_score"])
    balanced = next(item for item in scenarios if item["id"] == "balanced")
    return [
        {
            "title": "Strongest scenario",
            "message": f"{safest['title']} is strongest because it leaves ${safest['monthly_free_cash_after']:,} free each month and {safest['emergency_months']} months of essentials covered.",
        },
        {
            "title": "Stress driver",
            "message": f"Your current stress input is {profile.stress_level}/10, so any path with a monthly decision load above ${balanced['monthly_impact']:,} pushes the stress score down faster.",
        },
        {
            "title": "Shock warning",
            "message": f"Under {riskiest['shock']['event'].lower()}, the weakest path falls to {riskiest['shock']['buffer_after_event_months']} months of coverage. That is the break point to watch.",
        },
    ]


def build_analysis(profile: UserProfile) -> dict:
    scenarios = [build_scenario(profile, key) for key in ("safe", "balanced", "risky")]
    event_results = [
        {"scenario_id": scenario["id"], "scenario_title": scenario["title"], "shock": simulate_event(profile, scenario, "job_loss")}
        for scenario in scenarios
    ]
    best_scenario = max(scenarios, key=lambda item: item["resilience_score"])
    weakest_shock = min(event_results, key=lambda item: item["shock"]["resilience_score"])
    goal = GOAL_PROFILES[profile.goal_priority]
    avg_risk_score = sum(item["risk_score"] for item in scenarios) / len(scenarios)

    metrics = {
        "life_impact_score": clamp(sum(item["resilience_score"] for item in scenarios) / len(scenarios)),
        "stress_readiness": clamp(sum(item["stress_score"] for item in scenarios) / len(scenarios)),
        "risk_exposure": clamp(100 - avg_risk_score),
        "goal_protection": clamp(sum(item["goal_score"] for item in scenarios) / len(scenarios)),
    }

    return {
        "headline": (
            f"{DECISION_LIBRARY[profile.decision_type]['label']} works best as the {best_scenario['title'].lower()} path "
            f"because it keeps more monthly free cash and protects your {goal['label'].lower()} goal better."
        ),
        "decision": {
            "type": profile.decision_type,
            "label": DECISION_LIBRARY[profile.decision_type]["label"],
            "time_horizon": profile.time_horizon,
        },
        "goal": goal,
        "metrics": metrics,
        "base_math": {
            "monthly_income": round(monthly_income(profile)),
            "essential_expenses": round(essential_expenses(profile)),
            "starting_savings": round(current_savings_amount(profile)),
            "free_cash_before_decision": round(discretionary_capacity(profile)),
            "employment_stability": EMPLOYMENT_STABILITY.get(profile.employment, 0.75),
        },
        "scenarios": scenarios,
        "shock_test": {
            "event": "Job loss",
            "results": event_results,
            "weakest_path": weakest_shock,
        },
        "coach_nudges": build_coach_nudges(profile, scenarios, event_results),
        "action_plan": build_action_plan(profile, best_scenario, weakest_shock["shock"]),
        "architecture": {
            "frontend": "Web and mobile experience for decision simulation",
            "api_layer": "FastAPI endpoints for profile capture, simulation, and AI coaching",
            "ai_engine": "Deterministic decision model plus optional LLM phrasing",
            "data_layer": "User profile, decisions, and behavior history",
            "integrations": ["Banking APIs", "Voice output", "Messaging channels like SMS or WhatsApp"],
        },
    }


def scenario_math_lines(scenario: dict) -> list:
    math = scenario["math"]
    return [
        f"Income: ${math['monthly_income']:,}/month",
        f"Essential expenses: ${math['essential_expenses']:,}/month",
        f"Decision cost in this scenario: ${math['decision_cost']:,}/month",
        f"Free cash before decision: ${math['free_cash_before']:,}/month",
        f"Free cash after decision: ${math['free_cash_after']:,}/month",
        f"Emergency coverage after horizon: {math['emergency_months_after_horizon']} months",
    ]


def deterministic_chat(message: str, profile: Optional[UserProfile]) -> str:
    if not profile:
        return (
            "I can explain a decision using your inputs, but I need a simulation first. "
            "Run the simulator and then ask me to compare scenarios, explain stress, risk, shock events, or goal delays."
        )

    analysis = build_analysis(profile)
    scenarios = {item["id"]: item for item in analysis["scenarios"]}
    safest = max(analysis["scenarios"], key=lambda item: item["resilience_score"])
    balanced = scenarios["balanced"]
    weak_shock = analysis["shock_test"]["weakest_path"]
    text = message.lower()

    if any(word in text for word in ["compare", "difference", "safe", "risky", "balanced"]):
        lines = ["**Scenario comparison based on your inputs**"]
        for key in ("safe", "balanced", "risky"):
            scenario = scenarios[key]
            lines.append(
                f"- **{scenario['title']}**: ${scenario['monthly_impact']:,}/month, ${scenario['monthly_free_cash_after']:,} free cash left, {scenario['emergency_months']} months covered, resilience {scenario['resilience_score']}/100, goal delay {scenario['goal_delay_months']} months."
            )
        lines.append(f"**Best overall:** {safest['title']} because it leaves the strongest safety buffer and monthly cash margin.")
        return "\n".join(lines)

    if any(word in text for word in ["afford", "can i", "possible", "feasible"]):
        feasible = balanced["monthly_free_cash_after"] >= 0 and balanced["emergency_months"] >= 2
        return (
            f"**Short answer:** {'Yes, but with discipline.' if feasible else 'Not comfortably in the current balanced path.'}\n\n"
            f"In the balanced path, you keep **${balanced['monthly_free_cash_after']:,}/month** after the decision and **{balanced['emergency_months']} months** of essentials covered. "
            f"If you want safer math, the safe path improves that to **${safest['monthly_free_cash_after']:,}/month** and **{safest['emergency_months']} months**."
        )

    if any(word in text for word in ["stress", "anxious", "overwhelmed"]):
        return (
            f"**Stress is driven by three inputs in this model:** your current stress level ({profile.stress_level}/10), the decision cost, and how much emergency buffer remains.\n\n"
            f"Balanced path stress score: **{balanced['stress_score']}/100**. Safe path stress score: **{scenarios['safe']['stress_score']}/100**. "
            f"The safer path scores better because it reduces monthly strain and preserves more buffer."
        )

    if any(word in text for word in ["risk", "job loss", "shock", "emergency"]):
        shock = weak_shock["shock"]
        return (
            f"**Shock test result:** the weakest scenario is **{weak_shock['scenario_title']}**.\n\n"
            f"A job loss removes about **${shock['cash_hit']:,}** from that plan and leaves **{shock['buffer_after_event_months']} months** of essentials covered. "
            f"That is why it is marked **{shock['status']}** with resilience **{shock['resilience_score']}/100**."
        )

    if any(word in text for word in ["goal", "delay", "home", "family", "career", "fund"]):
        return (
            f"Your protected goal is **{analysis['goal']['label']}**.\n\n"
            f"Safe path delay: **{scenarios['safe']['goal_delay_months']} months**. Balanced path delay: **{balanced['goal_delay_months']} months**. Risky path delay: **{scenarios['risky']['goal_delay_months']} months**.\n\n"
            f"The delay changes because the monthly amount left for the goal changes after the decision cost is applied."
        )

    if any(word in text for word in ["math", "calculate", "formula", "numbers", "why"]):
        lines = ["**Balanced scenario math**"]
        lines.extend(f"- {line}" for line in scenario_math_lines(balanced))
        lines.append("- Financial score is based on emergency months covered plus free cash left after the decision.")
        lines.append("- Stress score is based on your stress input, decision load, dependents, and leftover buffer.")
        lines.append("- Risk score is based on employment stability, emergency coverage, and cost pressure.")
        lines.append("- Goal score is based on how much monthly contribution remains for your main goal and how much delay is introduced.")
        return "\n".join(lines)

    if any(word in text for word in ["what should", "recommend", "next step", "do now"]):
        first = analysis["action_plan"][0]
        return f"**Recommended next move:** {first['title']}.\n\n" + "\n".join(f"- {task}" for task in first["tasks"])

    return (
        f"You are evaluating **{analysis['decision']['label']}** over **{analysis['decision']['time_horizon']} months**.\n\n"
        f"The strongest path right now is **{safest['title']}** with resilience **{safest['resilience_score']}/100** because it keeps **${safest['monthly_free_cash_after']:,}/month** after the decision and **{safest['emergency_months']} months** of essentials covered.\n\n"
        "Ask me to compare scenarios, explain the math, stress, risk, or goal delays in more detail."
    )

def gemini_chat(message: str, profile: Optional[UserProfile] = None) -> str:
    deterministic = deterministic_chat(message, profile)
    if not GEMINI_API_KEY or not profile:
        return deterministic
    try:
        analysis = build_analysis(profile)
        model = genai.GenerativeModel(model_name="gemini-1.5-flash", system_instruction=SYSTEM_PROMPT)
        context = (
            f"\n\n[Use this deterministic analysis and do not invent numbers: {analysis}]"
            f"\n\n[User question: {message}]"
        )
        response = model.generate_content(context)
        return response.text or deterministic
    except Exception as exc:
        print(f"Gemini error: {exc}")
        return deterministic


@app.get("/")
def root():
    return {
        "message": "Life Impact AI API",
        "version": "3.1.0",
        "status": "running",
        "integrations": {
            "auth0": bool(AUTH0_DOMAIN),
            "gemini": bool(GEMINI_API_KEY),
            "elevenlabs": bool(ELEVENLABS_API_KEY),
        },
    }


@app.post("/api/analyze")
def analyze_profile(profile: UserProfile, user=Depends(optional_auth)):
    analysis = build_analysis(profile)
    analysis["user"] = user.get("name") if user else None
    analysis["income_info"] = INCOME_BRACKETS.get(profile.income_range, {})
    analysis["employment_label"] = EMPLOYMENT_LABELS.get(profile.employment, profile.employment)
    return analysis


@app.post("/api/chat")
def chat(msg: ChatMessage, user=Depends(optional_auth)):
    if not msg.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return {
        "response": gemini_chat(msg.message, msg.profile),
        "source": "deterministic+gemini" if GEMINI_API_KEY and msg.profile else "deterministic",
        "user": user.get("name") if user else None,
    }


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest, user=Depends(verify_token)):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs not configured")
    clean = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", req.text)
    clean = re.sub(r"^#+\s+", "", clean, flags=re.MULTILINE)
    clean = clean[:1000]
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": clean,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
            timeout=30.0,
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="ElevenLabs API error")
    return Response(content=response.content, media_type="audio/mpeg")


@app.get("/api/me")
def get_me(user=Depends(verify_token)):
    return {
        "sub": user.get("sub"),
        "name": user.get("name"),
        "email": user.get("email"),
        "picture": user.get("picture"),
    }
