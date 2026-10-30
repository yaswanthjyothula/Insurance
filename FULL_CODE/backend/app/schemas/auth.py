import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


def _clean_email(v: str) -> str:
    v = v.strip().lower()
    if "@" not in v or v.startswith("@") or v.endswith("@") or " " in v or len(v) > 120:
        raise ValueError("A valid email address is required")
    return v


LOGIN_ID = re.compile(r"^(cus|adv|adm)-[a-z0-9]{3,20}$")


def _clean_login(v: str) -> str:
    """Signs in with an email or with a customer/advisor ID such as CUS-06ISGGSQ."""
    v = v.strip().lower()
    return v if LOGIN_ID.match(v) else _clean_email(v)


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=120, description="An email address, or a customer or advisor ID")
    password: str = Field(..., min_length=1, max_length=128)

    _email = field_validator("email")(_clean_login)


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=8, max_length=128)

    _email = field_validator("email")(_clean_email)


class SessionOut(BaseModel):
    token: str
    email: str
    name: str
    demo: bool = False
    role: str = "customer"
    advisor_id: Optional[str] = None


class DemoAdvisorRequest(BaseModel):
    advisor_id: Optional[str] = Field(None, max_length=32)


class DemoAdvisorOut(BaseModel):
    advisor_id: str
    advisor_name: str
