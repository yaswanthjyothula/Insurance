from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.financial import AssessmentResult


class AdvisorProfileOut(BaseModel):
    advisor_id: str
    advisor_name: str
    languages: List[str]
    specialisations: List[str]
    consultation_modes: List[str]
    years_experience: int
    rating: float
    review_count: int
    assigned_customers: int


class KpiOut(BaseModel):
    key: str
    label: str
    value: Optional[int] = None  # None means the platform does not track this yet, so nothing is invented
    note: Optional[str] = None


class AppointmentItem(BaseModel):
    booking_id: str
    customer_name: str
    slot_start: str
    slot_label: str
    consultation_mode: str
    simulated: bool = True


class ActivityItem(BaseModel):
    kind: str
    summary: str
    at: str
    status: str


class GapBand(BaseModel):
    key: str
    label: str
    count: int


class DayLoad(BaseModel):
    date: str
    label: str
    count: int


class DashboardOut(BaseModel):
    advisor: AdvisorProfileOut
    kpis: List[KpiOut]
    upcoming_appointments: List[AppointmentItem]
    recent_activity: List[ActivityItem]
    gap_distribution: List[GapBand]
    total_protection_gap_inr: int
    appointment_load: List[DayLoad]
    open_slots: int
    calendar_note: Optional[str] = None


class CustomerSummary(BaseModel):
    profile_id: str
    full_name: str
    age: int
    city: str
    occupation: str
    annual_income_inr: int
    risk_appetite: str
    dependents: int
    gap_band: str
    net_coverage_gap_inr: int


class CustomerPage(BaseModel):
    items: List[CustomerSummary]
    total: int
    page: int
    page_size: int
    pages: int


class CustomerOverview(BaseModel):
    profile_id: str
    full_name: str
    age: int
    gender: str
    city: str
    occupation: str
    employment_type: str
    marital_status: str
    annual_income_inr: int
    dependents: int
    children: int
    parents: int
    spouse_working: Optional[bool] = None
    risk_appetite: str
    smoker: bool
    assigned_advisor_id: str
    assigned_advisor_name: str


class LiabilityOut(BaseModel):
    loan_type: str
    outstanding_inr: int
    emi_inr: Optional[int] = None
    remaining_months: Optional[int] = None


class GoalOut(BaseModel):
    goal_type: str
    beneficiary: str
    amount_today_inr: int
    target_year: int
    priority: str


class FinancialProfile(BaseModel):
    monthly_income_inr: int
    monthly_expenses_inr: int
    individual_cover_inr: int
    employer_group_cover_inr: int
    liabilities: List[LiabilityOut]
    liquid_savings_inr: int
    market_investments_inr: int
    retirement_savings_inr: int
    eligible_assets_inr: int  # what the needs engine subtracts; retirement savings are not counted
    goals: List[GoalOut]
    monthly_premium_budget_inr: int


class TimelineEvent(BaseModel):
    kind: str
    title: str
    detail: str
    at: str


class CustomerDetail(BaseModel):
    overview: CustomerOverview
    financial: FinancialProfile
    analysis: AssessmentResult
    timeline: List[TimelineEvent]


class AppointmentSummary(BaseModel):
    booking_id: str
    customer_name: str
    slot_start: str
    slot_end: str
    slot_label: str
    consultation_mode: str
    status: str
    phase: str  # upcoming | past (started, outcome not yet recorded) | completed | no_show | cancelled, on the demo clock the slots use
    outcome: Optional[str] = None
    outcome_at: Optional[str] = None
    starts_in_minutes: int  # negative once started; relative to the same clock as `phase`
    cancelled_by: str = ""
    message_count: int = 0
    last_message_preview: Optional[str] = None
    last_message_at: Optional[str] = None
    simulated: bool = True


class AppointmentDetail(AppointmentSummary):
    customer_phone: Optional[str] = None  # only for phone consultations: the advisor needs it to place the call
    meeting_link: Optional[str] = None  # only for video consultations
    customer_note: Optional[str] = None
    advisor_notes: str = ""
    outcome_note: str = ""
    can_record_outcome: bool = False
    booked_at: str
    rescheduled: bool = False


class OutcomeIn(BaseModel):
    outcome: Literal["completed", "no_show"]
    note: str = Field("", max_length=500)


class NotesIn(BaseModel):
    advisor_notes: str = Field("", max_length=2000)


class RescheduleIn(BaseModel):
    slot_id: str = Field(..., max_length=32)


Priority = Literal["low", "medium", "high"]
ConsultationMode = Literal["video", "phone", "chat"]


class FollowUpIn(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    note: str = Field("", max_length=1000)
    due_date: date
    priority: Priority = "medium"
    profile_id: Optional[str] = Field(None, max_length=40)  # one of the advisor's own customers
    booking_id: Optional[str] = Field(None, max_length=64)  # one of the advisor's own appointments


class FollowUpUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    note: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[date] = None
    priority: Optional[Priority] = None
    status: Optional[Literal["open", "done"]] = None


class FollowUpOut(BaseModel):
    follow_up_id: str
    title: str
    note: str
    due_date: str
    priority: str
    status: str
    profile_id: Optional[str] = None
    customer_name: Optional[str] = None
    booking_id: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
    overdue: bool
    days_until_due: int  # negative when overdue


class AdvisorSettingsOut(BaseModel):
    follow_up_default_days: int
    consultation_modes: List[str]  # what the advisor currently offers
    available_modes: List[str]  # what they are qualified to offer (from the pack)
    password_change_supported: bool


class AdvisorSettingsIn(BaseModel):
    follow_up_default_days: int = Field(..., ge=0, le=30)
    consultation_modes: List[ConsultationMode] = Field(..., min_length=1, max_length=3)


class AdvisorProfileDetail(AdvisorProfileOut):
    bio: str


class ProfileIn(BaseModel):
    bio: str = Field("", max_length=500)


class PasswordChangeIn(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
