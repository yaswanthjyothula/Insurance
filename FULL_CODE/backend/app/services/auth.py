"""Sign-in. Uses Supabase Auth from the server when it is configured, else a small local account store (salted PBKDF2).

Keys never reach the browser: the frontend only ever sees our own signed session token.
"""

import hashlib
import hmac
import logging
import re
import secrets
from typing import Optional, Tuple

import httpx

from app.core.config import settings
from app.core.security import issue_token
from app.pack.loader import get_pack
from app.schemas.auth import DemoAdvisorOut, LoginRequest, RegisterRequest, SessionOut
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


INTERNAL_DOMAIN = "users.lifesure.app"
LOGIN_ID = re.compile(r"^(cus|adv|adm)-[a-z0-9]{3,20}$")


def login_email(identifier: str) -> str:
    """The address an ID is stored under in Supabase Auth. People type the ID, never this address."""
    return f"{identifier}@{INTERNAL_DOMAIN}" if LOGIN_ID.match(identifier) else identifier


def _advisor_emails() -> set:
    return {a.email for a in get_pack().advisors.values() if a.email}


def register(req: RegisterRequest) -> SessionOut:
    # The public form only ever makes customers. An advisor's address can never be claimed here, or anyone could sign up as them.
    if req.email in _advisor_emails() or req.email.endswith(f"@{INTERNAL_DOMAIN}"):
        raise AuthError("An account with this email already exists.")
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
        email = login_email(req.email)
        status, data = _supabase("token?grant_type=password", {"email": email, "password": req.password})
        if status >= 400:
            raise AuthError("Incorrect ID, email or password.")
        user = data.get("user", {})
        name = (user.get("user_metadata") or {}).get("full_name") or req.email.split("@")[0]
        # The role comes from app_metadata, which only the service key can write; user_metadata is editable by the user themselves
        meta = user.get("app_metadata") or {}
        if meta.get("role") == "admin":
            return SessionOut(token=issue_token(email, name, role="admin"), email=email, name=name, role="admin")
        advisor_id = meta.get("advisor_id")
        if meta.get("role") == "advisor" and advisor_id in get_pack().advisors:
            return SessionOut(
                token=issue_token(email, name, role="advisor", advisor_id=advisor_id),
                email=email,
                name=name,
                role="advisor",
                advisor_id=advisor_id,
            )
        return SessionOut(token=issue_token(email, name), email=email, name=name)
    user: Optional[dict] = storage_service.get_user(req.email)
    expected = _hash(req.password, bytes.fromhex(user["salt"])) if user else _hash(req.password, b"\0" * 16)
    if user is None or not hmac.compare_digest(expected, user["hash"]):
        raise AuthError("Incorrect email or password.")
    if user.get("role") == "advisor" and user.get("advisor_id") in get_pack().advisors:
        return SessionOut(
            token=issue_token(req.email, user["name"], role="advisor", advisor_id=user["advisor_id"]),
            email=req.email,
            name=user["name"],
            role="advisor",
            advisor_id=user["advisor_id"],
        )
    return SessionOut(token=issue_token(req.email, user["name"]), email=req.email, name=user["name"])


def demo_session() -> SessionOut:
    """A passwordless sign-in for the synthetic demo customer. Turn off with ENABLE_DEMO_LOGIN=false."""
    if not settings.ENABLE_DEMO_LOGIN:
        raise AuthError("Demo sign-in is turned off.")
    return SessionOut(token=issue_token(DEMO_EMAIL, DEMO_NAME), email=DEMO_EMAIL, name=DEMO_NAME, demo=True)


def demo_advisors() -> list:
    """Advisors a reviewer can sign in as. Empty when demo sign-in is off."""
    if not settings.ENABLE_DEMO_LOGIN:
        return []
    ordered = sorted(get_pack().advisors.values(), key=lambda a: a.advisor_id)
    return [DemoAdvisorOut(advisor_id=a.advisor_id, advisor_name=a.advisor_name) for a in ordered]


def demo_advisor_session(advisor_id: Optional[str] = None) -> SessionOut:
    """A passwordless sign-in as one of the pack's sample advisors. Turn off with ENABLE_DEMO_LOGIN=false."""
    if not settings.ENABLE_DEMO_LOGIN:
        raise AuthError("Demo sign-in is turned off.")
    advisors = get_pack().advisors
    advisor = advisors.get(advisor_id) if advisor_id else next(iter(sorted(advisors.values(), key=lambda a: a.advisor_id)), None)
    if advisor is None:
        raise AuthError("That advisor does not exist.")
    email = advisor.email or f"{advisor.advisor_id.lower()}@saffronlife.example"
    return SessionOut(
        token=issue_token(email, advisor.advisor_name, role="advisor", advisor_id=advisor.advisor_id),
        email=email,
        name=advisor.advisor_name,
        demo=True,
        role="advisor",
        advisor_id=advisor.advisor_id,
    )


def provision_advisor(advisor_id: str, password: str) -> None:
    """Gives a pack advisor a password login. Run by an administrator on the server (see provision_advisor.py), never from the web."""
    advisor = get_pack().advisors.get(advisor_id)
    if advisor is None or not advisor.email:
        raise AuthError("Unknown advisor, or the advisor has no email on file.")
    if len(password) < 12:
        raise AuthError("Advisor passwords must be at least 12 characters.")
    salt = secrets.token_bytes(16)
    storage_service.save_user(
        advisor.email,
        {"name": advisor.advisor_name, "salt": salt.hex(), "hash": _hash(password, salt), "role": "advisor", "advisor_id": advisor_id},
    )


def can_change_password(email: str) -> bool:
    """Demo sessions have no password. Real accounts live in Supabase Auth, or in the local account store."""
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        return True
    return storage_service.get_user(email) is not None


def change_password(email: str, current: str, new: str) -> None:
    """Checks the current password, then sets the new one. The same email cannot be used to guess the current password at speed:
    the route is rate-limited."""
    if new == current:
        raise AuthError("Choose a password different from your current one.")
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        status, data = _supabase("token?grant_type=password", {"email": email, "password": current})
        if status >= 400:
            raise AuthError("Your current password is not correct.")
        uid = (data.get("user") or {}).get("id")
        try:
            resp = httpx.put(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users/{uid}",
                json={"password": new},
                headers={"apikey": settings.SUPABASE_KEY, "Authorization": f"Bearer {settings.SUPABASE_KEY}"},
                timeout=TIMEOUT,
            )
        except httpx.HTTPError as exc:
            raise AuthError("We couldn't change your password right now. Please try again.") from exc
        if resp.status_code >= 400:
            raise AuthError(resp.json().get("msg") or "That password was not accepted. Try a longer or less common one.")
        return
    user = storage_service.get_user(email)
    if not user:
        raise AuthError("This account has no password to change.")
    if not hmac.compare_digest(_hash(current, bytes.fromhex(user["salt"])), user["hash"]):
        raise AuthError("Your current password is not correct.")
    salt = secrets.token_bytes(16)
    storage_service.save_user(email, {**user, "salt": salt.hex(), "hash": _hash(new, salt)})


def demo_admin_session() -> SessionOut:
    """A passwordless sign-in as the administrator, for local development. Turn off with ENABLE_DEMO_LOGIN=false."""
    if not settings.ENABLE_DEMO_LOGIN:
        raise AuthError("Demo sign-in is turned off.")
    email = f"adm-demo@{INTERNAL_DOMAIN}"
    return SessionOut(token=issue_token(email, "Demo Admin", role="admin"), email=email, name="Demo Admin", demo=True, role="admin")
