from pydantic import BaseModel, Field, field_validator


def _clean_email(v: str) -> str:
    v = v.strip().lower()
    if "@" not in v or v.startswith("@") or v.endswith("@") or " " in v or len(v) > 120:
        raise ValueError("A valid email address is required")
    return v


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=1, max_length=128)

    _email = field_validator("email")(_clean_email)


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
