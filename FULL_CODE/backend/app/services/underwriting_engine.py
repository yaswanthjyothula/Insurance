"""Which underwriting route a quote falls on, from the thresholds in the active admin configuration. No limit is written in this file."""

from app.pack.loader import get_pack
from app.schemas.quote import UnderwritingOut

LABELS = {
    "non_medical": "Non-medical: no medical tests needed",
    "tele_medical": "Tele-medical: a short medical interview by phone",
    "physical_medical": "Physical medical: a medical examination is required",
    "full_underwriting": "Full underwriting: physical medical plus a financial review",
}


def assess(age: int, sum_assured: int, smoker: bool) -> UnderwritingOut:
    rules = get_pack().underwriting
    reasons = []
    if sum_assured <= rules.non_medical_sum_assured_limit and age <= rules.non_medical_maximum_age:
        route = "non_medical"
        reasons.append(f"Cover is within Rs {rules.non_medical_sum_assured_limit:,} and age is {rules.non_medical_maximum_age} or under.")
    elif sum_assured <= rules.tele_medical_threshold:
        route = "tele_medical"
        reasons.append(
            f"Age is over {rules.non_medical_maximum_age}."
            if sum_assured <= rules.non_medical_sum_assured_limit
            else f"Cover is above Rs {rules.non_medical_sum_assured_limit:,}."
        )
    elif sum_assured <= rules.physical_medical_threshold:
        route = "physical_medical"
        reasons.append(f"Cover is above the Rs {rules.tele_medical_threshold:,} tele-medical limit.")
    else:
        route = "full_underwriting"
        reasons.append(f"Cover is above Rs {rules.physical_medical_threshold:,}.")
    stp = False
    if not rules.stp_enabled:
        reasons.append("Straight-through processing is switched off.")
    elif route != "non_medical":
        reasons.append("Straight-through processing needs a non-medical case.")
    elif sum_assured > rules.stp_maximum_sum_assured or age > rules.stp_maximum_age:
        reasons.append(f"Straight-through processing covers up to Rs {rules.stp_maximum_sum_assured:,} and age {rules.stp_maximum_age}.")
    elif smoker and not rules.stp_allow_smokers:
        reasons.append("Straight-through processing is not offered to smokers.")
    else:
        stp = True
        reasons.append("Eligible for straight-through processing.")
    return UnderwritingOut(route=route, label=LABELS[route], stp_eligible=stp, reasons=reasons)
