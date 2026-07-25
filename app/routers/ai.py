import math
import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Loan, AIReport
from app.schemas import DebtPlanRequest, DebtPlanResponse

try:
    from google import genai
except ImportError:
    genai = None

try:
    from langchain.llms import OpenAI
except ImportError:
    OpenAI = None

client = None
fallback_llm = None
if genai and settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
elif OpenAI is not None:
    fallback_llm = OpenAI(temperature=0.5)

router = APIRouter(
    prefix="/ai",
    tags=["AI Recommendation"],
)


def get_fallback_ai_response(prompt: str) -> str:
    normalized = prompt.lower()
    if "budget plan" in normalized:
        return (
            "Monthly budget guidance:\n"
            "- 50% needs: essential bills and debt payments\n"
            "- 30% wants: discretionary spending\n"
            "- 20% savings/debt repayment: build an emergency fund and pay down high-interest loans\n"
            "Try to reduce non-essential expenses, keep track of spending, and use extra savings to pay more than your EMI on the highest-interest debt."
        )
    if "settlement recommendation" in normalized:
        return (
            "Settlement strategy:\n"
            "- Review loans by interest rate and overdue status.\n"
            "- Negotiate with lenders for lower interest or a one-time settlement, starting with the highest-cost debt.\n"
            "- Prioritize payments on loans with the biggest impact on your monthly cash flow.\n"
            "- Keep a record of offers and avoid taking new debt until your situation improves."
        )
    return (
        "AI integration is not configured. Install google-genai and set GEMINI_API_KEY to receive proactive recommendations. "
        "In the meantime, use the platform's charts and suggested metrics to review your debt and follow a conservative repayment plan."
    )


def run_gemini(prompt: str, model: str = "models/gemini-3.5-flash") -> str:
    if client is not None:
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            return response.text
        except Exception:
            return get_fallback_ai_response(prompt)

    if fallback_llm is not None:
        try:
            return fallback_llm(prompt)
        except Exception:
            return get_fallback_ai_response(prompt)

    return get_fallback_ai_response(prompt)


def save_ai_report(db: Session, user_id: int, title: str, prompt: str, response: str):
    report = AIReport(user_id=user_id, title=title, prompt=prompt, response=response)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def build_summary(loans: list[Loan]) -> dict:
    data = [
        {
            "loan_name": loan.loan_name,
            "amount": loan.amount,
            "interest": loan.interest,
            "emi": loan.emi,
            "overdue": loan.overdue,
            "loan_type": loan.loan_type or "Personal",
        }
        for loan in loans
    ]
    df = pd.DataFrame(data)
    total_debt = float(df["amount"].sum())
    average_interest = float(df["interest"].mean()) if not df.empty else 0.0
    overdue_payments = int(df["overdue"].sum())
    distribution = (
        df.groupby("loan_type")["amount"].sum().reset_index().to_dict(orient="records")
        if not df.empty
        else []
    )
    return {
        "total_debt": round(total_debt, 2),
        "average_interest": round(average_interest, 2),
        "overdue_payments": overdue_payments,
        "distribution": distribution,
    }


def get_financial_inputs(user, loans):
    profile = user.financial_profile
    income = (profile.monthly_income if profile else None) or loans[0].income or 0
    expenses = (profile.monthly_expenses if profile else None) or loans[0].expenses or 0
    return income, expenses


def estimate_interest_rate(loan_type: str) -> float:
    text = loan_type.lower()
    if "home" in text or "mortgage" in text:
        return 0.08
    if "auto" in text or "car" in text or "vehicle" in text:
        return 0.09
    if "education" in text or "student" in text:
        return 0.07
    if "business" in text:
        return 0.13
    if "gold" in text:
        return 0.14
    if "personal" in text:
        return 0.12
    return 0.11


def calculate_payoff_months(amount: float, monthly_payment: float, annual_rate: float) -> float:
    if monthly_payment <= 0:
        raise ValueError("Monthly payment must be greater than zero")
    if annual_rate <= 0:
        return amount / monthly_payment
    monthly_rate = annual_rate / 12
    if monthly_payment <= amount * monthly_rate:
        monthly_payment = amount * monthly_rate * 1.1 + 1
    return math.log(monthly_payment / (monthly_payment - amount * monthly_rate), 1 + monthly_rate)


@router.post("/plan", response_model=DebtPlanResponse)
def debt_plan(payload: DebtPlanRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be a positive value")

    interest_rate = estimate_interest_rate(payload.loan_type)
    monthly_payment = payload.monthly_payment or 0
    if not monthly_payment:
        if payload.monthly_income and payload.monthly_income > 0:
            monthly_payment = max(payload.monthly_income * 0.25, payload.amount / 24)
        else:
            monthly_payment = payload.amount / 24

    if payload.preferred_months and payload.preferred_months > 0:
        monthly_payment = max(monthly_payment, payload.amount / payload.preferred_months)

    monthly_payment = round(monthly_payment, 2)
    try:
        months = calculate_payoff_months(payload.amount, monthly_payment, interest_rate)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    estimated_months = round(months, 1)
    estimated_years = round(months / 12, 1)
    summary = (
        f"To repay ₹{payload.amount:,.2f} of {payload.loan_type} debt at {interest_rate * 100:.1f}% annual interest, "
        f"pay approximately ₹{monthly_payment:,.2f} per month for about {estimated_months} months."
    )
    plan = (
        f"Debt payoff plan for {payload.loan_type} loan:\n"
        f"- Total debt: ₹{payload.amount:,.2f}\n"
        f"- Estimated annual interest: {interest_rate * 100:.1f}%\n"
        f"- Recommended monthly payment: ₹{monthly_payment:,.2f}\n"
        f"- Expected payoff term: {estimated_months} months ({estimated_years} years)\n\n"
        "Action steps:\n"
        "1. Commit to the monthly payment above and apply it consistently.\n"
        "2. Focus on reducing non-essential spending so you can maintain or increase payments.\n"
        "3. Refinance or negotiate interest rates if a lower rate is available.\n"
        "4. Use any bonus, tax refund, or extra cash to make additional payments.\n"
        "5. Review your progress each month and update the plan if income changes."
    )
    recommendation = (
        "Follow this schedule closely and revisit the payment amount if your income rises or if you receive better loan terms."
    )
    save_ai_report(db, current_user.id, f"Debt Payoff Plan - {payload.loan_type}", str(payload.model_dump()), plan)

    return {
        "loan_type": payload.loan_type,
        "total_debt": round(payload.amount, 2),
        "interest_rate": round(interest_rate * 100, 2),
        "estimated_monthly_payment": monthly_payment,
        "estimated_months": estimated_months,
        "estimated_years": estimated_years,
        "summary": summary,
        "plan": plan,
        "recommendation": recommendation,
    }


@router.get("/settlement")
def settlement(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "settlement": {
                "debt_ratio": 0.0,
                "risk": "No Data",
                "total_debt": 0.0,
                "recommendation": "Add loan accounts to receive settlement and negotiation suggestions.",
            }
        }

    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_debt = sum(loan.amount for loan in loans)
    debt_ratio = round(total_emi / max(income, 1) * 100, 2)
    settlement_level = "High" if debt_ratio > 50 else "Medium" if debt_ratio > 30 else "Low"

    prompt = f"""
You are a financial advisor. A borrower has the following profile:
- Total Debt: ₹{total_debt}
- Monthly Income: ₹{income}
- Monthly Expenses: ₹{expenses}
- Monthly EMI: ₹{total_emi}
- Debt Stress Level: {settlement_level}
- Debt Ratio: {debt_ratio}%

Provide a settlement recommendation, negotiation strategy, recovery tips, and a plan to reduce interest expense.
Answer clearly and with actionable steps.
"""
    body = run_gemini(prompt)
    save_ai_report(db, current_user.id, "Settlement Recommendation", prompt, body)
    return {
        "settlement": {
            "debt_ratio": debt_ratio,
            "risk": settlement_level,
            "total_debt": round(total_debt, 2),
            "recommendation": body,
        }
    }


@router.get("/negotiation")
def negotiation_strategy(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "strategy": "No negotiation strategy is available yet.",
            "debt_ratio": 0.0,
            "summary": "Please add loan details to generate a lender-specific negotiation letter.",
            "sample_letter": "Add loan and financial details to generate a professional negotiation letter and strategy.",
        }

    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_debt = sum(loan.amount for loan in loans)
    overdue = sum(loan.overdue for loan in loans)
    debt_ratio = round(total_emi / max(income, 1) * 100, 2)

    prompt = f"""
You are an expert negotiator specializing in debt settlement letters. A borrower needs a lender-specific negotiation strategy based on the following profile:
- Total Debt: ₹{total_debt}
- Monthly Income: ₹{income}
- Monthly Expenses: ₹{expenses}
- Monthly EMI: ₹{total_emi}
- Overdue Payments: {overdue}
- Debt-to-Income Ratio: {debt_ratio}%

Provide a clear, professional settlement negotiation plan and a sample letter structure the borrower can use to request more favorable terms, reduced interest, or a repayment schedule adjustment.
"""
    body = run_gemini(prompt)
    save_ai_report(db, current_user.id, "Negotiation Strategy", prompt, body)
    return {
        "strategy": body,
        "debt_ratio": debt_ratio,
        "summary": "Use this letter to request a settlement review and demonstrate your repayment capability.",
        "sample_letter": body,
    }


@router.get("/budget")
def budget(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "budget": {
                "monthly_income": 0.0,
                "monthly_expenses": 0.0,
                "monthly_emi": 0.0,
                "savings_available": 0.0,
                "plan": "Add loan and income details to receive a tailored monthly budget plan.",
            }
        }

    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_debt = sum(loan.amount for loan in loans)
    savings_available = max(0, income - expenses - total_emi)
    prompt = f"""
You are a certified financial planner.
Create a monthly budget plan for a borrower with:
- Income: ₹{income}
- Expenses: ₹{expenses}
- Monthly EMI: ₹{total_emi}
- Total Debt: ₹{total_debt}
- Estimated savings after EMI: ₹{savings_available}

Provide a 50/30/20 budget allocation, savings plan, debt repayment structure, and emergency fund recommendation.
"""
    body = run_gemini(prompt)
    save_ai_report(db, current_user.id, "Budget Plan", prompt, body)
    return {
        "budget": {
            "monthly_income": round(income, 2),
            "monthly_expenses": round(expenses, 2),
            "monthly_emi": round(total_emi, 2),
            "savings_available": round(savings_available, 2),
            "plan": body,
        }
    }


@router.get("/risk")
def risk(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "risk_score": 0,
            "risk_level": "NO DATA",
            "monthly_income": 0.0,
            "monthly_expenses": 0.0,
            "monthly_emi": 0.0,
            "overdue_payments": 0,
            "average_interest": 0.0,
            "reasons": ["Add loan accounts to calculate risk and repayment stress."],
            "suggestion": "Please add your loan details to generate a financial risk assessment.",
            "summary": "No loan records found. Add loans to receive a risk summary.",
        }

    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_overdue = sum(loan.overdue for loan in loans)
    avg_interest = np.mean([loan.interest for loan in loans]) if loans else 0.0
    debt_ratio = round(total_emi / max(income, 1) * 100, 2)
    risk_score = 0
    reasons = []
    if debt_ratio > 80:
        risk_score += 40
        reasons.append("Debt-to-income ratio is very high.")
    elif debt_ratio > 50:
        risk_score += 20
        reasons.append("Debt-to-income ratio is moderate.")
    if total_overdue >= 5:
        risk_score += 30
        reasons.append("Several overdue EMI payments.")
    elif total_overdue >= 2:
        risk_score += 15
        reasons.append("Some overdue EMI payments.")
    if avg_interest > 10:
        risk_score += 20
        reasons.append("Average loan interest rate is high.")
    if (income - expenses) < income * 0.1:
        risk_score += 10
        reasons.append("Monthly savings are very low.")
    if risk_score >= 70:
        level = "HIGH"
        suggestion = "Immediate debt restructuring and cost reduction are recommended."
    elif risk_score >= 40:
        level = "MEDIUM"
        suggestion = "Reduce expenses and create a repayment plan."
    else:
        level = "LOW"
        suggestion = "Your loan position is manageable but review it regularly."
    body = f"Your risk level is {level}. {suggestion}"
    return {
        "risk_score": int(min(risk_score, 100)),
        "risk_level": level,
        "monthly_income": round(income, 2),
        "monthly_expenses": round(expenses, 2),
        "monthly_emi": round(total_emi, 2),
        "overdue_payments": total_overdue,
        "average_interest": round(float(avg_interest), 2),
        "reasons": reasons,
        "suggestion": suggestion,
        "summary": body,
    }


@router.get("/emi")
def emi_optimizer(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "monthly_income": 0.0,
            "current_emi": 0.0,
            "recommended_emi": 0.0,
            "difference": 0.0,
            "status": "NO_DATA",
            "recommendation": "Add loan details to generate an EMI health recommendation.",
        }
    income, _ = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    recommended_emi = round(income * 0.30, 2)
    difference = round(total_emi - recommended_emi, 2)
    if total_emi > recommended_emi:
        status = "EMI_TOO_HIGH"
        recommendation = "Consider restructuring high-interest loans and extending tenures where possible."
    else:
        status = "HEALTHY_EMI"
        recommendation = "Your EMI is within a healthy range. Keep tracking your payments."
    return {
        "monthly_income": round(income, 2),
        "current_emi": round(total_emi, 2),
        "recommended_emi": recommended_emi,
        "difference": abs(difference),
        "status": status,
        "recommendation": recommendation,
    }


@router.get("/debt-free")
def debt_free_date(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "total_debt": 0.0,
            "monthly_payment": 0.0,
            "estimated_months": 0.0,
            "estimated_years": 0.0,
            "completion_date": "N/A",
            "status": "NO_DATA",
        }
    total_debt = sum(loan.amount for loan in loans)
    total_emi = sum(loan.emi for loan in loans)
    if total_emi <= 0:
        raise HTTPException(status_code=400, detail="Monthly EMI must be greater than zero")
    months = total_debt / total_emi
    finish_date = datetime.now() + relativedelta(months=int(np.ceil(months)))
    return {
        "total_debt": round(total_debt, 2),
        "monthly_payment": round(total_emi, 2),
        "estimated_months": round(months, 1),
        "estimated_years": round(months / 12, 1),
        "completion_date": finish_date.strftime("%B %Y"),
        "status": "ON_TRACK" if months <= 60 else "REVIEW_REQUIRED",
    }


@router.get("/eligibility")
def loan_eligibility(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "eligible": False,
            "recommendation": "Add loan details to receive an eligibility assessment.",
            "score": 0,
            "reason": "No loan records available.",
        }
    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_debt = sum(loan.amount for loan in loans)
    total_overdue = sum(loan.overdue for loan in loans)
    avg_interest = np.mean([loan.interest for loan in loans]) if loans else 0.0
    savings = max(0, income - expenses)
    debt_ratio = round(total_emi / max(income, 1) * 100, 2)
    score = 100
    reasons = []
    if debt_ratio > 80:
        score -= 40
        reasons.append("Debt ratio is extremely high.")
    elif debt_ratio > 50:
        score -= 20
        reasons.append("Debt ratio is above the recommended limit.")
    if total_overdue >= 5:
        score -= 30
        reasons.append("Too many overdue EMI payments.")
    elif total_overdue >= 2:
        score -= 15
        reasons.append("Some overdue EMI payments.")
    if savings < income * 0.20:
        score -= 20
        reasons.append("Monthly savings are too low.")
    if avg_interest > 10:
        score -= 10
        reasons.append("Average loan interest is high.")
    score = max(score, 0)
    if score >= 80:
        eligible = True
        status = "Excellent"
        recommended_amount = income * 20
        suggestion = "Eligible for a new loan with caution."
    elif score >= 60:
        eligible = True
        status = "Good"
        recommended_amount = income * 10
        suggestion = "Eligible, but borrow carefully."
    elif score >= 40:
        eligible = False
        status = "Average"
        recommended_amount = 0
        suggestion = "Improve financial health before taking another loan."
    else:
        eligible = False
        status = "Poor"
        recommended_amount = 0
        suggestion = "Not eligible for a new loan."
    return {
        "eligible": eligible,
        "eligibility_score": score,
        "credit_status": status,
        "recommended_loan_amount": round(recommended_amount, 2),
        "monthly_income": round(income, 2),
        "monthly_savings": round(savings, 2),
        "debt_ratio": debt_ratio,
        "total_debt": round(total_debt, 2),
        "reasons": reasons,
        "suggestion": suggestion,
    }


@router.get("/cibil")
def estimate_cibil(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=404, detail="No loans found")
    income, expenses = get_financial_inputs(current_user, loans)
    total_emi = sum(loan.emi for loan in loans)
    total_overdue = sum(loan.overdue for loan in loans)
    avg_interest = np.mean([loan.interest for loan in loans]) if loans else 0.0
    debt_ratio = round(total_emi / max(income, 1) * 100, 2)
    savings = max(0, income - expenses)
    cibil = 900
    reasons = []
    if debt_ratio > 80:
        cibil -= 180
        reasons.append("Very high debt-to-income ratio")
    elif debt_ratio > 50:
        cibil -= 90
        reasons.append("Moderate debt-to-income ratio")
    if total_overdue >= 5:
        cibil -= 150
        reasons.append("Many overdue EMI payments")
    elif total_overdue >= 2:
        cibil -= 70
        reasons.append("Some overdue EMI payments")
    if avg_interest > 10:
        cibil -= 50
        reasons.append("High average interest rate")
    if savings < income * 0.2:
        cibil -= 40
        reasons.append("Low monthly savings")
    cibil = max(300, min(900, cibil))
    if cibil >= 800:
        rating = "Excellent"
    elif cibil >= 750:
        rating = "Very Good"
    elif cibil >= 700:
        rating = "Good"
    elif cibil >= 650:
        rating = "Fair"
    elif cibil >= 550:
        rating = "Poor"
    else:
        rating = "Very Poor"
    return {
        "estimated_cibil_score": int(cibil),
        "rating": rating,
        "debt_ratio": debt_ratio,
        "monthly_income": round(income, 2),
        "monthly_savings": round(savings, 2),
        "overdue_payments": total_overdue,
        "average_interest": round(float(avg_interest), 2),
        "reasons": reasons,
    }


@router.get("/summary")
def ai_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=404, detail="No loans found")
    summary = build_summary(loans)
    return {
        "summary": summary,
        "insights": {
            "debt_heat": "High" if summary["total_debt"] > 500000 else "Manageable",
            "interest_trend": "Review loans with interest above 10%.",
            "priority": "Use the AI settlement feature to reduce high-cost debt.",
        },
    }
