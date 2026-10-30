"""Session tokens and request guards. Tokens are signed with SECRET_KEY, so the server can trust the email inside without a database."""

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, Optional

from fastapi import Depends, Header, HTTPException, Request
from pydantic import BaseModel

from app.core.config import settings

log = logging.getLogger("lifesure.security")

# Without a configured key, tokens still work but only until the server restarts.
_SIGNING_KEY = (settings.SECRET_KEY or secrets.token_urlsafe(48)).encode()
if not settings.SECRET_KEY:
    log.warning("SECRET_KEY is not set: using a temporary key, so sign-ins end when the server restarts")


class SessionUser(BaseModel):
    email: str
    name: str
    role: str = "customer"  # "customer" | "advisor"; set only by the server when it issues the token
    advisor_id: Optional[str] = None


def _sign(payload: bytes) -> str:
    return base64.urlsafe_b64encode(hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest()).decode().rstrip("=")


def issue_token(email: str, name: str, role: str = "customer", advisor_id: Optional[str] = None) -> str:
    body = {"sub": email.strip().lower(), "name": name, "exp": int(time.time()) + settings.SESSION_TTL_HOURS * 3600}
    if role != "customer":
        body["role"], body["adv"] = role, advisor_id
    payload = base64.urlsafe_b64encode(json.dumps(body).encode()).decode().rstrip("=")
    return f"{payload}.{_sign(payload.encode())}"


def verify_token(token: str) -> Optional[SessionUser]:
    try:
        payload, signature = token.split(".", 1)
        if not hmac.compare_digest(signature, _sign(payload.encode())):
            return None
        body = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if body["exp"] < time.time():
            return None
        # Tokens issued before roles existed carry none: they are customer sessions
        return SessionUser(email=body["sub"], name=body.get("name", ""), role=body.get("role", "customer"), advisor_id=body.get("adv"))
    except (ValueError, KeyError, json.JSONDecodeError):
        return None


def current_user(authorization: Optional[str] = Header(None)) -> SessionUser:
    """The signed-in user, from 'Authorization: Bearer <token>'. Permissions are decided here on the server, not in the UI."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Please sign in.")
    user = verify_token(authorization[7:].strip())
    if user is None:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    return user


class AdminUser(SessionUser):
    pass


def current_admin(user: SessionUser = Depends(current_user)) -> AdminUser:
    """Admin-only routes. The role comes from the signed token, so it cannot be set from the browser."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="This area is for administrators only.")
    return AdminUser(**user.model_dump())


def optional_user(authorization: Optional[str] = Header(None)) -> Optional[SessionUser]:
    """Who is calling, when they are signed in. A missing or invalid token just means a guest."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return verify_token(authorization[7:].strip())


class AdvisorUser(SessionUser):
    advisor_id: str


def current_advisor(user: SessionUser = Depends(current_user)) -> AdvisorUser:
    """Advisor-only routes. The role comes from the signed token, so it cannot be set from the browser."""
    if user.role != "advisor" or not user.advisor_id:
        raise HTTPException(status_code=403, detail="This area is for advisors only.")
    return AdvisorUser(**user.model_dump())


_hits: Dict[str, Deque[float]] = defaultdict(deque)


def rate_limit(name: str, limit: int, window_seconds: int = 60) -> Callable[[Request], None]:
    """Allows at most `limit` calls per client per window for the route it guards (protects paid LLM calls and logins)."""

    def guard(request: Request) -> None:
        key = f"{name}:{request.client.host if request.client else 'unknown'}"
        now, hits = time.time(), _hits[key]
        while hits and hits[0] < now - window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment and try again.")
        hits.append(now)

    return guard
