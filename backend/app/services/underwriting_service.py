import re
import hashlib
import datetime
from typing import Dict, Any, Optional
from app.schemas.underwriting import (
    CKYCLookupRequest,
    CKYCLookupResponse,
    MedicalTriageInput,
    UnderwritingDecision,
    PolicyIssuanceRequest,
    PolicyIssuanceResponse,
)

PRESET_PROFILES: Dict[str, Dict[str, Any]] = {
    "ABCPS1234A": {
        "ckyc_number": "91028374650192",
        "pan": "ABCPS1234A",
        "full_name": "Praveen Sharma",
        "dob": "1992-05-14",
        "gender": "Male",
        "father_or_spouse_name": "Ramesh Chandra Sharma",
        "address": "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
        "pincode": "560103",
    },
    "XYZAS5678B": {
        "ckyc_number": "88219472019482",
        "pan": "XYZAS5678B",
        "full_name": "Ananya Sen",
        "dob": "1986-11-20",
        "gender": "Female",
        "father_or_spouse_name": "Debabrata Sen",
        "address": "12B Alipore Park Road, Alipore, Kolkata",
        "pincode": "700027",
    },
    "DEFPR9012C": {
        "ckyc_number": "73910284561029",
        "pan": "DEFPR9012C",
        "full_name": "Rahul Verma",
        "dob": "1995-03-08",
        "gender": "Male",
        "father_or_spouse_name": "Om Prakash Verma",
        "address": "H-24, Sector 62, Noida, Gautam Buddha Nagar",
        "pincode": "201301",
    },
    "GHIJM3456D": {
        "ckyc_number": "62910485910238",
        "pan": "GHIJM3456D",
        "full_name": "Meera Nair",
        "dob": "1990-08-18",
        "gender": "Female",
        "father_or_spouse_name": "Madhavan Nair",
        "address": "Plot 18, Giri Nagar, Kadavanthra, Kochi",
        "pincode": "682020",
    },
}

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")


class UnderwritingService:
    @staticmethod
    def lookup_ckyc(req: CKYCLookupRequest) -> CKYCLookupResponse:
        clean_pan = req.pan_number.strip().upper()
        if not PAN_REGEX.match(clean_pan):
            raise ValueError(
                "Invalid PAN format. Indian PAN must consist of 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F)."
            )

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

        # Check known preset
        if clean_pan in PRESET_PROFILES:
            data = PRESET_PROFILES[clean_pan]
            return CKYCLookupResponse(
                ckyc_number=data["ckyc_number"],
                pan=clean_pan,
                full_name=req.full_name or data["full_name"],
                dob=req.date_of_birth or data["dob"],
                gender=data["gender"],
                father_or_spouse_name=data["father_or_spouse_name"],
                address=data["address"],
                pincode=data["pincode"],
                kyc_status="VERIFIED",
                kyc_source="Central KYC Registry (CERSAI) & Income Tax Department (NSDL/UTIITSL)",
                aml_screening="CLEARED (Zero match on UNSC / FATF PEP Sanction Lists)",
                timestamp=now_str,
            )

        # Deterministic simulation for any valid PAN
        seed = int(hashlib.md5(clean_pan.encode("utf-8")).hexdigest()[:10], 16)
        simulated_ckyc = str(90000000000000 + (seed % 9999999999999))
        pincode = str(110001 + (seed % 889999))
        name = req.full_name.strip() if req.full_name and req.full_name.strip() else f"Applicant ({clean_pan})"
        dob = req.date_of_birth or "1992-06-15"

        return CKYCLookupResponse(
            ckyc_number=simulated_ckyc,
            pan=clean_pan,
            full_name=name,
            dob=dob,
            gender="Individual",
            father_or_spouse_name="Verified in Bureau Records",
            address=f"Registered Address mapped to PAN {clean_pan}, Sector {seed % 100 + 1}",
            pincode=pincode,
            kyc_status="VERIFIED",
            kyc_source="Central KYC Registry (CERSAI) & Income Tax Department (NSDL/UTIITSL)",
            aml_screening="CLEARED (Zero match on UNSC / FATF PEP Sanction Lists)",
            timestamp=now_str,
        )

    @staticmethod
    def evaluate_medical_triage(inp: MedicalTriageInput) -> UnderwritingDecision:
        multiplier = 1.0
        factors = []
        requirements = []

        # 1. Tobacco evaluation
        tobacco = inp.tobacco_use.lower()
        if tobacco == "never":
            factors.append("Tobacco: Nil consumption (Preferred Non-Smoker Tier: 0% loading)")
        elif tobacco == "occasional":
            multiplier += 0.15
            factors.append("Tobacco: Occasional consumption (+15% risk loading applied)")
            requirements.append("Tele-Medical Declaration on occasional nicotine/vaping history")
        elif tobacco == "regular":
            multiplier += 0.35
            factors.append("Tobacco: Regular tobacco user (+35% actuarial mortality loading)")
            if inp.sum_assured >= 10000000:
                requirements.append("Cotinine Urine Strip Test (Home phlebotomist sample collection)")
        else:
            factors.append("Tobacco: Standard non-smoker declaration accepted")

        # 2. Pre-existing conditions
        conditions = [c.lower() for c in inp.pre_existing_conditions]
        has_cardiac = "cardiac_history" in conditions
        has_diabetes = "diabetes" in conditions
        has_hypertension = "hypertension" in conditions

        if "none" in conditions or not conditions:
            factors.append("Medical History: No adverse cardiovascular or endocrine conditions disclosed")
        else:
            if has_hypertension:
                multiplier += 0.15
                factors.append("Cardiovascular: Managed Hypertension (+15% sub-standard loading)")
                requirements.append("Latest 3 months Blood Pressure readings & physician consultation note")
            if has_diabetes:
                multiplier += 0.25
                factors.append("Endocrine: Type 2 Diabetes Mellitus (+25% sub-standard loading)")
                requirements.append("Fasting Blood Sugar & HbA1c lab report (< 7.0 required for acceptance)")
            if has_cardiac:
                multiplier += 0.50
                factors.append("Cardiovascular: Pre-existing cardiac event/stent (+50% clinical underwriting loading)")
                requirements.append("12-Lead Resting Electrocardiogram (ECG)")
                requirements.append("Cardiology Treadmill Stress Test (TMT) within last 6 months")

        # 3. Family longevity
        family = inp.family_longevity.lower()
        if family == "both_parents_above_70":
            multiplier -= 0.05
            factors.append("Family Longevity: Both biological parents lived past 70 (-5% longevity bonus discount)")
        elif family == "one_parent_cardiac_cancer_before_60":
            multiplier += 0.10
            factors.append("Family History: Early hereditary cardiovascular/neoplastic incident before 60 (+10% loading)")
        else:
            factors.append("Family History: Standard family longevity profile (no early hereditary mortality)")

        # High sum assured triage check
        if inp.sum_assured >= 20000000 and inp.age >= 45:
            requirements.append("Senior Medical Underwriter Tele-Interview (Video Call)")

        multiplier = max(0.85, round(multiplier, 2))
        loading_pct = round((multiplier - 1.0) * 100, 1)

        adj_annual = round(inp.base_annual_premium * multiplier, 2)
        adj_monthly = round(adj_annual / 12.0, 2)

        # Decision routing
        if has_cardiac:
            decision = "PHYSICAL_EXAM_REQUIRED"
            badge = "Comprehensive Clinical Review Required"
            summary = (
                "Due to disclosed cardiovascular history, the proposal requires formal cardiologist review "
                "and an in-person diagnostic workup before policy issuance."
            )
            stp = False
        elif has_diabetes or (tobacco == "regular" and inp.sum_assured >= 10000000):
            decision = "TELE_MEDICAL_REQUIRED"
            badge = "Tele-Medical Verification Required"
            summary = (
                "Your profile qualifies for conditional acceptance. An authorized medical officer will conduct "
                "a 15-minute video consultation and home blood sample collection before final binding."
            )
            stp = False
        elif multiplier > 1.0:
            decision = "PREMIUM_LOADING"
            badge = "Approved with Risk Loading (Instant Issuance Available)"
            summary = (
                f"Your proposal is approved via Straight-Through Processing (STP) with an actuarial loading of "
                f"+{loading_pct}%. You can bind and issue the policy instantly upon accepting the revised premium."
            )
            stp = True
            if not requirements:
                requirements.append("None - Instant Digital Straight-Through Processing (STP) Approved")
        else:
            decision = "INSTANT_ISSUANCE"
            badge = "Preferred Standard Rates (Instant Issuance Ready)"
            summary = (
                "Excellent health risk profile! Your policy is pre-approved at standard preferred rates with "
                "zero waiting period and instant digital policy issuance."
            )
            stp = True
            requirements.append("None - Zero-Touch Digital Straight-Through Processing (STP)")

        disclosures = [
            "Section 45 of Insurance Act 1938: A policy cannot be called in question on ground of misstatement after expiry of 3 years.",
            "Doctrine of Utmost Good Faith (Uberrimae Fidei): Full and truthful disclosure ensures 100% claim incontestability.",
            "Digital Personal Data Protection (DPDP) Act 2023: Health data is processed exclusively for automated underwriting.",
        ]

        return UnderwritingDecision(
            underwriting_decision=decision,
            decision_badge=badge,
            decision_summary=summary,
            premium_multiplier=multiplier,
            original_annual_premium=inp.base_annual_premium,
            original_monthly_premium=inp.base_monthly_premium,
            adjusted_annual_premium=adj_annual,
            adjusted_monthly_premium=adj_monthly,
            loading_percentage=loading_pct,
            underwriting_factors=factors,
            medical_requirements=requirements,
            stp_eligible=stp,
            regulatory_disclosures=disclosures,
        )

    @staticmethod
    def issue_policy(req: PolicyIssuanceRequest) -> PolicyIssuanceResponse:
        seed = int(hashlib.md5(f"{req.pan_number}-{req.product_id}".encode("utf-8")).hexdigest()[:8], 16)
        policy_num = f"POL-2026-IN-{100000 + (seed % 900000)}"
        proposal_num = f"PROP-IN-{200000 + (seed % 800000)}"
        now = datetime.datetime.now()
        issued_date = now.strftime("%d %B %Y")
        commencement_date = (now + datetime.timedelta(days=1)).strftime("%d %B %Y")

        sig_data = f"{policy_num}|{req.ckyc_number}|{req.sum_assured}|{issued_date}"
        sig_hash = hashlib.sha256(sig_data.encode("utf-8")).hexdigest()[:16].upper()

        status = "ISSUED_ACTIVE" if req.underwriting_decision in ("INSTANT_ISSUANCE", "PREMIUM_LOADING") else "CONDITIONAL_ACCEPTANCE"
        msg = (
            f"Policy {policy_num} has been successfully issued under IRDAI Digital Guidelines. "
            f"Cover of ₹{req.sum_assured:,.0f} is effective from {commencement_date}."
            if status == "ISSUED_ACTIVE"
            else f"Proposal {proposal_num} accepted conditionally subject to completing scheduled tele-medical verification."
        )

        return PolicyIssuanceResponse(
            policy_number=policy_num,
            proposal_number=proposal_num,
            issuance_status=status,
            issued_date=issued_date,
            commencement_date=commencement_date,
            proposer_name=req.proposer_name,
            ckyc_number=req.ckyc_number,
            product_name=req.product_name,
            insurer=req.insurer_name,
            sum_assured=req.sum_assured,
            annual_premium=req.annual_premium,
            monthly_premium=req.monthly_premium,
            tenure_years=req.tenure_years,
            free_look_period_days=30,
            digital_signature_hash=f"SHA256:{sig_hash}",
            message=msg,
        )
