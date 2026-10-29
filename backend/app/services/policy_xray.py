import re
import uuid
from typing import List, Optional

from app.schemas.advisory_and_xray import ClauseCitation, PolicyAnalysisResult

# Insurer names to look for as whole words. Anything not found is reported as not found, never guessed.
INSURERS = [
    ("HDFC Life", "HDFC Life"), ("ICICI Prudential", "ICICI Prudential Life"), ("ICICI Life", "ICICI Life"),
    ("Max Life", "Max Life"), ("Axis Max", "Axis Max Life"), ("Tata AIA", "Tata AIA Life"), ("SBI Life", "SBI Life"),
    ("Kotak", "Kotak Life"), ("Bajaj", "Bajaj Life"), ("LIC", "Life Insurance Corporation of India"),
    ("Life Insurance Corporation", "Life Insurance Corporation of India"),
    ("Star Health", "Star Health"), ("Care Health", "Care Health"), ("Niva Bupa", "Niva Bupa"), ("HDFC ERGO", "HDFC ERGO"),
]
MONEY = r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakhs?|lacs?|l)?\b"


def _amount(num: str, unit: Optional[str]) -> Optional[float]:
    try:
        v = float(num.replace(",", ""))
    except ValueError:
        return None
    u = (unit or "").lower()
    if u in ("crore", "cr"):
        v *= 10_000_000
    elif u in ("lakh", "lakhs", "lac", "lacs", "l"):
        v *= 100_000
    return v


def _lines(text: str) -> List[str]:
    parts = re.split(r"[\n\r]+|(?<=[.;])\s+(?=[A-Z])", text)
    return [re.sub(r"\s+", " ", p).strip() for p in parts if len(p.strip()) > 3]


class PolicyXRayEngine:
    @classmethod
    def analyze_document_text(cls, filename: str, text: str) -> PolicyAnalysisResult:
        """Reads only what is in the text. Every item reported comes from a line in the input; missing items go to uncertain_fields."""
        lines = _lines(text)
        low = text.lower()
        uncertain: List[str] = []
        citations: List[ClauseCitation] = []

        def cite(title: str, line: str, conf: float = 0.9):
            citations.append(ClauseCitation(clause_title=title, extracted_text=line[:400], page_reference=None, confidence_score=conf))

        def first(pattern: str):
            for ln in lines:
                m = re.search(pattern, ln, re.IGNORECASE)
                if m:
                    return ln, m
            return None, None

        insurer = None
        for key, name in INSURERS:
            if re.search(rf"(?<![A-Za-z]){re.escape(key)}(?![A-Za-z])", text, re.IGNORECASE if len(key) > 3 else 0):
                insurer = name
                break
        if not insurer:
            uncertain.append("Insurer name not found in the text.")

        sum_assured = None
        ln, m = first(r"(?:sum assured|sum insured|cover(?:age)? amount|life cover)\D{0,30}" + MONEY)
        if m:
            sum_assured = _amount(m.group(1), m.group(2))
            if sum_assured:
                cite("Sum assured", ln)
        if not sum_assured:
            uncertain.append("Sum assured or sum insured not found.")

        premium = None
        ln, m = first(r"(?:annual(?:ized|ised)? premium|total premium|installment premium|yearly premium|premium)\D{0,30}" + MONEY)
        if m:
            premium = _amount(m.group(1), m.group(2))
            if premium:
                cite("Premium", ln)
        if not premium:
            uncertain.append("Premium amount not found.")

        term = None
        ln, m = first(r"(?:policy term|policy tenure|term)\D{0,20}(\d{1,2})\s*(?:years|yrs|year)")
        if m:
            term = int(m.group(1))
            cite("Policy term", ln)
        else:
            uncertain.append("Policy term not found.")
        ppt = None
        ln, m = first(r"(?:premium paying term|premium payment term|pay(?:ing)? term|ppt)\D{0,20}(\d{1,2})\s*(?:years|yrs|year)")
        if m:
            ppt = int(m.group(1))
            cite("Premium paying term", ln)

        product = None
        ln, m = first(r"(?:plan name|product name|name of the plan|policy type|plan)\s*[:\-]\s*([A-Za-z0-9 &\-+]{4,60})")
        if m:
            product = m.group(1).strip()
        policy_no = None
        ln, m = first(r"policy\s*(?:no\.?|number)\s*[:\-]?\s*([A-Za-z0-9\-/]{5,24})")
        if m:
            n = m.group(1)
            policy_no = "*" * max(0, len(n) - 4) + n[-4:]

        benefits: List[str] = []
        for ln in lines:
            if re.search(r"death benefit|maturity benefit|terminal illness|accelerated|waiver of premium|critical illness benefit|survival benefit|accidental death", ln, re.IGNORECASE):
                benefits.append(ln[:240])
        exclusions: List[str] = []
        for ln in lines:
            if re.search(r"exclusion|excluded|not payable|shall not be payable|suicide", ln, re.IGNORECASE):
                exclusions.append(ln[:240])
                cite("Exclusion or limit", ln, 0.85)
        if not exclusions:
            uncertain.append("No exclusions or suicide clause found. Look in the policy wording.")

        waiting: List[str] = []
        for ln in lines:
            if re.search(r"waiting period|cooling|moratorium|lock-?in", ln, re.IGNORECASE):
                waiting.append(ln[:240])
                cite("Waiting period", ln, 0.85)

        deadlines: List[str] = []
        ln, m = first(r"grace period\D{0,40}(\d{1,3})\s*days")
        if m:
            deadlines.append(f"Grace period: {m.group(1)} days")
            cite("Grace period", ln)
        else:
            uncertain.append("Grace period not found.")
        ln, m = first(r"free[- ]?look\D{0,40}(\d{1,3})\s*days")
        if m:
            deadlines.append(f"Free-look period: {m.group(1)} days")
            cite("Free-look period", ln)
        ln, m = first(r"(?:revival|reinstatement)\D{0,40}(\d{1,2})\s*(?:years|year|months)")
        if m:
            deadlines.append(ln[:200])

        # Observations based only on figures actually found
        gaps: List[str] = []
        if sum_assured and sum_assured < 5_000_000:
            gaps.append(f"Cover of ₹{sum_assured:,.0f} is small next to most households' needs. Check it against your loans and expenses.")
        if sum_assured and premium and premium > 0 and sum_assured / premium < 100 and "term" in low:
            gaps.append("The premium looks high for the cover. Compare with a pure term quote for the same cover.")
        if term and term < 20:
            gaps.append(f"The policy runs {term} years. Check it outlasts your loans and your dependents' need for support.")
        if "critical illness" not in low and "waiver" not in low:
            gaps.append("No critical illness or waiver of premium benefit mentioned in this text.")

        questions = [
            "Is the sum assured level or does it change over time?",
            "Which riders are attached, and what does each cost?",
            "What documents does a nominee need to claim?",
        ]

        return PolicyAnalysisResult(
            document_id=str(uuid.uuid4()),
            filename=filename,
            insurer=insurer,
            product_name=product,
            policy_number_masked=policy_no,
            sum_assured=sum_assured,
            annual_premium=premium,
            policy_term_years=term,
            premium_paying_term_years=ppt,
            policy_type="Not stated" if not product else product,
            key_benefits=benefits,
            exclusions=exclusions,
            waiting_periods=waiting,
            critical_deadlines=deadlines,
            citations=citations,
            uncertain_fields=uncertain,
            potential_protection_gaps=gaps,
            suggested_questions_for_insurer=questions,
            disclaimer="Read from the text you provided only. It does not interpret legal meaning and does not replace your policy contract.",
        )
