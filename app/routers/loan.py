from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.auth import get_current_user
from app.database import get_db
from app.models import Loan
from app.schemas import LoanCreate, LoanUpdate, PayoffSimulation, SimulationResponse

router = APIRouter(
    prefix="/loan",
    tags=["Loan Management"]
)


@router.post("/add")
def add_loan(loan: LoanCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    payload = loan.model_dump()
    payload["user_id"] = current_user.id
    new_loan = Loan(**payload)
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return {
        "message": "Loan Added Successfully",
        "loan": jsonable_encoder(new_loan),
    }


@router.get("/")
def get_all_loans(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by loan name or lender"),
    loan_type: Optional[str] = Query(None, description="Filter by loan type"),
    overdue: Optional[int] = Query(None, ge=0, description="Filter loans with overdue months"),
    sort_by: str = Query("created_at", pattern="^(id|amount|emi|interest|created_at)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = db.query(Loan).filter(Loan.user_id == current_user.id)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            Loan.loan_name.ilike(search_term) | Loan.lender.ilike(search_term)
        )
    if loan_type:
        query = query.filter(Loan.loan_type == loan_type)
    if overdue is not None:
        query = query.filter(Loan.overdue >= overdue)

    order_column = getattr(Loan, sort_by, Loan.created_at)
    if order == "asc":
        query = query.order_by(asc(order_column))
    else:
        query = query.order_by(desc(order_column))

    total = query.count()
    loans = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "loans": jsonable_encoder(loans),
    }


@router.get("/{loan_id}")
def get_single_loan(loan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan Not Found")
    return jsonable_encoder(loan)


@router.put("/{loan_id}")
def update_loan(
    loan_id: int,
    updated: LoanUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan Not Found")

    data = {k: v for k, v in updated.model_dump().items() if v is not None}
    for key, value in data.items():
        setattr(loan, key, value)

    db.commit()
    db.refresh(loan)
    return {
        "message": "Loan Updated Successfully",
        "loan": jsonable_encoder(loan),
    }


@router.delete("/{loan_id}")
def delete_loan(loan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan Not Found")
    db.delete(loan)
    db.commit()
    return {"message": "Loan Deleted Successfully"}


@router.get("/priority")
def loan_priority(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Loans Found")

    ranked = []
    profile = current_user.financial_profile
    for loan in loans:
        income = loan.income or (profile.monthly_income if profile else None) or 1
        score = loan.interest * 5 + loan.overdue * 10 + (loan.emi / max(income, 1)) * 100
        ranked.append(
            {
                "loan_id": loan.id,
                "loan_name": loan.loan_name,
                "lender": loan.lender,
                "score": round(score, 2),
                "interest": loan.interest,
                "overdue": loan.overdue,
                "emi": loan.emi,
            }
        )
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked


@router.post("/simulate", response_model=SimulationResponse)
def simulate_payoff(simulation: PayoffSimulation, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Loans Found")
    total_debt = sum(loan.amount for loan in loans)
    total_emi = sum(loan.emi for loan in loans)
    monthly_payment = total_emi + simulation.monthly_extra_payment
    if monthly_payment <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly payment must be greater than zero")
    months = total_debt / monthly_payment
    return {
        "total_debt": round(total_debt, 2),
        "current_emi": round(total_emi, 2),
        "extra_payment": round(simulation.monthly_extra_payment, 2),
        "estimated_months": round(months, 1),
        "estimated_years": round(months / 12, 1),
    }


@router.get("/health")
def financial_health(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No loans found")
    total_emi = sum(loan.emi for loan in loans)
    profile = current_user.financial_profile
    income = (profile.monthly_income if profile else None) or loans[0].income or 1
    expenses = (profile.monthly_expenses if profile else None) or loans[0].expenses or 0
    savings = max(0, income - expenses)
    avg_interest = sum(loan.interest for loan in loans) / len(loans)
    total_overdue = sum(loan.overdue for loan in loans)
    score = 100
    emi_ratio = (total_emi / income) * 100
    if emi_ratio > 60:
        score -= 35
    elif emi_ratio > 40:
        score -= 20
    score -= total_overdue * 5
    if avg_interest > 12:
        score -= 15
    elif avg_interest > 9:
        score -= 8
    if savings < 10000:
        score -= 15
    elif savings < 20000:
        score -= 8
    score = max(0, round(score))
    if score >= 80:
        status_text = "Excellent"
    elif score >= 60:
        status_text = "Good"
    elif score >= 40:
        status_text = "Moderate"
    else:
        status_text = "Critical"
    recommendation = {
        "Excellent": "Maintain your current financial habits.",
        "Good": "Reduce debt gradually and increase savings.",
        "Moderate": "Avoid new loans and prioritize high-interest debt.",
        "Critical": "Immediate debt restructuring is recommended.",
    }
    return {
        "health_score": score,
        "status": status_text,
        "monthly_income": round(income, 2),
        "monthly_expenses": round(expenses, 2),
        "monthly_savings": round(savings, 2),
        "total_emi": round(total_emi, 2),
        "debt_to_income_ratio": round(emi_ratio, 2),
        "average_interest": round(avg_interest, 2),
        "total_overdue": total_overdue,
        "recommendation": recommendation[status_text],
    }
