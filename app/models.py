from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Boolean,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="owner", cascade="all, delete-orphan")
    financial_profile = relationship("FinancialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ai_reports = relationship("AIReport", back_populates="user", cascade="all, delete-orphan")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_name = Column(String(120), nullable=False)
    loan_type = Column(String(80), nullable=True)
    lender = Column(String(120), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    interest = Column(Float, nullable=False, default=0.0)
    emi = Column(Float, nullable=False, default=0.0)
    duration_months = Column(Integer, nullable=True)
    remaining_balance = Column(Float, nullable=True, default=0.0)
    due_date = Column(String(32), nullable=True)
    overdue = Column(Integer, nullable=False, default=0)
    income = Column(Float, nullable=True, default=0.0)
    expenses = Column(Float, nullable=True, default=0.0)
    salary = Column(Float, nullable=True, default=0.0)
    other_income = Column(Float, nullable=True, default=0.0)
    household_expenses = Column(Float, nullable=True, default=0.0)
    savings = Column(Float, nullable=True, default=0.0)
    house_ownership = Column(Boolean, nullable=True, default=False)
    vehicle_ownership = Column(Boolean, nullable=True, default=False)
    investments = Column(Float, nullable=True, default=0.0)
    financial_goal = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="loans")


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    monthly_income = Column(Float, default=0.0)
    monthly_expenses = Column(Float, default=0.0)
    savings = Column(Float, default=0.0)
    household_expenses = Column(Float, default=0.0)
    other_income = Column(Float, default=0.0)
    house_ownership = Column(Boolean, default=False)
    vehicle_ownership = Column(Boolean, default=False)
    investments = Column(Float, default=0.0)
    financial_goal = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="financial_profile")


class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(120), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ai_reports")