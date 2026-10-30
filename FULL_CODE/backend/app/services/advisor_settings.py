"""An advisor's profile (the bio customers read) and settings (what they offer, and defaults for their own tasks)."""

from typing import Dict

from app.core.security import AdvisorUser
from app.pack.loader import get_pack
from app.schemas.advisor import AdvisorProfileDetail, AdvisorSettingsIn, AdvisorSettingsOut
from app.services import advisor_dashboard, advisory, auth
from app.services.storage import storage_service

DEFAULT_FOLLOW_UP_DAYS = 3


class SettingsInvalidError(Exception):
    """A setting the advisor is not allowed to choose. The message is safe to show."""


def _stored(advisor_id: str) -> Dict:
    return storage_service.get_advisor_settings(advisor_id)


def profile(advisor: AdvisorUser) -> AdvisorProfileDetail:
    base = advisor_dashboard.profile_for(advisor.advisor_id)
    adv = get_pack().advisors[advisor.advisor_id]
    return AdvisorProfileDetail(
        **{**base.model_dump(), "consultation_modes": advisory.effective_modes(adv)},
        bio=_stored(advisor.advisor_id).get("bio", ""),
    )


def save_bio(advisor: AdvisorUser, bio: str) -> AdvisorProfileDetail:
    storage_service.save_advisor_settings(advisor.advisor_id, {**_stored(advisor.advisor_id), "bio": bio.strip()})
    return profile(advisor)


def settings(advisor: AdvisorUser) -> AdvisorSettingsOut:
    adv = get_pack().advisors[advisor.advisor_id]
    return AdvisorSettingsOut(
        follow_up_default_days=_stored(advisor.advisor_id).get("follow_up_default_days", DEFAULT_FOLLOW_UP_DAYS),
        consultation_modes=advisory.effective_modes(adv),
        available_modes=list(adv.consultation_modes),
        password_change_supported=auth.can_change_password(advisor.email),
    )


def save_settings(advisor: AdvisorUser, req: AdvisorSettingsIn) -> AdvisorSettingsOut:
    adv = get_pack().advisors[advisor.advisor_id]
    if not set(req.consultation_modes) <= set(adv.consultation_modes):
        raise SettingsInvalidError("You can only offer the consultation types you are approved for.")
    storage_service.save_advisor_settings(
        advisor.advisor_id,
        {
            **_stored(advisor.advisor_id),
            "follow_up_default_days": req.follow_up_default_days,
            "consultation_modes": sorted(set(req.consultation_modes)),
        },
    )
    return settings(advisor)
