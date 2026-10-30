"""A signed-in customer's own profile and settings. Their pack profile is found from their ID, so nobody can ask for someone else's."""

from typing import Optional

from app.core.security import SessionUser
from app.pack.loader import get_pack
from app.pack.models import Profile
from app.schemas.me import MyAdvisor, MyProfile, Preferences, ProfileFacts
from app.services import advisory, assignments, auth
from app.services.storage import storage_service

SUFFIX = f"@{auth.INTERNAL_DOMAIN}"


def login_id(email: str) -> Optional[str]:
    return email[: -len(SUFFIX)].upper() if email.endswith(SUFFIX) else None


def profile_for(user: SessionUser) -> Optional[Profile]:
    lid = login_id(user.email)
    return get_pack().profiles.get(lid) if lid else None


def preferences(email: str) -> Preferences:
    return Preferences(**((storage_service.get_my_plan(email) or {}).get("settings") or {}))


def save_preferences(email: str, prefs: Preferences) -> Preferences:
    storage_service.save_my_plan(email, {"settings": prefs.model_dump()})
    return prefs


def me(user: SessionUser) -> MyProfile:
    profile = profile_for(user)
    facts = advisor = None
    if profile:
        facts = ProfileFacts(
            age=profile.age,
            gender=profile.gender,
            city=profile.city,
            occupation=profile.occupation,
            employment_type=profile.employment_type.replace("_", " "),
            marital_status=profile.marital_status,
            annual_income_inr=profile.annual_income_inr,
            dependents=(1 if profile.spouse else 0) + len(profile.children_ages) + len(profile.parent_ages),
            children=len(profile.children_ages),
            parents=len(profile.parent_ages),
            risk_appetite=profile.risk_appetite,
            smoker=profile.smoker_status == "smoker",
        )
        adv = get_pack().advisors.get(assignments.advisor_for(profile.profile_id) or "")
        if adv:
            advisor = MyAdvisor(
                advisor_id=adv.advisor_id,
                advisor_name=adv.advisor_name,
                bio=storage_service.get_advisor_settings(adv.advisor_id).get("bio", ""),
                languages=adv.languages,
                specialisations=adv.specialisations,
                consultation_modes=advisory.effective_modes(adv),
                years_experience=adv.years_experience,
                rating=adv.rating,
            )
    lid = login_id(user.email)
    return MyProfile(
        name=user.name or (profile.full_name if profile else ""),
        login_id=lid,
        email=None if lid else user.email,
        profile=facts,
        advisor=advisor,
        preferences=preferences(user.email),
        password_change_supported=auth.can_change_password(user.email),
    )
