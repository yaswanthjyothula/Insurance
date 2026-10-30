"""An advisor's follow-up tasks: what to do next for a customer, when, and whether it is done."""

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from app.core.security import AdvisorUser
from app.schemas.advisor import FollowUpIn, FollowUpOut, FollowUpUpdate
from app.services import assignments
from app.services.storage import storage_service

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}
SCOPES = {"open", "overdue", "done", "all"}


class FollowUpNotFoundError(Exception):
    """No such follow-up for this advisor. Also used for other advisors' ones, so ids cannot be probed."""


class FollowUpInvalidError(Exception):
    """The follow-up points at a customer or appointment that is not the advisor's. The message is safe to show."""


def _today() -> date:
    return date.today()


def _out(record: Dict[str, Any]) -> FollowUpOut:
    due = date.fromisoformat(record["due_date"])
    days = (due - _today()).days
    profile = None
    if record.get("profile_id"):
        from app.pack.loader import get_pack

        found = get_pack().profiles.get(record["profile_id"])
        profile = found.full_name if found else None
    return FollowUpOut(
        follow_up_id=record["follow_up_id"],
        title=record["title"],
        note=record.get("note", ""),
        due_date=record["due_date"],
        priority=record["priority"],
        status=record["status"],
        profile_id=record.get("profile_id"),
        customer_name=profile,
        booking_id=record.get("booking_id"),
        created_at=record["created_at"],
        completed_at=record.get("completed_at"),
        overdue=record["status"] == "open" and days < 0,
        days_until_due=days,
    )


def _mine(advisor: AdvisorUser, follow_up_id: str) -> Dict[str, Any]:
    record = storage_service.get_follow_up(follow_up_id)
    if record is None or record.get("advisor_id") != advisor.advisor_id:
        raise FollowUpNotFoundError(follow_up_id)
    return record


def _check_links(advisor: AdvisorUser, profile_id: Optional[str], booking_id: Optional[str]) -> None:
    if profile_id and assignments.get_assigned(advisor.advisor_id, profile_id) is None:
        raise FollowUpInvalidError("That customer is not one of your customers.")
    if booking_id:
        booking = storage_service.get_booking(booking_id)
        if booking is None or booking.get("advisor_id") != advisor.advisor_id:
            raise FollowUpInvalidError("That appointment is not one of yours.")


def list_for(advisor: AdvisorUser, scope: str, profile_id: Optional[str] = None) -> List[FollowUpOut]:
    items = [_out(r) for r in storage_service.list_follow_ups(advisor.advisor_id)]
    if profile_id:
        items = [i for i in items if i.profile_id == profile_id]
    if scope == "open":
        items = [i for i in items if i.status == "open"]
    elif scope == "overdue":
        items = [i for i in items if i.overdue]
    elif scope == "done":
        items = [i for i in items if i.status == "done"]
    if scope == "done":
        return sorted(items, key=lambda i: i.completed_at or "", reverse=True)
    # Soonest due first; within a day, the most important
    return sorted(items, key=lambda i: (i.status == "done", i.due_date, PRIORITY_ORDER[i.priority], i.created_at))


def create(advisor: AdvisorUser, req: FollowUpIn) -> FollowUpOut:
    _check_links(advisor, req.profile_id, req.booking_id)
    record = {
        "follow_up_id": str(uuid.uuid4()),
        "advisor_id": advisor.advisor_id,
        "title": req.title.strip(),
        "note": req.note.strip(),
        "due_date": req.due_date.isoformat(),
        "priority": req.priority,
        "status": "open",
        "profile_id": req.profile_id,
        "booking_id": req.booking_id,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "completed_at": None,
    }
    return _out(storage_service.save_follow_up(record))


def update(advisor: AdvisorUser, follow_up_id: str, req: FollowUpUpdate) -> FollowUpOut:
    record = _mine(advisor, follow_up_id)
    changes = {k: v for k, v in req.model_dump(exclude_none=True).items()}
    if "due_date" in changes:
        changes["due_date"] = changes["due_date"].isoformat()
    for text in ("title", "note"):
        if text in changes:
            changes[text] = changes[text].strip()
    if changes.get("status") == "done" and record["status"] != "done":
        changes["completed_at"] = datetime.now().isoformat(timespec="seconds")
    elif changes.get("status") == "open":
        changes["completed_at"] = None
    return _out(storage_service.save_follow_up({**record, **changes}))


def delete(advisor: AdvisorUser, follow_up_id: str) -> None:
    _mine(advisor, follow_up_id)
    storage_service.delete_follow_up(follow_up_id)


def open_count(advisor_id: str) -> int:
    return sum(1 for r in storage_service.list_follow_ups(advisor_id) if r.get("status") == "open")
