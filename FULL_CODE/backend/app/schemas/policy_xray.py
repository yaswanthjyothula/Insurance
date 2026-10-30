from typing import List, Optional

from pydantic import BaseModel


class ClauseCitation(BaseModel):
    clause_title: str
    extracted_text: str
    page_reference: Optional[int] = None
    confidence_score: float  # 0.0 to 1.0


class PolicyAnalysisResult(BaseModel):
    document_id: str
    filename: str
    insurer: Optional[str] = None
    product_name: Optional[str] = None
    policy_number_masked: Optional[str] = None
    sum_assured: Optional[float] = None
    annual_premium: Optional[float] = None
    policy_term_years: Optional[int] = None
    premium_paying_term_years: Optional[int] = None
    policy_type: str = "Life / Term Insurance"

    key_benefits: List[str]
    exclusions: List[str]
    waiting_periods: List[str]
    critical_deadlines: List[str]
    citations: List[ClauseCitation]
    uncertain_fields: List[str]
    potential_protection_gaps: List[str]
    suggested_questions_for_insurer: List[str]
    disclaimer: str
