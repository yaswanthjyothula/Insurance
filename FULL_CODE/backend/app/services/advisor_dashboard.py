"""The advisor's dashboard, built only from data the platform really holds: their assigned customers, the needs engine's results
and the bookings customers made with them. Anything not tracked yet is reported as such instead of being filled with numbers."""

from collections import Counter
from datetime import datetime, timedelta
from typing import List

from app.core.security import AdvisorUser
from app.pack.loader import get_pack
from app.schemas.advisor import (
    ActivityItem,
    AdvisorProfileOut,
    AppointmentItem,
    DashboardOut,
    DayLoad,
    GapBand,
    KpiOut,
)
from app.services import advisor_followups, advisory, assignments
from app.services.financial_engine import FinancialEngine
from app.services.profiles import to_assessment_input
from app.services.storage import storage_service

LOAD_DAYS = 14
GAP_BANDS = (
    ("covered", "Fully covered"),
    ("small", "Small gap"),
    ("moderate", "Moderate gap"),
    ("large", "Large gap"),
)


def profile_for(advisor_id: str) -> AdvisorProfileOut:
    adv = get_pack().advisors[advisor_id]
    return AdvisorProfileOut(**adv.model_dump(), assigned_customers=len(assignments.customers_for(advisor_id)))


def gap_band(net_gap: float, gross_need: float) -> str:
    """How much of the customer's total need is still uncovered after assets and existing cover."""
    if net_gap <= 0:
        return "covered"
    share = net_gap / gross_need if gross_need > 0 else 1.0
    return "small" if share <= 0.25 else "moderate" if share <= 0.6 else "large"


def _gap_summary(advisor_id: str):
    counts: Counter = Counter()
    total = 0.0
    for profile in assignments.customers_for(advisor_id):
        needs = FinancialEngine.calculate_needs(to_assessment_input(profile))
        counts[gap_band(needs.net_coverage_gap, needs.total_gross_need)] += 1
        total += max(0.0, needs.net_coverage_gap)
    return [GapBand(key=k, label=label, count=counts[k]) for k, label in GAP_BANDS], int(round(total))


def _bookings(advisor_id: str) -> List[dict]:
    return [b for b in storage_service.list_bookings() if b.get("advisor_id") == advisor_id]


def _parse(slot_start: str) -> datetime:
    return datetime.strptime(slot_start, advisory.SLOT_FORMAT)


def build(advisor: AdvisorUser) -> DashboardOut:
    now = advisory.reference_now()
    bookings = _bookings(advisor.advisor_id)
    confirmed = [b for b in bookings if b.get("status") == "confirmed"]
    upcoming = sorted((b for b in confirmed if _parse(b["slot_start"]) > now), key=lambda b: b["slot_start"])
    bands, total_gap = _gap_summary(advisor.advisor_id)
    profile = profile_for(advisor.advisor_id)

    per_day = Counter(b["slot_start"][:10] for b in upcoming)
    days = [now.date() + timedelta(days=i) for i in range(LOAD_DAYS)]
    load = [DayLoad(date=d.isoformat(), label=d.strftime("%a %d %b").replace(" 0", " "), count=per_day[d.isoformat()]) for d in days]

    activity = [
        ActivityItem(
            kind="booking",
            summary=(
                f"{b.get('user_name', 'A customer')} booked a {b.get('consultation_mode', '')} consultation for {b.get('slot_label', '')}"
                if b.get("status") == "confirmed"
                else f"{b.get('user_name', 'A customer')}'s consultation for {b.get('slot_label', '')} was cancelled"
            ),
            at=b.get("created_at", ""),
            status=b.get("status", ""),
        )
        for b in sorted(bookings, key=lambda b: b.get("created_at", ""), reverse=True)[:8]
    ]

    # Only the customer's name, the time and the mode leave the booking record: no email, phone or notes
    appointments = [
        AppointmentItem(
            booking_id=b["booking_id"],
            customer_name=b.get("user_name", "Customer"),
            slot_start=b["slot_start"],
            slot_label=b.get("slot_label", ""),
            consultation_mode=b.get("consultation_mode", ""),
        )
        for b in upcoming[:6]
    ]

    to_update = sum(1 for b in confirmed if advisory.booking_phase(b, int((_parse(b["slot_start"]) - now).total_seconds() // 60)) == "past")
    kpis = [
        KpiOut(key="customers", label="Assigned customers", value=profile.assigned_customers, note="Sample customers, shared for the demo"),
        KpiOut(key="appointments", label="Upcoming appointments", value=len(upcoming), note="Simulated bookings made by customers"),
        KpiOut(key="to_update", label="Sessions to update", value=to_update, note="Held, but not yet marked completed or missed"),
        KpiOut(
            key="follow_ups",
            label="Pending follow-ups",
            value=advisor_followups.open_count(advisor.advisor_id),
            note="Open tasks you set for yourself",
        ),
    ]
    return DashboardOut(
        advisor=profile,
        kpis=kpis,
        upcoming_appointments=appointments,
        recent_activity=activity,
        gap_distribution=bands,
        total_protection_gap_inr=total_gap,
        appointment_load=load,
        open_slots=advisory.open_slot_count(advisor.advisor_id),
        calendar_note=None if abs((now - datetime.now()).total_seconds()) < 5 else "Dates come from the sample calendar, not today.",
    )
