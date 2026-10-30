"""CRM lead shapes. A lead is one prospective customer moving through the sales stages."""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Stage = Literal["new", "contacted", "qualified", "proposal", "won", "lost"]
Source = Literal["assessment", "booking", "manual"]
STAGES: List[str] = ["new", "contacted", "qualified", "proposal", "won", "lost"]
STAGE_LABEL: Dict[str, str] = {
    "new": "New",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal": "Proposal",
    "won": "Won",
    "lost": "Lost",
}


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Note(BaseModel):
    at: str
    by: str
    text: str


class StageChange(BaseModel):
    at: str
    by: str  # "system" for a move made by the platform, else the administrator's address
    from_stage: Optional[str]
    to_stage: str
    note: str = ""


class LeadCard(BaseModel):
    """What the board shows for one lead."""

    lead_id: str
    name: str
    customer_id: str
    contact: str
    source: Source
    stage: Stage
    owner_advisor_id: Optional[str]
    owner_name: Optional[str]
    cover_needed: Optional[int]
    annual_premium: Optional[int]
    created_at: str
    updated_at: str
    days_in_stage: int
    note_count: int


class Lead(LeadCard):
    version: int
    assessment_id: Optional[str]
    booked_advisor_id: Optional[str]
    lost_reason: Optional[str]
    inputs: Dict[str, Optional[float]] = Field(default_factory=dict)
    notes: List[Note]
    history: List[StageChange]


class LeadUpdate(Strict):
    stage: Optional[Stage] = None
    owner_advisor_id: Optional[str] = Field(None, max_length=32)
    clear_owner: bool = False
    lost_reason: Optional[str] = Field(None, max_length=200)
    name: Optional[str] = Field(None, min_length=2, max_length=80)
    expected_version: Optional[int] = Field(None, ge=1, description="Refuse the change if the lead was edited since it was loaded")


class NewLead(Strict):
    name: str = Field(..., min_length=2, max_length=80)
    contact: str = Field("", max_length=120)
    cover_needed: Optional[int] = Field(None, ge=0, le=10_000_000_000)
    note: str = Field("", max_length=1000)
    owner_advisor_id: Optional[str] = Field(None, max_length=32)


class NoteIn(Strict):
    text: str = Field(..., min_length=1, max_length=1000)


class AdvisorRef(BaseModel):
    advisor_id: str
    advisor_name: str


class StageColumn(BaseModel):
    key: Stage
    label: str
    count: int
    cover_total: int
    leads: List[LeadCard]


class Pipeline(BaseModel):
    stages: List[StageColumn]
    total_leads: int
    open_leads: int
    open_cover: int
    advisors: List[AdvisorRef]
    synced_at: str
