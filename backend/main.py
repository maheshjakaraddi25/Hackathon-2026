from math import ceil
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="FinGuard AI API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserProfile(BaseModel):
    age: int
    income_range: str
    dependents: int
    housing_type: str
    zip_code: str
    employment: str
    has_savings: bool
    savings_months: int


class ChatMessage(BaseModel):
    message: str
    profile: Optional[UserProfile] = None


class LifeDecisionRequest(BaseModel):
    decision_type: str
    event_type: Optional[str] = "none"
    profile: UserProfile


FLOOD_RISK_BY_ZIP_PREFIX = {
    "1": "low",
    "2": "medium",
    "3": "high",
    "4": "medium",
    "5": "low",
    "6": "medium",
    "7": "high",
    "8": "low",
    "9": "medium",
    "0": "high",
}

INCOME_BRACKETS = {
    "under_30k": {"monthly": 2000, "label": "Under $30k/yr"},
    "30k_60k": {"monthly": 3750, "label": "$30k-$60k/yr"},
    "60k_100k": {"monthly": 6667, "label": "$60k-$100k/yr"},
    "over_100k": {"monthly": 10000, "label": "Over $100k/yr"},
}

INSURANCE_PRODUCTS = {
    "renters": {
        "name": "Renters Insurance",
        "avg_cost": 15,
        "description": "Protects belongings, liability, and temporary housing after covered losses.",
        "importance": "high",
        "for_housing": ["rent"],
    },
    "homeowners": {
        "name": "Homeowners Insurance",
        "avg_cost": 125,
        "description": "Protects the home structure, belongings, and personal liability.",
        "importance": "critical",
        "for_housing": ["own"],
    },
    "life": {
        "name": "Life Insurance",
        "avg_cost": 30,
        "description": "Provides income replacement when others depend on your earnings.",
        "importance": "high",
        "for_dependents": True,
    },
    "disability": {
        "name": "Disability Insurance",
        "avg_cost": 50,
        "description": "Protects earned income if illness or injury interrupts work.",
        "importance": "medium",
    },
    "auto": {
        "name": "Auto Insurance",
        "avg_cost": 120,
        "description": "Covers vehicle liability, damage, and legal requirements in most states.",
        "importance": "critical",
    },
    "umbrella": {
        "name": "Umbrella Insurance",
        "avg_cost": 20,
        "description": "Adds extra liability protection when assets and income rise.",
        "importance": "low",
    },
}

SCENARIO_LABELS = {
    "safe": "Safe choice",
    "balanced": "Balanced choice",
    "risky": "Risky choice",
}

DECISION_COPY = {
    "buy_car": {
        "label": "Buy a car",
        "headline": "A car improves mobility, but it creates a durable monthly obligation.",
        "coach_tip": "Total cost of ownership matters more than the sticker price alone.",
    },
    "move_city": {
        "label": "Move cities",
        "headline": "Relocation can improve opportunity while adding temporary cash pressure.",
        "coach_tip": "Moves usually fail because of weak cash buffers, not because the destination is wrong.",
    },
    "take_loan": {
        "label": "Take a loan",
        "headline": "A loan can solve a short-term need while reducing future monthly flexibility.",
        "coach_tip": "Debt is safest when the repayment plan still works after a bad month.",
    },
    "change_job": {
        "label": "Change jobs",
        "headline": "Job changes can increase long-term income, but transitions create short-term instability.",
        "coach_tip": "The best role change is the one your savings can survive during the transition.",
    },
}


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def round_money(value: float) -> int:
    return int(round(value))


def get_flood_risk(zip_code: str) -> str:
    if not zip_code:
        return "unknown"
    return FLOOD_RISK_BY_ZIP_PREFIX.get(zip_code[0], "medium")


def get_profile_financials(profile: UserProfile) -> dict:
    monthly_income = INCOME_BRACKETS.get(profile.income_range, {}).get("monthly", 3000)

    housing_ratio = {
        "rent": 0.52,
        "own": 0.60,
        "other": 0.47,
    }.get(profile.housing_type, 0.52)

    employment_ratio = {
        "employed": 0.00,
        "self_employed": 0.03,
        "unemployed": 0.08,
        "retired": 0.02,
    }.get(profile.employment, 0.00)

    dependent_ratio = min(profile.dependents * 0.05, 0.15)
    essential_ratio = clamp(housing_ratio + employment_ratio + dependent_ratio, 0.42, 0.82)
    essentials = round_money(monthly_income * essential_ratio)
    free_cash_flow = monthly_income - essentials

    target_months = 6 if (profile.dependents > 0 or profile.employment in ["self_employed", "unemployed"]) else 3
    current_savings = round_money(essentials * profile.savings_months)
    target_savings = round_money(essentials * target_months)
    flood_risk = get_flood_risk(profile.zip_code)

    return {
        "monthly_income": monthly_income,
        "essential_ratio": round(essential_ratio, 3),
        "essential_expenses": essentials,
        "free_cash_flow": free_cash_flow,
        "current_savings": current_savings,
        "target_months": target_months,
        "target_savings": target_savings,
        "buffer_ratio": current_savings / max(target_savings, 1),
        "flood_risk": flood_risk,
    }


def get_protection_gap_inputs(profile: UserProfile, financials: dict) -> dict:
    housing_need = {"rent": 18, "own": 28, "other": 10}.get(profile.housing_type, 18)
    dependent_need = min(profile.dependents * 12, 24)
    income_need = {"employed": 14, "self_employed": 20, "unemployed": 10, "retired": 8}.get(profile.employment, 14)
    flood_need = {"low": 2, "medium": 8, "high": 14, "unknown": 8}[financials["flood_risk"]]
    affordability_bonus = clamp((financials["free_cash_flow"] / max(financials["monthly_income"], 1)) * 40, 0, 15)
    savings_bonus = clamp(financials["buffer_ratio"] * 12, 0, 12)

    exposure_total = 20 + housing_need + dependent_need + income_need + flood_need
    score = round(clamp(100 - exposure_total + affordability_bonus + savings_bonus))

    return {
        "score": score,
        "drivers": {
            "housing_need": housing_need,
            "dependent_need": dependent_need,
            "income_need": income_need,
            "flood_need": flood_need,
            "affordability_bonus": round(affordability_bonus, 1),
            "savings_bonus": round(savings_bonus, 1),
        },
    }


def get_recommended_coverage_keys(profile: UserProfile) -> list:
    needed = []
    if profile.housing_type == "rent":
        needed.append("renters")
    elif profile.housing_type == "own":
        needed.append("homeowners")
    if profile.dependents > 0:
        needed.append("life")
    if profile.employment in ["employed", "self_employed"]:
        needed.append("disability")
    needed.append("auto")
    if profile.income_range == "over_100k" or profile.housing_type == "own":
        needed.append("umbrella")
    return needed


def calculate_risk_scores(profile: UserProfile) -> dict:
    financials = get_profile_financials(profile)
    protection = get_protection_gap_inputs(profile, financials)

    fund_score = round(clamp(financials["buffer_ratio"] * 100))
    fund_gap_amount = max(0, financials["target_savings"] - financials["current_savings"])
    fund_gap_months = max(0, financials["target_months"] - profile.savings_months)
    flood_score = {"low": 85, "medium": 55, "high": 25, "unknown": 50}[financials["flood_risk"]]

    overall = round((fund_score * 0.45) + (protection["score"] * 0.35) + (flood_score * 0.20))

    return {
        "overall": overall,
        "emergency_fund": {
            "score": fund_score,
            "current_months": profile.savings_months,
            "target_months": financials["target_months"],
            "gap_months": fund_gap_months,
            "gap_amount": fund_gap_amount,
            "monthly_income_est": financials["monthly_income"],
            "essential_expenses_est": financials["essential_expenses"],
            "current_savings_est": financials["current_savings"],
            "target_savings_est": financials["target_savings"],
        },
        "insurance": {
            "score": protection["score"],
            "recommended": get_recommended_coverage_keys(profile),
            "flood_risk": financials["flood_risk"],
            "drivers": protection["drivers"],
        },
        "flood": {
            "score": flood_score,
            "risk_level": financials["flood_risk"],
            "zip_code": profile.zip_code,
        },
        "cash_flow": {
            "monthly_income": financials["monthly_income"],
            "essential_expenses": financials["essential_expenses"],
            "free_cash_flow": financials["free_cash_flow"],
        },
    }


def build_action_plan(profile: UserProfile, scores: dict) -> list:
    monthly_income = scores["cash_flow"]["monthly_income"]
    essentials = scores["cash_flow"]["essential_expenses"]
    free_cash = scores["cash_flow"]["free_cash_flow"]
    gap = scores["emergency_fund"]["gap_amount"]
    target_months = scores["emergency_fund"]["target_months"]
    starter_transfer = max(25, round_money(max(free_cash, monthly_income * 0.05) * 0.35))

    insurance_tasks = []
    if profile.housing_type == "rent":
        insurance_tasks.append("Get a renters insurance quote and compare deductible options.")
    if profile.housing_type == "own":
        insurance_tasks.append("Review homeowners coverage, especially weather exclusions and liability limits.")
    if profile.dependents > 0:
        insurance_tasks.append("Price term life insurance so dependents can replace lost income.")
    if profile.employment in ["employed", "self_employed"]:
        insurance_tasks.append("Review disability coverage because your earnings are still your biggest asset.")

    return [
        {
            "week": 1,
            "title": "Measure your real monthly baseline",
            "tasks": [
                f"Treat ${essentials:,} as your current estimate of essential monthly expenses.",
                "Separate essential bills from flexible spending so your survival budget is visible.",
                "Identify one fixed cost you can reduce before adding any new monthly commitment.",
            ],
            "time_estimate": "90 minutes",
            "priority": "high",
        },
        {
            "week": 2,
            "title": "Strengthen your safety net",
            "tasks": [
                f"Automate about ${starter_transfer:,}/month into emergency savings.",
                "Keep the first savings milestone simple: build or protect the first $1,000.",
                f"Your current emergency-fund gap is about ${gap:,} toward a {target_months}-month target.",
            ],
            "time_estimate": "30 minutes",
            "priority": "high",
        },
        {
            "week": 3,
            "title": "Cover the biggest protection gaps",
            "tasks": insurance_tasks or ["Review your insurance and income-protection exposures."],
            "time_estimate": "1-2 hours",
            "priority": "high" if profile.dependents > 0 else "medium",
        },
        {
            "week": 4,
            "title": "Create a decision rule",
            "tasks": [
                "Run major purchases through the simulator before committing.",
                "Pause on any decision that pushes monthly free cash flow below zero.",
                "Stress-test decisions against job loss or a medical surprise before saying yes.",
            ],
            "time_estimate": "1 hour",
            "priority": "medium",
        },
        {
            "week": "5-12",
            "title": f"Build toward a {target_months}-month runway",
            "tasks": [
                f"Keep closing the remaining ${gap:,} gap to your target buffer.",
                "Re-run the simulator whenever you consider a car, move, loan, or job change.",
                "Review protection needs after any housing, family, or employment change.",
            ],
            "time_estimate": "20 min/week",
            "priority": "medium",
        },
    ]


def get_insurance_recommendations(profile: UserProfile) -> list:
    recs = []
    for key, product in INSURANCE_PRODUCTS.items():
        include = True
        if "for_housing" in product and profile.housing_type not in product["for_housing"]:
            include = False
        if key == "life" and profile.dependents == 0:
            include = False
        if key == "disability" and profile.employment not in ["employed", "self_employed"]:
            include = False
        if key == "umbrella" and profile.income_range not in ["60k_100k", "over_100k"] and profile.housing_type != "own":
            include = False
        if include:
            recs.append({"id": key, **product})
    return recs


def get_decision_model(profile: UserProfile, decision_type: str, scenario_id: str, financials: dict) -> dict:
    income = financials["monthly_income"]
    essentials = financials["essential_expenses"]
    dependents = profile.dependents

    if decision_type == "buy_car":
        models = {
            "safe": {"upfront": max(1500, income * 0.18), "recurring": income * 0.09 + essentials * 0.02, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
            "balanced": {"upfront": max(2500, income * 0.26), "recurring": income * 0.12 + essentials * 0.025, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
            "risky": {"upfront": max(4000, income * 0.34), "recurring": income * 0.16 + essentials * 0.03, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
        }
        model = models[scenario_id]
        model["summary"] = "Used-car sized payment, standard payment, or high fixed-cost payment."
        return model

    if decision_type == "move_city":
        models = {
            "safe": {"upfront": essentials * 1.2 + income * 0.08 + dependents * 200, "recurring": income * 0.01, "transition_months": 2, "transition_income_factor": 1.0, "post_raise": 0.05},
            "balanced": {"upfront": essentials * 1.6 + income * 0.12 + dependents * 250, "recurring": income * 0.04, "transition_months": 3, "transition_income_factor": 0.95, "post_raise": 0.08},
            "risky": {"upfront": essentials * 2.2 + income * 0.16 + dependents * 300, "recurring": income * 0.08, "transition_months": 4, "transition_income_factor": 0.88, "post_raise": 0.02},
        }
        model = models[scenario_id]
        model["summary"] = "Relocation cost plus a new recurring housing/city-cost assumption."
        return model

    if decision_type == "take_loan":
        models = {
            "safe": {"upfront": -(income * 0.60), "recurring": income * 0.08, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
            "balanced": {"upfront": -(income * 1.00), "recurring": income * 0.13, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
            "risky": {"upfront": -(income * 1.50), "recurring": income * 0.19, "transition_months": 0, "transition_income_factor": 1.0, "post_raise": 0.0},
        }
        model = models[scenario_id]
        model["summary"] = "Loan gives cash today, but future payments reduce monthly flexibility."
        return model

    models = {
        "safe": {"upfront": essentials * 0.30, "recurring": 0, "transition_months": 1, "transition_income_factor": 0.85, "post_raise": 0.08},
        "balanced": {"upfront": essentials * 0.60, "recurring": 0, "transition_months": 2, "transition_income_factor": 0.70, "post_raise": 0.14},
        "risky": {"upfront": essentials * 1.00, "recurring": 0, "transition_months": 3, "transition_income_factor": 0.45, "post_raise": 0.22},
    }
    model = models[scenario_id]
    model["summary"] = "Role transition temporarily reduces income before a potential salary increase."
    return model


def get_event_model(event_type: str, financials: dict) -> dict:
    essentials = financials["essential_expenses"]
    income = financials["monthly_income"]
    return {
        "none": {"label": "No stress test", "shock_month": None, "duration": 0, "income_factor": 1.0, "extra_cost": 0, "lump_sum": 0},
        "job_loss": {"label": "Job loss", "shock_month": 4, "duration": 2, "income_factor": 0.25, "extra_cost": essentials * 0.15, "lump_sum": essentials * 0.25},
        "medical_emergency": {"label": "Medical emergency", "shock_month": 4, "duration": 1, "income_factor": 0.90, "extra_cost": 0, "lump_sum": essentials * 1.20},
        "economic_downturn": {"label": "Economic downturn", "shock_month": 4, "duration": 5, "income_factor": 0.88, "extra_cost": essentials * 0.05, "lump_sum": income * 0.05},
    }.get(event_type, {"label": "No stress test", "shock_month": None, "duration": 0, "income_factor": 1.0, "extra_cost": 0, "lump_sum": 0})


def build_coach_nudge(
    profile: UserProfile,
    decision_type: str,
    scenario_id: str,
    monthly_cash_flow_after: int,
    goal_delay: int,
    post_event_runway: float,
) -> str:
    if monthly_cash_flow_after < 0:
        return f"This path turns monthly cash flow negative by about ${abs(monthly_cash_flow_after):,}. That means the decision starts eating savings immediately."
    if post_event_runway < 1:
        return "This scenario fails the stress test because savings would cover less than one month of essentials after the event."
    if goal_delay >= 6:
        return f"This scenario still works mathematically, but it delays your main savings goal by about {goal_delay} months."
    if decision_type == "take_loan":
        return "The loan helps today only if the monthly payment still leaves positive cash flow every month."
    if decision_type == "change_job" and scenario_id == "risky":
        return "The upside is strong, but the transition period is long enough that your savings buffer becomes the real decision driver."
    if profile.dependents > 0:
        return f"Because other people rely on you, keep at least {max(3, profile.savings_months)} months of essential runway after this decision."
    return "This path is mathematically manageable as long as you preserve positive monthly cash flow and keep a real emergency buffer."


def project_decision_path(profile: UserProfile, decision_type: str, scenario_id: str, event_type: str) -> dict:
    financials = get_profile_financials(profile)
    decision = get_decision_model(profile, decision_type, scenario_id, financials)
    event = get_event_model(event_type, financials)
    balance = financials["current_savings"] - decision["upfront"]
    balance_with_event = balance

    timeline = [{"month": "Now", "savings": round_money(balance)}]
    event_timeline = [{"month": "Now", "savings": round_money(balance_with_event)}]
    cumulative_goal_without = 0.0
    cash_flow_samples = []

    for month in range(1, 13):
        if month <= decision["transition_months"]:
            income_without = financials["monthly_income"] * decision["transition_income_factor"]
        else:
            income_without = financials["monthly_income"] * (1 + decision["post_raise"])

        monthly_cost = financials["essential_expenses"] + decision["recurring"]
        monthly_cash_without = income_without - monthly_cost
        balance += monthly_cash_without
        cumulative_goal_without += max(monthly_cash_without, 0)

        income_with = income_without
        monthly_cost_with = monthly_cost
        if event["shock_month"] and event["shock_month"] <= month < (event["shock_month"] + event["duration"]):
            income_with *= event["income_factor"]
            monthly_cost_with += event["extra_cost"]
        monthly_cash_with = income_with - monthly_cost_with

        if event["shock_month"] == month:
            balance_with_event -= event["lump_sum"]
        balance_with_event += monthly_cash_with

        cash_flow_samples.append(
            {
                "month": month,
                "income_without_event": round_money(income_without),
                "income_with_event": round_money(income_with),
                "cost": round_money(monthly_cost),
                "cash_flow_without_event": round_money(monthly_cash_without),
                "cash_flow_with_event": round_money(monthly_cash_with),
            }
        )

        if month in [3, 6, 12]:
            timeline.append({"month": f"{month} mo", "savings": round_money(balance)})
            event_timeline.append({"month": f"{month} mo", "savings": round_money(balance_with_event)})

    post_event_months_of_runway = max(0.0, balance_with_event / max(financials["essential_expenses"], 1))
    base_months_of_runway = max(0.0, balance / max(financials["essential_expenses"], 1))
    monthly_free_cash_after = cash_flow_samples[-1]["cash_flow_without_event"]

    financial_score = round(clamp(50 + (monthly_free_cash_after / max(financials["essential_expenses"], 1)) * 50))
    stress_score = round(
        clamp(
            25
            + (decision["recurring"] / max(financials["monthly_income"], 1)) * 120
            + max(0, 1 - financials["buffer_ratio"]) * 25
            + profile.dependents * 4
            + max(0, decision["transition_months"] - 1) * 6
        )
    )
    risk_score = round(
        clamp(
            20
            + max(0, decision["upfront"]) / max(financials["current_savings"] + financials["essential_expenses"], 1) * 45
            + max(0, -monthly_free_cash_after) / max(financials["essential_expenses"], 1) * 55
            + {"low": 0, "medium": 6, "high": 12, "unknown": 6}[financials["flood_risk"]]
            + {"employed": 0, "self_employed": 6, "unemployed": 12, "retired": 4}.get(profile.employment, 0)
        )
    )
    resilience_score = round(clamp((base_months_of_runway / max(financials["target_months"], 1)) * 100))
    post_event_resilience = round(clamp((post_event_months_of_runway / max(financials["target_months"], 1)) * 100))

    baseline_goal_capacity = max(financials["free_cash_flow"], 0) * 12
    goal_progress_ratio = 1.0 if baseline_goal_capacity <= 0 else cumulative_goal_without / baseline_goal_capacity
    goal_delay = 0 if goal_progress_ratio >= 1 else ceil((1 - goal_progress_ratio) * 12)
    status = "stable" if post_event_months_of_runway >= max(3, financials["target_months"] * 0.6) else "warning" if post_event_months_of_runway >= 1 else "failure"

    return {
        "id": scenario_id,
        "label": SCENARIO_LABELS[scenario_id],
        "upfront_cost": round_money(max(decision["upfront"], 0)),
        "cash_received": round_money(max(-decision["upfront"], 0)),
        "monthly_cost": round_money(decision["recurring"]),
        "monthly_cash_flow_after": round_money(monthly_free_cash_after),
        "financial_impact": financial_score,
        "stress_level": stress_score,
        "risk_exposure": risk_score,
        "goal_delay_months": goal_delay,
        "goal_progress_score": round(clamp(goal_progress_ratio * 100)),
        "resilience_score": resilience_score,
        "post_event": {
            "event_label": event["label"],
            "remaining_savings": round_money(balance_with_event),
            "stress_level": round(clamp(stress_score + (100 - post_event_resilience) * 0.25)),
            "risk_exposure": round(clamp(risk_score + (100 - post_event_resilience) * 0.20)),
            "resilience_score": post_event_resilience,
            "remaining_runway_months": round(post_event_months_of_runway, 1),
            "status": status,
        },
        "timeline": timeline,
        "event_timeline": event_timeline,
        "assumptions": {
            "monthly_income": financials["monthly_income"],
            "essential_expenses": financials["essential_expenses"],
            "current_savings": financials["current_savings"],
            "transition_months": decision["transition_months"],
            "income_change_after_transition_pct": round(decision["post_raise"] * 100, 1),
            "model_summary": decision["summary"],
        },
        "cash_flow_samples": cash_flow_samples,
        "coach_nudge": build_coach_nudge(profile, decision_type, scenario_id, round_money(monthly_free_cash_after), goal_delay, post_event_months_of_runway),
    }


def build_life_simulation(payload: LifeDecisionRequest) -> dict:
    profile = payload.profile
    decision_copy = DECISION_COPY.get(payload.decision_type, DECISION_COPY["buy_car"])
    financials = get_profile_financials(profile)
    scenarios = [
        project_decision_path(profile, payload.decision_type, scenario_id, payload.event_type or "none")
        for scenario_id in ["safe", "balanced", "risky"]
    ]
    best = max(scenarios, key=lambda item: item["post_event"]["resilience_score"])
    worst = min(scenarios, key=lambda item: item["post_event"]["resilience_score"])

    comparison = [
        {
            "scenario": scenario["label"],
            "12M Buffer": round(clamp((scenario["timeline"][-1]["savings"] / max(financials["target_savings"], 1)) * 100)),
            "Goal Progress": scenario["goal_progress_score"],
            "Event Resilience": scenario["post_event"]["resilience_score"],
        }
        for scenario in scenarios
    ]

    methodology = {
        "monthly_income_formula": "Income is estimated from the selected income band.",
        "essential_expense_formula": "Essential expenses = monthly income x housing ratio + employment adjustment + dependent adjustment.",
        "starting_savings_formula": "Starting savings = essential expenses x reported savings months.",
        "scenario_formula": "Each scenario is projected month by month for 12 months using recurring cost, transition income, and event shocks.",
        "goal_delay_formula": "Goal delay comes from how much the decision reduces annual positive cash flow versus the user's current baseline.",
    }

    return {
        "title": decision_copy["label"],
        "headline": decision_copy["headline"],
        "event": get_event_model(payload.event_type or "none", financials)["label"],
        "ai_summary": (
            f"{decision_copy['label']} was calculated from your current income, essential expenses, and savings buffer. "
            f"{best['label']} leaves the strongest post-event runway at {best['post_event']['remaining_runway_months']} months, "
            f"while {worst['label']} is the weakest at {worst['post_event']['remaining_runway_months']} months."
        ),
        "coach_tip": decision_copy["coach_tip"],
        "goal_context": {
            "protected_goal": "Emergency runway and future savings capacity",
            "estimated_delay_pressure": worst["goal_delay_months"],
        },
        "profile_basis": financials,
        "scenarios": scenarios,
        "comparison_chart": comparison,
        "resilience_story": {
            "best_case": best["label"],
            "warning_case": worst["label"],
            "best_case_reason": f"It keeps about {best['post_event']['remaining_runway_months']} months of essential runway after the stress event.",
            "warning_case_reason": f"It falls to about {worst['post_event']['remaining_runway_months']} months of runway after the stress event.",
        },
        "methodology": methodology,
        "accessibility": {
            "voice_ready": True,
            "sms_ready": True,
            "whatsapp_ready": True,
            "underserved_focus": "Numbers are derived from user inputs and then explained in plain language.",
        },
    }


def detect_decision_type(message: str) -> Optional[str]:
    msg = message.lower()
    if "car" in msg or "vehicle" in msg:
        return "buy_car"
    if "move" in msg or "city" in msg or "relocat" in msg:
        return "move_city"
    if "loan" in msg or "debt" in msg or "borrow" in msg:
        return "take_loan"
    if "job" in msg or "career" in msg or "role" in msg:
        return "change_job"
    return None


def detect_event_type(message: str) -> str:
    msg = message.lower()
    if "job loss" in msg or "lose my job" in msg or "laid off" in msg:
        return "job_loss"
    if "medical" in msg or "hospital" in msg or "health emergency" in msg:
        return "medical_emergency"
    if "downturn" in msg or "recession" in msg or "economy" in msg:
        return "economic_downturn"
    return "none"


def respond_with_decision_analysis(message: str, profile: UserProfile) -> str:
    decision_type = detect_decision_type(message) or "buy_car"
    event_type = detect_event_type(message)
    simulation = build_life_simulation(LifeDecisionRequest(decision_type=decision_type, event_type=event_type, profile=profile))
    scenarios = simulation["scenarios"]
    best = max(scenarios, key=lambda item: item["post_event"]["resilience_score"])
    worst = min(scenarios, key=lambda item: item["post_event"]["resilience_score"])

    lines = [
        f"**{simulation['title']} analysis**",
        "",
        f"These numbers are based on your estimated monthly income of **${simulation['profile_basis']['monthly_income']:,}**, essential expenses of **${simulation['profile_basis']['essential_expenses']:,}**, and current savings of **${simulation['profile_basis']['current_savings']:,}**.",
        "",
        f"- **Best path:** {best['label']} leaves about **{best['post_event']['remaining_runway_months']} months** of runway after the stress test.",
        f"- **Weakest path:** {worst['label']} falls to about **{worst['post_event']['remaining_runway_months']} months** of runway after the stress test.",
        f"- **Most important rule:** avoid any option that makes monthly cash flow negative.",
        "",
        "Scenario breakdown:",
    ]

    for scenario in scenarios:
        lines.append(
            f"- **{scenario['label']}**: monthly cost ${scenario['monthly_cost']:,}, monthly cash flow after the decision ${scenario['monthly_cash_flow_after']:,}, goal delay {scenario['goal_delay_months']} month(s), post-event resilience {scenario['post_event']['resilience_score']}/100."
        )

    lines.extend(["", best["coach_nudge"]])
    return "\n".join(lines)


def respond_with_savings_analysis(profile: UserProfile) -> str:
    financials = get_profile_financials(profile)
    gap = max(0, financials["target_savings"] - financials["current_savings"])
    return (
        "**Emergency fund analysis**\n\n"
        f"Your essential monthly expenses are estimated at **${financials['essential_expenses']:,}** and your current savings are about **${financials['current_savings']:,}**.\n\n"
        f"- Target runway: **{financials['target_months']} months**\n"
        f"- Target savings: **${financials['target_savings']:,}**\n"
        f"- Remaining gap: **${gap:,}**\n\n"
        "The math is simple here: starting savings = essential expenses x reported savings months. "
        "Any new decision should be judged by whether it protects or reduces that runway."
    )


def respond_with_insurance_analysis(profile: UserProfile) -> str:
    financials = get_profile_financials(profile)
    protection = get_protection_gap_inputs(profile, financials)
    recs = get_insurance_recommendations(profile)
    rec_lines = [f"- **{item['name']}**: {item['description']}" for item in recs]
    return (
        "**Protection analysis**\n\n"
        f"Your protection score is **{protection['score']}/100**. It is calculated from housing risk, dependent needs, income risk, flood risk, and your current cash-flow flexibility.\n\n"
        "Highest-priority recommendations:\n"
        + "\n".join(rec_lines)
    )


def respond_with_stress_analysis(profile: UserProfile) -> str:
    financials = get_profile_financials(profile)
    pressure_ratio = financials["essential_expenses"] / max(financials["monthly_income"], 1)
    return (
        "**Money stress analysis**\n\n"
        f"About **{round(pressure_ratio * 100)}%** of your estimated monthly income is already going to essentials. "
        f"That leaves roughly **${financials['free_cash_flow']:,}** of monthly flexibility before any new decision.\n\n"
        "The practical rule is:\n"
        f"- keep monthly cash flow above $0\n"
        f"- keep at least {financials['target_months']} months of essential expenses protected\n"
        "- avoid decisions that only work when nothing goes wrong"
    )


def generate_chat_response(message: str, profile: Optional[UserProfile]) -> str:
    if profile is None:
        return (
            "**Life Impact AI Coach**\n\n"
            "I can answer questions more precisely once you complete the profile, because all scenario math is tied to income, essential expenses, dependents, housing, and savings runway.\n\n"
            "You can ask about:\n"
            "- buying a car\n"
            "- moving cities\n"
            "- taking a loan\n"
            "- changing jobs\n"
            "- emergency funds\n"
            "- insurance priorities"
        )

    msg = message.lower().strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if detect_decision_type(msg):
        return respond_with_decision_analysis(msg, profile)
    if any(term in msg for term in ["emergency", "savings", "runway", "buffer", "fund"]):
        return respond_with_savings_analysis(profile)
    if any(term in msg for term in ["insurance", "protect", "coverage", "policy", "protection"]):
        return respond_with_insurance_analysis(profile)
    if any(term in msg for term in ["stress", "anxiety", "worried", "overwhelmed", "pressure"]):
        return respond_with_stress_analysis(profile)

    decision_help = respond_with_decision_analysis("buy a car", profile)
    return (
        "**Life Impact AI Coach**\n\n"
        "I answer from your profile math rather than from canned random values. If your question is broad, I anchor the answer to your income, essential expenses, and savings runway.\n\n"
        "Here is an example of the kind of analysis I can do for you:\n\n"
        + decision_help
    )


@app.get("/")
def root():
    return {"message": "FinGuard AI API", "version": "3.0.0", "status": "running"}


@app.post("/api/analyze")
def analyze_profile(profile: UserProfile):
    scores = calculate_risk_scores(profile)
    action_plan = build_action_plan(profile, scores)
    insurance_recs = get_insurance_recommendations(profile)
    life_preview = build_life_simulation(
        LifeDecisionRequest(decision_type="buy_car", event_type="job_loss", profile=profile)
    )
    return {
        "scores": scores,
        "action_plan": action_plan,
        "insurance_recommendations": insurance_recs,
        "income_info": INCOME_BRACKETS.get(profile.income_range, {}),
        "life_impact_preview": life_preview,
    }


@app.post("/api/chat")
def chat(msg: ChatMessage):
    if not msg.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return {"response": generate_chat_response(msg.message, msg.profile), "source": "deterministic-engine"}


@app.post("/api/life-impact")
def life_impact(payload: LifeDecisionRequest):
    return build_life_simulation(payload)


@app.get("/api/flood-risk/{zip_code}")
def flood_risk(zip_code: str):
    risk = get_flood_risk(zip_code)
    tips = {
        "low": "Your area has relatively low flood risk. Basic coverage may be enough for many households.",
        "medium": "Moderate flood risk detected. Check policy exclusions and local hazard maps.",
        "high": "Higher flood risk detected. Standard home and renters insurance usually do not cover floods.",
    }
    return {"zip_code": zip_code, "risk_level": risk, "tip": tips.get(risk, "")}


@app.get("/api/insurance-products")
def list_insurance_products():
    return {"products": INSURANCE_PRODUCTS}
