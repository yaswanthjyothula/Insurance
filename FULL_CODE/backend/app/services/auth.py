"""Sign-in. Uses Supabase Auth from the server when it is configured, else a small local account store (salted PBKDF2).

Keys never reach the browser: the frontend only ever sees our own signed session token.
"""

import hashlib
import hmac
import logging
import secrets
from typing import Optional, Tuple

import httpx

from app.core.config import settings
from app.core.security import issue_token
from app.schemas.auth import LoginRequest, RegisterRequest, SessionOut
from app.services.storage import storage_service

log = logging.getLogger("lifesure.auth")
DEMO_EMAIL, DEMO_NAME = "demo.customer@saffronbank.example", "Demo Customer"
TIMEOUT = httpx.Timeout(10.0)


class AuthError(Exception):
    """A sign-in problem whose message is safe to show to the user."""


def _hash(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000).hex()


def _supabase(path: str, body: dict) -> Tuple[int, dict]:
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = httpx.post(f"{settings.SUPABASE_URL}/auth/v1/{path}", json=body, headers=headers, timeout=TIMEOUT)
    except httpx.HTTPError as exc:
        log.warning("Supabase unreachable: %s", type(exc).__name__)
        raise AuthError("Sign-in is temporarily unavailable. Please try again.") from exc
    try:
        return resp.status_code, resp.json()
    except ValueError:
        return resp.status_code, {}


def register(req: RegisterRequest) -> SessionOut:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        status, data = _supabase("signup", {"email": req.email, "password": req.password, "data": {"full_name": req.full_name}})
        if status >= 400:
            raise AuthError(data.get("msg") or data.get("error_description") or "Could not create the account.")
        if not data.get("access_token"):
            raise AuthError("Account created. Check your email to confirm it, then sign in.")
        return SessionOut(token=issue_token(req.email, req.full_name), email=req.email, name=req.full_name)
    if storage_service.get_user(req.email):
        raise AuthError("An account with this email already exists.")
    salt = secrets.token_bytes(16)
    storage_service.save_user(req.email, {"name": req.full_name, "salt": salt.hex(), "hash": _hash(req.password, salt)})
    return SessionOut(token=issue_token(req.email, req.full_name), email=req.email, name=req.full_name)


def login(req: LoginRequest) -> SessionOut:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        status, data = _supabase("token?grant_type=password", {"email": req.email, "password": req.password})
        if status >= 400:
            raise AuthError("Incorrect email or password.")
        name = (data.get("user", {}).get("user_metadata") or {}).get("full_name") or req.email.split("@")[0]
        return SessionOut(token=issue_token(req.email, name), email=req.email, name=name)
    user: Optional[dict] = storage_service.get_user(req.email)
    expected = _hash(req.password, bytes.fromhex(user["salt"])) if user else _hash(req.password, b"\0" * 16)
    if user is None or not hmac.compare_digest(expected, user["hash"]):
        raise AuthError("Incorrect email or password.")
    return SessionOut(token=issue_token(req.email, user["name"]), email=req.email, name=user["name"])


def demo_session() -> SessionOut:
    """A passwordless sign-in for the synthetic demo customer. Turn off with ENABLE_DEMO_LOGIN=false."""
    if not settings.ENABLE_DEMO_LOGIN:
        raise AuthError("Demo sign-in is turned off.")
    return SessionOut(token=issue_token(DEMO_EMAIL, DEMO_NAME), email=DEMO_EMAIL, name=DEMO_NAME, demo=True)
