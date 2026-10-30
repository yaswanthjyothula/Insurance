"""The signed-in customer's own profile and settings."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import SessionUser, current_user, rate_limit
from app.schemas.me import MyProfile, PasswordChange, Preferences
from app.services import auth, customer_account

router = APIRouter(prefix="/me", tags=["my account"])


@router.get("/profile", response_model=MyProfile)
def profile(user: SessionUser = Depends(current_user)) -> MyProfile:
    return customer_account.me(user)


@router.put("/preferences", response_model=Preferences)
def save_preferences(prefs: Preferences, user: SessionUser = Depends(current_user)) -> Preferences:
    return customer_account.save_preferences(user.email, prefs)


@router.post("/password", status_code=204, dependencies=[Depends(rate_limit("password", limit=5))])
def change_password(req: PasswordChange, user: SessionUser = Depends(current_user)) -> None:
    if not auth.can_change_password(user.email):
        raise HTTPException(status_code=400, detail="This account has no password to change.")
    try:
        auth.change_password(user.email, req.current_password, req.new_password)
    except auth.AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
