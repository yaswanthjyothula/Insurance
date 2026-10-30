"""Advisor workspace. Every route here needs an advisor session, checked on the server."""

from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import AdvisorUser, current_advisor, rate_limit
from app.schemas.advisor import (
    AdvisorProfileDetail,
    AdvisorProfileOut,
    AdvisorSettingsIn,
    AdvisorSettingsOut,
    AppointmentDetail,
    AppointmentSummary,
    CustomerDetail,
    CustomerPage,
    DashboardOut,
    FollowUpIn,
    FollowUpOut,
    FollowUpUpdate,
    NotesIn,
    OutcomeIn,
    PasswordChangeIn,
    ProfileIn,
    RescheduleIn,
)
from app.schemas.advisory import MessageIn, MessageOut, SlotOut
from app.services import (
    advisor_appointments,
    advisor_customers,
    advisor_dashboard,
    advisor_followups,
    advisor_settings,
    assignments,
    audit,
    auth,
)

router = APIRouter(prefix="/advisor", tags=["advisor"])


@router.get("/me", response_model=AdvisorProfileOut)
def me(advisor: AdvisorUser = Depends(current_advisor)) -> AdvisorProfileOut:
    return advisor_dashboard.profile_for(advisor.advisor_id)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(advisor: AdvisorUser = Depends(current_advisor)) -> DashboardOut:
    audit.record(advisor.advisor_id, "dashboard.view")
    return advisor_dashboard.build(advisor)


@router.get("/customers", response_model=CustomerPage)
def customers(
    q: Optional[str] = Query(None, max_length=80),
    band: Optional[Literal["covered", "small", "moderate", "large"]] = None,
    risk: Optional[Literal["low", "medium", "high"]] = None,
    sort: Literal["name", "age", "income", "gap"] = "name",
    order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1, le=1000),
    page_size: int = Query(10, ge=1, le=50),
    advisor: AdvisorUser = Depends(current_advisor),
) -> CustomerPage:
    audit.record(advisor.advisor_id, "customers.list")
    return advisor_customers.list_customers(advisor, q, band, risk, sort, order == "desc", page, page_size)


@router.get("/customers/{customer_id}", response_model=CustomerDetail)
def customer(customer_id: str, advisor: AdvisorUser = Depends(current_advisor)) -> CustomerDetail:
    profile = assignments.get_assigned(advisor.advisor_id, customer_id)
    if profile is None:
        # Same answer whether the id does not exist or belongs to another advisor, so ids cannot be probed
        audit.record(advisor.advisor_id, "customer.view", target=customer_id[:40], outcome="denied")
        raise HTTPException(status_code=404, detail="Customer not found")
    audit.record(advisor.advisor_id, "customer.view", target=profile.profile_id)
    return advisor_customers.detail(advisor, profile)


# ---- Appointments and the chat on each ----

Scope = Literal["upcoming", "past", "cancelled", "all"]


def _run(advisor: AdvisorUser, action: str, booking_id: str, fn, *args):
    """Runs an appointment action, turning the service's errors into HTTP answers and leaving an audit entry."""
    try:
        result = fn(advisor, booking_id, *args)
    except advisor_appointments.AppointmentNotFoundError as exc:
        audit.record(advisor.advisor_id, action, target=booking_id[:40], outcome="denied")
        raise HTTPException(status_code=404, detail="Appointment not found") from exc
    except advisor_appointments.AppointmentConflictError as exc:
        audit.record(advisor.advisor_id, action, target=booking_id[:40], outcome="refused")
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    audit.record(advisor.advisor_id, action, target=booking_id[:40])
    return result


@router.get("/appointments", response_model=List[AppointmentSummary])
def appointments(scope: Scope = "upcoming", advisor: AdvisorUser = Depends(current_advisor)) -> List[AppointmentSummary]:
    return advisor_appointments.list_for(advisor, scope)


@router.get("/appointments/{booking_id}", response_model=AppointmentDetail)
def appointment(booking_id: str, advisor: AdvisorUser = Depends(current_advisor)) -> AppointmentDetail:
    return _run(advisor, "appointment.view", booking_id, advisor_appointments.detail)


@router.put("/appointments/{booking_id}/notes", response_model=AppointmentDetail)
def appointment_notes(booking_id: str, req: NotesIn, advisor: AdvisorUser = Depends(current_advisor)) -> AppointmentDetail:
    return _run(advisor, "appointment.notes", booking_id, advisor_appointments.save_notes, req.advisor_notes)


@router.post("/appointments/{booking_id}/outcome", response_model=AppointmentDetail)
def appointment_outcome(booking_id: str, req: OutcomeIn, advisor: AdvisorUser = Depends(current_advisor)) -> AppointmentDetail:
    return _run(advisor, f"appointment.{req.outcome}", booking_id, advisor_appointments.record_outcome, req.outcome, req.note)


@router.get("/appointments/{booking_id}/slots", response_model=List[SlotOut])
def appointment_slots(booking_id: str, advisor: AdvisorUser = Depends(current_advisor)) -> List[SlotOut]:
    return _run(advisor, "appointment.slots", booking_id, advisor_appointments.open_slots)


@router.post("/appointments/{booking_id}/reschedule", response_model=AppointmentDetail)
def appointment_reschedule(booking_id: str, req: RescheduleIn, advisor: AdvisorUser = Depends(current_advisor)) -> AppointmentDetail:
    return _run(advisor, "appointment.reschedule", booking_id, advisor_appointments.reschedule, req.slot_id)


@router.post("/appointments/{booking_id}/cancel", response_model=AppointmentDetail)
def appointment_cancel(booking_id: str, advisor: AdvisorUser = Depends(current_advisor)) -> AppointmentDetail:
    return _run(advisor, "appointment.cancel", booking_id, advisor_appointments.cancel)


@router.get("/appointments/{booking_id}/messages", response_model=List[MessageOut])
def appointment_messages(booking_id: str, after: int = Query(0, ge=0), advisor: AdvisorUser = Depends(current_advisor)) -> List[MessageOut]:
    return _run(advisor, "message.read", booking_id, advisor_appointments.messages, after)


@router.post("/appointments/{booking_id}/messages", response_model=MessageOut, dependencies=[Depends(rate_limit("chat", limit=30))])
def appointment_send(booking_id: str, req: MessageIn, advisor: AdvisorUser = Depends(current_advisor)) -> MessageOut:
    return _run(advisor, "message.send", booking_id, advisor_appointments.send_message, req.text)


# ---- Follow-ups ----

FollowUpScope = Literal["open", "overdue", "done", "all"]


def _followup(advisor: AdvisorUser, action: str, target: str, fn, *args):
    try:
        result = fn(advisor, *args)
    except advisor_followups.FollowUpNotFoundError as exc:
        audit.record(advisor.advisor_id, action, target=target[:40], outcome="denied")
        raise HTTPException(status_code=404, detail="Follow-up not found") from exc
    except advisor_followups.FollowUpInvalidError as exc:
        audit.record(advisor.advisor_id, action, target=target[:40], outcome="refused")
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    audit.record(advisor.advisor_id, action, target=target[:40])
    return result


@router.get("/follow-ups", response_model=List[FollowUpOut])
def follow_ups(
    scope: FollowUpScope = "open", customer_id: Optional[str] = Query(None, max_length=40), advisor: AdvisorUser = Depends(current_advisor)
) -> List[FollowUpOut]:
    return advisor_followups.list_for(advisor, scope, customer_id)


@router.post("/follow-ups", response_model=FollowUpOut, status_code=201)
def follow_up_create(req: FollowUpIn, advisor: AdvisorUser = Depends(current_advisor)) -> FollowUpOut:
    return _followup(advisor, "followup.create", req.profile_id or "-", advisor_followups.create, req)


@router.put("/follow-ups/{follow_up_id}", response_model=FollowUpOut)
def follow_up_update(follow_up_id: str, req: FollowUpUpdate, advisor: AdvisorUser = Depends(current_advisor)) -> FollowUpOut:
    return _followup(advisor, "followup.update", follow_up_id, advisor_followups.update, follow_up_id, req)


@router.delete("/follow-ups/{follow_up_id}", status_code=204)
def follow_up_delete(follow_up_id: str, advisor: AdvisorUser = Depends(current_advisor)) -> None:
    _followup(advisor, "followup.delete", follow_up_id, advisor_followups.delete, follow_up_id)


# ---- Profile and settings ----


@router.get("/profile", response_model=AdvisorProfileDetail)
def profile(advisor: AdvisorUser = Depends(current_advisor)) -> AdvisorProfileDetail:
    return advisor_settings.profile(advisor)


@router.put("/profile", response_model=AdvisorProfileDetail)
def profile_save(req: ProfileIn, advisor: AdvisorUser = Depends(current_advisor)) -> AdvisorProfileDetail:
    audit.record(advisor.advisor_id, "profile.update")
    return advisor_settings.save_bio(advisor, req.bio)


@router.get("/settings", response_model=AdvisorSettingsOut)
def settings_get(advisor: AdvisorUser = Depends(current_advisor)) -> AdvisorSettingsOut:
    return advisor_settings.settings(advisor)


@router.put("/settings", response_model=AdvisorSettingsOut)
def settings_save(req: AdvisorSettingsIn, advisor: AdvisorUser = Depends(current_advisor)) -> AdvisorSettingsOut:
    try:
        result = advisor_settings.save_settings(advisor, req)
    except advisor_settings.SettingsInvalidError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    audit.record(advisor.advisor_id, "settings.update")
    return result


@router.post("/settings/password", status_code=204, dependencies=[Depends(rate_limit("password", limit=5))])
def password_change(req: PasswordChangeIn, advisor: AdvisorUser = Depends(current_advisor)) -> None:
    if not auth.can_change_password(advisor.email):
        raise HTTPException(status_code=400, detail="Demo accounts have no password to change.")
    try:
        auth.change_password(advisor.email, req.current_password, req.new_password)
    except auth.AuthError as exc:
        audit.record(advisor.advisor_id, "password.change", outcome="refused")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    audit.record(advisor.advisor_id, "password.change")
