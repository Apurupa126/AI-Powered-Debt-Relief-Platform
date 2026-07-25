from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.database import get_db
from app.models import Loan
from app.schemas import DashboardStats
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/me", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        return {
            "total_loans": 0,
            "total_debt": 0.0,
            "monthly_income": 0.0,
            "monthly_expenses": 0.0,
            "monthly_emi": 0.0,
            "monthly_surplus": 0.0,
            "emi_ratio": 0.0,
            "debt_stress": "No Loans",
            "recommended_settlement": "Add loan accounts to receive personalized debt guidance.",
        }

    total_debt = sum(loan.amount for loan in loans)
    total_emi = sum(loan.emi for loan in loans)
    profile = current_user.financial_profile
    income = (profile.monthly_income if profile else None) or loans[0].income or 0
    expenses = (profile.monthly_expenses if profile else None) or loans[0].expenses or 0
    surplus = income - expenses - total_emi
    emi_ratio = round((total_emi / max(income, 1)) * 100, 2)
    if emi_ratio < 30:
        stress = "Low"
        settlement = "100% Normal Payment"
    elif emi_ratio < 50:
        stress = "Medium"
        settlement = "90% Settlement Recommended"
    else:
        stress = "High"
        settlement = "70% Settlement Recommended"
    return {
        "total_loans": len(loans),
        "total_debt": round(total_debt, 2),
        "monthly_income": round(income, 2),
        "monthly_expenses": round(expenses, 2),
        "monthly_emi": round(total_emi, 2),
        "monthly_surplus": round(surplus, 2),
        "emi_ratio": emi_ratio,
        "debt_stress": stress,
        "recommended_settlement": settlement,
    }
