from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    monthly_income: Optional[float]
    monthly_expenses: Optional[float]
    savings: Optional[float]
    household_expenses: Optional[float]
    other_income: Optional[float]
    house_ownership: Optional[bool]
    vehicle_ownership: Optional[bool]
    investments: Optional[float]
    financial_goal: Optional[str]


class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class PayoffSimulation(BaseModel):
    monthly_extra_payment: float = Field(gt=0, description="Additional monthly payment toward debt")


class LoanBase(BaseModel):
    loan_name: str
    loan_type: Optional[str] = "Personal"
    lender: Optional[str] = ""
    amount: float
    interest: float
    emi: float
    duration_months: Optional[int] = None
    remaining_balance: Optional[float] = None
    due_date: Optional[str] = None
    overdue: Optional[int] = 0
    income: Optional[float] = 0.0
    expenses: Optional[float] = 0.0
    salary: Optional[float] = 0.0
    other_income: Optional[float] = 0.0
    household_expenses: Optional[float] = 0.0
    savings: Optional[float] = 0.0
    house_ownership: Optional[bool] = False
    vehicle_ownership: Optional[bool] = False
    investments: Optional[float] = 0.0
    financial_goal: Optional[str] = ""


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    loan_name: Optional[str]
    loan_type: Optional[str]
    lender: Optional[str]
    amount: Optional[float]
    interest: Optional[float]
    emi: Optional[float]
    duration_months: Optional[int]
    remaining_balance: Optional[float]
    due_date: Optional[str]
    overdue: Optional[int]
    income: Optional[float]
    expenses: Optional[float]
    salary: Optional[float]
    other_income: Optional[float]
    household_expenses: Optional[float]
    savings: Optional[float]
    house_ownership: Optional[bool]
    vehicle_ownership: Optional[bool]
    investments: Optional[float]
    financial_goal: Optional[str]


class LoanResponse(LoanBase):
    id: int

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_loans: int
    total_debt: float
    monthly_income: float
    monthly_expenses: float
    monthly_emi: float
    monthly_surplus: float
    emi_ratio: float
    debt_stress: str
    recommended_settlement: str


class ReportItem(BaseModel):
    label: str
    value: float
    color: str


class ReportSummary(BaseModel):
    total_loans: int
    total_debt: float
    average_interest: float
    monthly_emi: float
    loan_distribution: List[ReportItem]
    interest_analysis: List[ReportItem]
    expense_trends: List[ReportItem]


class AITextResponse(BaseModel):
    title: str
    body: str


class SimulationResponse(BaseModel):
    total_debt: float
    current_emi: float
    extra_payment: float
    estimated_months: float
    estimated_years: float


class HealthResponse(BaseModel):
    health_score: int
    status: str
    monthly_income: float
    monthly_expenses: float
    monthly_savings: float
    total_emi: float
    debt_to_income_ratio: float
    average_interest: float
    total_overdue: int
    recommendation: str


class DebtPlanRequest(BaseModel):
    loan_type: str
    amount: float
    monthly_income: Optional[float] = None
    monthly_payment: Optional[float] = None
    preferred_months: Optional[int] = None


class DebtPlanResponse(BaseModel):
    loan_type: str
    total_debt: float
    interest_rate: float
    estimated_monthly_payment: float
    estimated_months: float
    estimated_years: float
    summary: str
    plan: str
    recommendation: str