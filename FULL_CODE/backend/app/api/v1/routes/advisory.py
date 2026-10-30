from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import SessionUser, current_user, rate_limit
from app.schemas.advisory import AdvisorBookingRequest, AvailabilityOut, BookingOut, MessageIn, MessageOut
from app.services import advisor_appointments, advisory

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.get("/availability", response_model=AvailabilityOut)
def availability(mode: Optional[str] = None) -> AvailabilityOut:
    return advisory.availability(mode)


@router.post("/bookings", response_model=BookingOut)
def book(req: AdvisorBookingRequest, user: SessionUser = Depends(current_user)) -> BookingOut:
    """The booking belongs to the signed-in user: the email comes from the session, not from the request."""
    try:
        return advisory.book(req, user.email)
    except advisory.SlotUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/bookings", response_model=List[BookingOut])
def my_bookings(user: SessionUser = Depends(current_user)) -> List[BookingOut]:
    return advisory.list_for(user.email)


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel(booking_id: str, user: SessionUser = Depends(current_user)) -> BookingOut:
    cancelled = advisory.cancel(booking_id, user.email)
    if cancelled is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return cancelled


@router.get("/bookings/{booking_id}/messages", response_model=List[MessageOut])
def messages(booking_id: str, after: int = Query(0, ge=0), user: SessionUser = Depends(current_user)) -> List[MessageOut]:
    found = advisor_appointments.customer_messages(booking_id, user.email, after)
    if found is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return found


@router.post("/bookings/{booking_id}/messages", response_model=MessageOut, dependencies=[Depends(rate_limit("chat", limit=30))])
def send_message(booking_id: str, req: MessageIn, user: SessionUser = Depends(current_user)) -> MessageOut:
    try:
        sent = advisor_appointments.customer_send(booking_id, user.email, req.text)
    except advisor_appointments.AppointmentConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if sent is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return sent
