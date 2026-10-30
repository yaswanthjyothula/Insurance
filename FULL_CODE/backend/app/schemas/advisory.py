from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Mode = Literal["video", "phone", "chat"]


class AdvisorBookingRequest(BaseModel):
    advisor_id: str = Field(..., max_length=32)
    slot_id: str = Field(..., max_length=32)
    user_name: str = Field(..., min_length=2, max_length=80)
    user_phone: str = Field(..., min_length=10, max_length=10, pattern=r"^[0-9]{10}$")
    consultation_mode: Mode = "video"
    notes: Optional[str] = Field(None, max_length=500)
    assessment_id: Optional[str] = Field(None, max_length=64)
    share_summary: bool = False


class SlotOut(BaseModel):
    slot_id: str
    start: str
    end: str
    label: str


class AdvisorOut(BaseModel):
    advisor_id: str
    advisor_name: str
    languages: List[str]
    specialisations: List[str]
    consultation_modes: List[str]
    years_experience: int
    rating: float
    review_count: int
    slots: List[SlotOut]
    has_availability: bool
    bio: str = ""


class AvailabilityOut(BaseModel):
    advisors: List[AdvisorOut]
    calendar_note: Optional[str] = None


class BookingOut(BaseModel):
    booking_id: str
    advisor_id: str
    advisor_name: str
    slot_id: str
    slot_start: str
    slot_label: str
    status: str
    consultation_mode: str
    meeting_link: str
    created_at: str
    cancelled_by: str = ""
    outcome: str = ""  # completed or no_show once the advisor has recorded how the session went
    slot_end: str = ""
    phase: str = "upcoming"  # upcoming | past | cancelled, on the demo clock the slots use
    starts_in_minutes: int = 0


class MessageIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: int
    sender_role: Literal["customer", "advisor", "system"]
    text: str
    at: str
