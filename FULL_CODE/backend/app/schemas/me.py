from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")
    language: str = Field("", max_length=30)
    preferred_mode: Optional[Literal["video", "phone", "chat"]] = None
    share_summary_default: bool = False


class ProfileFacts(BaseModel):
    age: int
    gender: str
    city: str
    occupation: str
    employment_type: str
    marital_status: str
    annual_income_inr: int
    dependents: int
    children: int
    parents: int
    risk_appetite: str
    smoker: bool


class MyAdvisor(BaseModel):
    advisor_id: str
    advisor_name: str
    bio: str = ""
    languages: List[str]
    specialisations: List[str]
    consultation_modes: List[str]
    years_experience: int
    rating: float


class MyProfile(BaseModel):
    name: str
    login_id: Optional[str] = None  # the CUS- ID, for accounts made from the pack
    email: Optional[str] = None  # only a real email address, never the internal one
    profile: Optional[ProfileFacts] = None  # None for accounts that registered themselves
    advisor: Optional[MyAdvisor] = None
    preferences: Preferences
    password_change_supported: bool


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
