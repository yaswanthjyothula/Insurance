"""Lets the customer site report the one thing the server cannot see for itself: that someone started an assessment."""

from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.admin import analytics
from app.core.security import SessionUser, optional_user, rate_limit

router = APIRouter(prefix="/events", tags=["events"])


class EventIn(BaseModel):
    kind: Literal["assessment_started"]


@router.post("", status_code=204, dependencies=[Depends(rate_limit("events", limit=30))])
def report(event: EventIn, user: Optional[SessionUser] = Depends(optional_user)) -> None:
    analytics.track(event.kind, user.email if user else None)
