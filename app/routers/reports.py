from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.models import Loan

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    if not loans:
        raise HTTPException(status_code=404, detail="No loans found")

    total_debt = sum(loan.amount for loan in loans)
    total_emi = sum(loan.emi for loan in loans)
    average_interest = sum(loan.interest for loan in loans) / len(loans)
    total_overdue = sum(loan.overdue for loan in loans)
    loan_distribution = {}
    interest_analysis = {}

    for loan in loans:
        loan_distribution[loan.loan_type or "Personal"] = loan_distribution.get(loan.loan_type or "Personal", 0) + loan.amount
        bucket = "High" if loan.interest >= 10 else "Medium" if loan.interest >= 6 else "Low"
        interest_analysis[bucket] = interest_analysis.get(bucket, 0) + 1

    distribution = [
        {"label": loan_type, "value": amount}
        for loan_type, amount in loan_distribution.items()
    ]
    interest_data = [
        {"label": bucket, "value": count}
        for bucket, count in interest_analysis.items()
    ]

    return {
        "total_loans": len(loans),
        "total_debt": round(total_debt, 2),
        "monthly_emi": round(total_emi, 2),
        "average_interest": round(average_interest, 2),
        "total_overdue": total_overdue,
        "loan_distribution": distribution,
        "interest_analysis": interest_data,
        "monthly_spending": [
            {"month": "Jan", "amount": 22000},
            {"month": "Feb", "amount": 24000},
            {"month": "Mar", "amount": 21000},
            {"month": "Apr", "amount": 25000},
            {"month": "May", "amount": 27000},
        ],
    }
