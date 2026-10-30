from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import SessionUser, current_user, rate_limit
from app.schemas.auth import DemoAdvisorOut, DemoAdvisorRequest, LoginRequest, RegisterRequest, SessionOut
from app.services import auth

router = APIRouter(prefix="/auth", tags=["auth"])
_limit = Depends(rate_limit("auth", limit=10))


def _run(fn, *args) -> SessionOut:
    try:
        return fn(*args)
    except auth.AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=SessionOut, dependencies=[_limit])
def login(req: LoginRequest) -> SessionOut:
    return _run(auth.login, req)


@router.post("/register", response_model=SessionOut, dependencies=[_limit])
def register(req: RegisterRequest) -> SessionOut:
    return _run(auth.register, req)


@router.post("/demo", response_model=SessionOut, dependencies=[_limit])
def demo() -> SessionOut:
    return _run(auth.demo_session)


@router.get("/options")
def options() -> dict:
    """What the sign-in page may offer. Demo buttons only show while the server allows demo sign-in."""
    return {"demo_login": settings.ENABLE_DEMO_LOGIN}


@router.get("/demo/advisors", response_model=List[DemoAdvisorOut])
def demo_advisors() -> List[DemoAdvisorOut]:
    return auth.demo_advisors()


@router.post("/demo/advisor", response_model=SessionOut, dependencies=[_limit])
def demo_advisor(req: DemoAdvisorRequest) -> SessionOut:
    return _run(auth.demo_advisor_session, req.advisor_id)


@router.post("/demo/admin", response_model=SessionOut, dependencies=[_limit])
def demo_admin() -> SessionOut:
    return _run(auth.demo_admin_session)


@router.get("/me", response_model=SessionUser)
def me(user: SessionUser = Depends(current_user)) -> SessionUser:
    return user
