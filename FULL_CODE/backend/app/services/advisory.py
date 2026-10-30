"""Advisors and consultation slots from the pack, with bookings kept in the local store. Booking is simulated."""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.pack.loader import get_pack
from app.pack.models import Slot
from app.schemas.advisory import AdvisorBookingRequest, AdvisorOut, AvailabilityOut, BookingOut, SlotOut
from app.services.storage import storage_service

SLOT_FORMAT = "%Y-%m-%dT%H:%M:%S"
MAX_SLOTS_PER_ADVISOR = 36


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


def availability(mode: Optional[str] = None) -> AvailabilityOut:
    now = reference_now()
    open_by_advisor = _open_slots(now)
    advisors = []
    for adv in get_pack().advisors.values():
        if mode and mode not in adv.consultation_modes:
            continue
        slots = [
            SlotOut(slot_id=s.slot_id, start=s.slot_start, end=s.slot_end, label=_label(s.slot_start))
            for s in open_by_advisor.get(adv.advisor_id, [])[:MAX_SLOTS_PER_ADVISOR]
        ]
        advisors.append(AdvisorOut(**adv.model_dump(), slots=slots, has_availability=bool(slots)))
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
    if req.consultation_mode not in advisor.consultation_modes:
        raise SlotUnavailableError(f"{advisor.advisor_name} does not offer {req.consultation_mode} consultations.")
    if (
        slot.status != "available"
        or slot.slot_id in _booked_slot_ids()
        or datetime.strptime(slot.slot_start, SLOT_FORMAT) <= reference_now()
    ):
        raise SlotUnavailableError("That time is no longer available. Please pick another.")
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
    storage_service.save_booking(record)
    saved = storage_service.get_booking(booking_id)
    return BookingOut(**{k: saved[k] for k in BookingOut.model_fields})


def list_for(email: Optional[str]) -> List[BookingOut]:
    return [BookingOut(**{k: b.get(k, "") for k in BookingOut.model_fields}) for b in storage_service.list_bookings(email)]


def cancel(booking_id: str, email: str) -> Optional[BookingOut]:
    cancelled = storage_service.cancel_booking(booking_id, email)
    return BookingOut(**{k: cancelled.get(k, "") for k in BookingOut.model_fields}) if cancelled else None
