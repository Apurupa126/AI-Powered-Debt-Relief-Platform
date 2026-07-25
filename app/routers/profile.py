from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import FinancialProfile, User
from app.schemas import ProfileUpdate, ChangePassword

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.get("/me")
def read_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.financial_profile
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "monthly_income": profile.monthly_income if profile else 0.0,
        "monthly_expenses": profile.monthly_expenses if profile else 0.0,
        "savings": profile.savings if profile else 0.0,
        "household_expenses": profile.household_expenses if profile else 0.0,
        "other_income": profile.other_income if profile else 0.0,
        "house_ownership": profile.house_ownership if profile else False,
        "vehicle_ownership": profile.vehicle_ownership if profile else False,
        "investments": profile.investments if profile else 0.0,
        "financial_goal": profile.financial_goal if profile else "",
    }


@router.put("/me")
def update_profile(
    update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.financial_profile
    if not profile:
        profile = FinancialProfile(user_id=current_user.id)
        db.add(profile)

    update_data = update.model_dump(exclude_unset=True)
    if update_data.get("name"):
        current_user.name = update_data.pop("name")
    if update_data.get("email"):
        current_user.email = update_data.pop("email")

    for key, value in update_data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    db.commit()
    return {"message": "Profile updated successfully"}


@router.put("/change-password")
def change_password(
    payload: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.old_password, current_user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect")
    current_user.password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
