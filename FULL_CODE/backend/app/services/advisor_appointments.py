"""An advisor's view of the consultations customers booked with them, and the chat on each.

Bookings and messages live in the same store the customer app writes to, so both sides always see the same appointment.
The consultation itself is simulated: no call or video is placed and nobody outside this app is notified.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.security import AdvisorUser
from app.pack.loader import get_pack
from app.schemas.advisor import AppointmentDetail, AppointmentSummary
from app.schemas.advisory import MessageOut, SlotOut
from app.services import advisory
from app.services.booking_errors import SlotTakenError
from app.services.storage import storage_service

SCOPES = {"upcoming", "past", "cancelled", "all"}
PREVIEW_CHARS = 80
OUTCOME_OPENS_MINUTES_BEFORE = 15  # the same moment the join link opens


class AppointmentNotFoundError(Exception):
    """No such appointment for this advisor. Also used for other advisors' bookings, so ids cannot be probed."""


class AppointmentConflictError(Exception):
    """The request is valid but the appointment's state or the chosen slot does not allow it. The message is safe to show."""


def _mine(advisor: AdvisorUser, booking_id: str) -> Dict[str, Any]:
    booking = storage_service.get_booking(booking_id)
    if booking is None or booking.get("advisor_id") != advisor.advisor_id:
        raise AppointmentNotFoundError(booking_id)
    return booking


def _slot_end(slot_id: str) -> str:
    slot = next((s for s in get_pack().slots if s.slot_id == slot_id), None)
    return slot.slot_end if slot else ""


def _starts_in(b: Dict[str, Any]) -> int:
    return int((datetime.strptime(b["slot_start"], advisory.SLOT_FORMAT) - advisory.reference_now()).total_seconds() // 60)


def _is_upcoming(b: Dict[str, Any]) -> bool:
    return advisory.booking_phase(b, _starts_in(b)) == "upcoming"


def can_record_outcome(b: Dict[str, Any]) -> bool:
    """A session can be marked once it is about to start or has started, and only if it was not cancelled."""
    return b.get("status") == "confirmed" and _starts_in(b) <= OUTCOME_OPENS_MINUTES_BEFORE


def _summary_fields(b: Dict[str, Any], threads: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    thread = threads.get(b["booking_id"])
    last = thread["last"] if thread else None
    starts_in = int((datetime.strptime(b["slot_start"], advisory.SLOT_FORMAT) - advisory.reference_now()).total_seconds() // 60)
    return {
        "phase": advisory.booking_phase(b, starts_in),
        "outcome": b.get("outcome"),
        "outcome_at": b.get("outcome_at"),
        "starts_in_minutes": starts_in,
        "booking_id": b["booking_id"],
        "customer_name": b.get("user_name", "Customer"),
        "slot_start": b["slot_start"],
        "slot_end": _slot_end(b.get("slot_id", "")),
        "slot_label": b.get("slot_label", ""),
        "consultation_mode": b.get("consultation_mode", ""),
        "status": b.get("status", ""),
        "cancelled_by": b.get("cancelled_by", ""),
        "message_count": thread["count"] if thread else 0,
        "last_message_preview": last["text"][:PREVIEW_CHARS] if last else None,
        "last_message_at": last["at"] if last else None,
    }


def list_for(advisor: AdvisorUser, scope: str) -> List[AppointmentSummary]:
    mine = [b for b in storage_service.list_bookings() if b.get("advisor_id") == advisor.advisor_id]
    threads = storage_service.message_summary([b["booking_id"] for b in mine])
    if scope == "upcoming":
        chosen = sorted((b for b in mine if _is_upcoming(b)), key=lambda b: b["slot_start"])
    elif scope == "past":
        # Started sessions, whether or not their outcome has been recorded: the ones still waiting come first
        past = [b for b in mine if advisory.booking_phase(b, _starts_in(b)) in ("past", "completed", "no_show")]
        chosen = sorted(past, key=lambda b: (b.get("outcome") is not None, b["slot_start"]), reverse=False)
        chosen = [b for b in chosen if b.get("outcome") is None] + sorted(
            (b for b in chosen if b.get("outcome")), key=lambda b: b["slot_start"], reverse=True
        )
    elif scope == "cancelled":
        chosen = sorted((b for b in mine if b.get("status") == "cancelled"), key=lambda b: b["slot_start"], reverse=True)
    else:
        chosen = sorted(mine, key=lambda b: b["slot_start"], reverse=True)
    return [AppointmentSummary(**_summary_fields(b, threads)) for b in chosen]


def detail(advisor: AdvisorUser, booking_id: str) -> AppointmentDetail:
    b = _mine(advisor, booking_id)
    mode = b.get("consultation_mode", "")
    return AppointmentDetail(
        **_summary_fields(b, storage_service.message_summary([booking_id])),
        # Contact details leave the record only where the consultation needs them
        customer_phone=b.get("user_phone") if mode == "phone" else None,
        meeting_link=b.get("meeting_link") if mode == "video" else None,
        customer_note=b.get("notes"),
        advisor_notes=b.get("advisor_notes", ""),
        outcome_note=b.get("outcome_note", ""),
        can_record_outcome=can_record_outcome(b),
        booked_at=b.get("created_at", ""),
        rescheduled=bool(b.get("rescheduled_from")),
    )


def save_notes(advisor: AdvisorUser, booking_id: str, notes: str) -> AppointmentDetail:
    _mine(advisor, booking_id)
    storage_service.update_booking(booking_id, {"advisor_notes": notes})
    return detail(advisor, booking_id)


def open_slots(advisor: AdvisorUser, booking_id: str) -> List[SlotOut]:
    _mine(advisor, booking_id)
    return advisory.open_slots_for(advisor.advisor_id)


def reschedule(advisor: AdvisorUser, booking_id: str, slot_id: str) -> AppointmentDetail:
    b = _mine(advisor, booking_id)
    if not _is_upcoming(b):
        raise AppointmentConflictError("Only an upcoming, confirmed appointment can be moved.")
    if not advisory.is_slot_open(advisor.advisor_id, slot_id):
        raise AppointmentConflictError("That time is no longer available. Please pick another.")
    slot = next(s for s in get_pack().slots if s.slot_id == slot_id)
    label = advisory._label(slot.slot_start)  # noqa: SLF001 - same label format the customer sees
    with advisory._claim_lock:  # noqa: SLF001 - the same lock customers' bookings take, so a move and a booking cannot both win a slot
        try:
            storage_service.update_booking(
                booking_id,
                {"slot_id": slot.slot_id, "slot_start": slot.slot_start, "slot_label": label, "rescheduled_from": b["slot_label"]},
            )
        except SlotTakenError as exc:
            raise AppointmentConflictError(advisory.SLOT_GONE) from exc
    storage_service.add_message(booking_id, "system", f"The advisor moved this appointment from {b['slot_label']} to {label}.")
    return detail(advisor, booking_id)


def record_outcome(advisor: AdvisorUser, booking_id: str, outcome: str, note: str) -> AppointmentDetail:
    """The advisor says how the session went: completed, or the customer did not turn up. It can be corrected later."""
    b = _mine(advisor, booking_id)
    if b.get("status") != "confirmed":
        raise AppointmentConflictError("A cancelled appointment has no outcome.")
    if not can_record_outcome(b):
        raise AppointmentConflictError("The outcome can be recorded once the session is about to start or has started.")
    changed = b.get("outcome") != outcome
    storage_service.update_booking(
        booking_id,
        {
            "outcome": outcome,
            "outcome_at": datetime.now().isoformat(timespec="seconds"),
            "outcome_note": note.strip(),
            "outcome_by": advisor.advisor_id,
        },
    )
    if changed:
        storage_service.add_message(
            booking_id,
            "system",
            "The advisor marked this session as completed." if outcome == "completed" else "The advisor marked this session as missed.",
        )
    return detail(advisor, booking_id)


def cancel(advisor: AdvisorUser, booking_id: str) -> AppointmentDetail:
    b = _mine(advisor, booking_id)
    if b.get("status") != "confirmed":
        raise AppointmentConflictError("This appointment is already cancelled.")
    storage_service.cancel_booking(booking_id, by="advisor")
    storage_service.add_message(booking_id, "system", "The advisor cancelled this appointment.")
    return detail(advisor, booking_id)


def messages(advisor: AdvisorUser, booking_id: str, after: int) -> List[MessageOut]:
    _mine(advisor, booking_id)
    return [MessageOut(**m) for m in storage_service.list_messages(booking_id, after)]


def send_message(advisor: AdvisorUser, booking_id: str, text: str) -> MessageOut:
    b = _mine(advisor, booking_id)
    if b.get("status") != "confirmed":
        raise AppointmentConflictError("This appointment is cancelled, so the chat is closed.")
    return MessageOut(**storage_service.add_message(booking_id, "advisor", text.strip()))


def customer_messages(booking_id: str, email: str, after: int) -> Optional[List[MessageOut]]:
    """The customer's side of the same chat. None when the booking is not theirs."""
    b = storage_service.get_booking(booking_id)
    if b is None or b.get("user_email", "").strip().lower() != email.strip().lower():
        return None
    return [MessageOut(**m) for m in storage_service.list_messages(booking_id, after)]


def customer_send(booking_id: str, email: str, text: str) -> Optional[MessageOut]:
    b = storage_service.get_booking(booking_id)
    if b is None or b.get("user_email", "").strip().lower() != email.strip().lower():
        return None
    if b.get("status") != "confirmed":
        raise AppointmentConflictError("This appointment is cancelled, so the chat is closed.")
    return MessageOut(**storage_service.add_message(booking_id, "customer", text.strip()))
