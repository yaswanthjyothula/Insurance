"""Advisors and consultation slots from the pack, with bookings kept in the local store. Booking is simulated."""

import threading
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.pack.loader import get_pack
from app.pack.models import Slot
from app.schemas.advisory import AdvisorBookingRequest, AdvisorOut, AvailabilityOut, BookingOut, SlotOut
from app.services.booking_errors import SlotTakenError
from app.services.storage import storage_service

SLOT_FORMAT = "%Y-%m-%dT%H:%M:%S"
MAX_SLOTS_PER_ADVISOR = 36


SLOT_GONE = "That time was just taken by someone else. Please pick another."
_claim_lock = threading.Lock()


class SlotUnavailableError(Exception):
    """The slot is gone, in the past, or does not belong to that advisor."""


def _label(start: str) -> str:
    return datetime.strptime(start, SLOT_FORMAT).strftime("%a %d %b, %I:%M %p").replace(" 0", " ")


def reference_now() -> datetime:
    """Today, unless it falls outside the pack's two-week calendar; then the first day is used so a demo still has slots."""
    starts = [datetime.strptime(s.slot_start, SLOT_FORMAT) for s in get_pack().slots]
    now = datetime.now()
    return now if min(starts) <= now <= max(starts) else min(starts)


def _booked_slot_ids() -> set:
    return {b["slot_id"] for b in storage_service.list_bookings() if b.get("status") == "confirmed" and b.get("slot_id")}


def _open_slots(now: datetime) -> Dict[str, List[Slot]]:
    taken = _booked_slot_ids()
    out: Dict[str, List[Slot]] = {}
    for s in sorted(get_pack().slots, key=lambda x: x.slot_start):
        if s.status == "available" and s.slot_id not in taken and datetime.strptime(s.slot_start, SLOT_FORMAT) > now:
            out.setdefault(s.advisor_id, []).append(s)
    return out


def open_slots_for(advisor_id: str) -> List[SlotOut]:
    slots = _open_slots(reference_now()).get(advisor_id, [])[:MAX_SLOTS_PER_ADVISOR]
    return [SlotOut(slot_id=s.slot_id, start=s.slot_start, end=s.slot_end, label=_label(s.slot_start)) for s in slots]


def is_slot_open(advisor_id: str, slot_id: str) -> bool:
    return any(s.slot_id == slot_id for s in _open_slots(reference_now()).get(advisor_id, []))


def open_slot_count(advisor_id: str) -> int:
    return len(_open_slots(reference_now()).get(advisor_id, []))


def effective_modes(advisor, overrides: Optional[Dict[str, Dict]] = None) -> List[str]:
    """The consultation modes an advisor currently offers: their own choice, limited to what the pack qualifies them for."""
    chosen = (
        (overrides if overrides is not None else storage_service.list_advisor_settings())
        .get(advisor.advisor_id, {})
        .get("consultation_modes")
    )
    modes = [m for m in advisor.consultation_modes if not chosen or m in chosen]
    return modes or list(advisor.consultation_modes)


def availability(mode: Optional[str] = None) -> AvailabilityOut:
    now = reference_now()
    open_by_advisor = _open_slots(now)
    advisors = []
    overrides = storage_service.list_advisor_settings()
    for adv in get_pack().advisors.values():
        modes = effective_modes(adv, overrides)
        if mode and mode not in modes:
            continue
        slots = [
            SlotOut(slot_id=s.slot_id, start=s.slot_start, end=s.slot_end, label=_label(s.slot_start))
            for s in open_by_advisor.get(adv.advisor_id, [])[:MAX_SLOTS_PER_ADVISOR]
        ]
        advisors.append(
            AdvisorOut(
                **{**adv.model_dump(), "consultation_modes": modes},
                slots=slots,
                has_availability=bool(slots),
                bio=overrides.get(adv.advisor_id, {}).get("bio", ""),
            )
        )
    advisors.sort(key=lambda a: (not a.has_availability, -a.rating))
    note = (
        None
        if now <= datetime.now() + timedelta(seconds=1) and abs((now - datetime.now()).total_seconds()) < 1
        else "Showing the sample calendar from its first day, because today is outside the calendar's two weeks."
    )
    return AvailabilityOut(advisors=advisors, calendar_note=note)


def book(req: AdvisorBookingRequest, email: str) -> BookingOut:
    pack = get_pack()
    advisor = pack.advisors.get(req.advisor_id)
    slot = next((s for s in pack.slots if s.slot_id == req.slot_id and s.advisor_id == req.advisor_id), None)
    if advisor is None or slot is None:
        raise SlotUnavailableError("That advisor or time does not exist.")
    if req.consultation_mode not in effective_modes(advisor):
        raise SlotUnavailableError(f"{advisor.advisor_name} does not offer {req.consultation_mode} consultations.")
    if slot.status != "available" or datetime.strptime(slot.slot_start, SLOT_FORMAT) <= reference_now():
        raise SlotUnavailableError(SLOT_GONE)
    booking_id = str(uuid.uuid4())
    record = {
        "booking_id": booking_id,
        "advisor_id": advisor.advisor_id,
        "advisor_name": advisor.advisor_name,
        "slot_id": slot.slot_id,
        "slot_start": slot.slot_start,
        "slot_label": _label(slot.slot_start),
        "consultation_mode": req.consultation_mode,
        "meeting_link": f"https://meet.saffronlife.example/{booking_id[:8]}",
        "user_name": req.user_name,
        "user_email": email,
        "user_phone": req.user_phone,
        "notes": req.notes,
        "assessment_id": req.assessment_id,
        "share_summary": req.share_summary,
    }
    # Claiming the slot is one step: the check and the save cannot be split by another customer's request. Storage and the database
    # enforce the same rule, so it still holds if the app runs on more than one server.
    with _claim_lock:
        if slot.slot_id in _booked_slot_ids():
            raise SlotUnavailableError(SLOT_GONE)
        try:
            storage_service.save_booking(record)
        except SlotTakenError as exc:
            raise SlotUnavailableError(SLOT_GONE) from exc
    return _to_out(storage_service.get_booking(booking_id))


def booking_phase(b: Dict, starts_in_minutes: int) -> str:
    """upcoming, past (started, outcome not yet recorded), completed, no_show or cancelled. On the same demo clock as the slots."""
    if b.get("status") == "cancelled":
        return "cancelled"
    outcome = b.get("outcome")
    if outcome in ("completed", "no_show"):
        return outcome
    return "upcoming" if starts_in_minutes > 0 else "past"


def _to_out(b: Dict) -> BookingOut:
    """A stored booking as the customer sees it, with whether it is still ahead on the demo clock."""
    starts_in = int((datetime.strptime(b["slot_start"], SLOT_FORMAT) - reference_now()).total_seconds() // 60)
    slot = next((s for s in get_pack().slots if s.slot_id == b.get("slot_id")), None)
    fields = {k: b.get(k, "") for k in BookingOut.model_fields if k not in ("phase", "starts_in_minutes", "slot_end")}
    return BookingOut(**fields, slot_end=slot.slot_end if slot else "", phase=booking_phase(b, starts_in), starts_in_minutes=starts_in)


def list_for(email: Optional[str]) -> List[BookingOut]:
    return [_to_out(b) for b in storage_service.list_bookings(email)]


def cancel(booking_id: str, email: str) -> Optional[BookingOut]:
    cancelled = storage_service.cancel_booking(booking_id, email, by="customer")
    if cancelled is None:
        return None
    storage_service.add_message(booking_id, "system", "The customer cancelled this appointment.")
    return _to_out(cancelled)
