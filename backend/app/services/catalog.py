import json
import os
from typing import List, Dict, Optional
from app.schemas.products import InsuranceProduct

_CATALOGUE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "term_catalogue.json")
_NO_LIMIT = 10_000_000_000.0  # stands in for "no upper limit, subject to underwriting"


def _load_term_plans() -> List[InsuranceProduct]:
    """Build the term-plan catalogue from the sourced JSON file."""
    with open(_CATALOGUE_FILE, encoding="utf-8") as f:
        data = json.load(f)
    insurers = data["insurers"]
    plans: List[InsuranceProduct] = []
    for p in data["plans"]:
        ins = insurers[p["insurer_key"]]
        claim, solv = ins["claim_settlement_ratio"], ins["solvency_ratio"]
        claim_basis = None
        if claim.get("value") is not None:
            claim_basis = f"{claim.get('basis') or 'insurer-reported'}" + (f", {claim['fy']}" if claim.get("fy") else "")
        plans.append(InsuranceProduct(
            id=p["id"],
            name=p["name"],
            insurer=ins["name"],
            category="term",
            tagline=p["tagline"],
            min_entry_age=p.get("min_entry_age"),
            max_entry_age=p.get("max_entry_age"),
            min_annual_income=0.0,
            min_sum_assured=float(p["min_sum_assured"] or 0),
            max_sum_assured=float(p["max_sum_assured"] or _NO_LIMIT),
            claim_settlement_ratio=claim.get("value"),
            solvency_ratio=solv.get("value"),
            base_rate_per_lakh=0.0,
            key_features=p["key_features"],
            riders_available=p["riders"],
            exclusions=p["exclusions"],
            source_provenance="Insurer's official documents and filings (see source links)",
            is_synthetic_demonstration=False,
            data_status="sourced" if p["status"] == "sourced" else "partially_sourced",
            uin=p.get("uin"),
            as_of=data["as_of"],
            min_term_years=p.get("min_term_years"),
            max_term_years=p.get("max_term_years"),
            max_maturity_age=p.get("max_maturity_age"),
            death_benefit_options=p["death_benefit_options"],
            premium_payment_options=p["premium_payment_options"],
            has_smoker_rates=p.get("has_smoker_rates"),
            brochure_url=p.get("brochure_url"),
            product_page_url=p.get("product_page_url"),
            quote_url=p.get("product_page_url"),
            claim_ratio_basis=claim_basis,
            claim_ratio_source_url=claim.get("source_url"),
            solvency_basis=solv.get("basis"),
            solvency_source_url=solv.get("source_url"),
            sum_assured_note=p.get("sum_assured_note"),
            notes=p.get("notes", []),
            sample_premium=p.get("sample_premium"),
            unconfirmed_fields=p.get("unconfirmed_fields", []),
        ))
    return plans


# Non-term entries below are illustrative samples only. They were not checked against official documents
# and are labelled that way wherever they are shown.
# Product catalogue representing primary Indian insurance products
# Labelled with source provenance or synthetic demonstration flags
_SAMPLE_ENTRIES: List[InsuranceProduct] = [
    # 1. Term Insurance
    InsuranceProduct(
        id="term-hdfc-click2protect",
        name="Click 2 Protect Super",
        insurer="HDFC Life Insurance",
        category="term",
        tagline="Comprehensive pure protection with flexible payout and critical illness options",
        min_entry_age=18,
        max_entry_age=65,
        min_annual_income=300000.0,
        min_sum_assured=5000000.0, # ₹50 L
        max_sum_assured=200000000.0, # ₹20 Cr
        claim_settlement_ratio=99.3,
        solvency_ratio=2.03,
        base_rate_per_lakh=115.0,
        key_features=[
            "Pure protection term life cover",
            "Option for terminal illness accelerated payout",
            "Waiver of premium on accidental total disability"
        ],
        riders_available=["Critical Illness Plus", "Accidental Death Rider", "Waiver of Premium"],
        exclusions=["Self-inflicted injury or suicide within first 12 months", "Hazardous sports without disclosure"],
        source_provenance="IRDAI Public Disclosures FY 2023-24",
        is_synthetic_demonstration=False
    ),
    InsuranceProduct(
        id="term-icici-iprotectsmart",
        name="iProtect Smart Term Plan",
        insurer="ICICI Prudential Life Insurance",
        category="term",
        tagline="High claim settlement track record with comprehensive 34-illness critical cover",
        min_entry_age=18,
        max_entry_age=65,
        min_annual_income=350000.0,
        min_sum_assured=5000000.0,
        max_sum_assured=250000000.0,
        claim_settlement_ratio=99.2,
        solvency_ratio=2.15,
        base_rate_per_lakh=110.0,
        key_features=[
            "Special discounted rates for non-smokers and salaried professionals",
            "Lump sum or staggered monthly income payout modes",
            "Optional cover up to 99 years of age"
        ],
        riders_available=["Accidental Death Benefit", "Comprehensive Critical Illness (34 Conditions)"],
        exclusions=["Suicide within 12 months of inception", "Criminal acts participation"],
        source_provenance="IRDAI Public Disclosures FY 2023-24",
        is_synthetic_demonstration=False
    ),
    InsuranceProduct(
        id="term-max-smartsecure",
        name="Smart Secure Plus Plan",
        insurer="Max Life Insurance",
        category="term",
        tagline="Top tier claim settlement ratio with early exit return of premium benefit",
        min_entry_age=18,
        max_entry_age=60,
        min_annual_income=300000.0,
        min_sum_assured=2500000.0,
        max_sum_assured=200000000.0,
        claim_settlement_ratio=99.5,
        solvency_ratio=1.92,
        base_rate_per_lakh=108.0,
        key_features=[
            "Special exit option allowing full refund of premiums at age 65",
            "Terminal illness diagnosis acceleration of 100% sum assured",
            "Option to increase cover at marriage and child birth milestones"
        ],
        riders_available=["Critical Illness and Disability Rider", "Waiver of Premium Rider"],
        exclusions=["Suicide within 12 months", "Military warfare active participation"],
        source_provenance="IRDAI Public Disclosures FY 2023-24",
        is_synthetic_demonstration=False
    ),
    InsuranceProduct(
        id="term-tata-aia-sampaurna",
        name="Sampoorna Raksha Supreme",
        insurer="Tata AIA Life Insurance",
        category="term",
        tagline="Long-term life protection with wellness discount incentives",
        min_entry_age=18,
        max_entry_age=65,
        min_annual_income=300000.0,
        min_sum_assured=5000000.0,
        max_sum_assured=150000000.0,
        claim_settlement_ratio=99.1,
        solvency_ratio=1.88,
        base_rate_per_lakh=118.0,
        key_features=[
            "Vitality wellness reward program reducing renewal premiums",
            "Choice of whole life cover up to age 100",
            "Inbuilt terminal illness cover"
        ],
        riders_available=["Tata AIA Vitality Health Rider", "Accidental Disability Rider"],
        exclusions=["Suicide within 1 year", "Breach of law"],
        source_provenance="IRDAI Public Disclosures FY 2023-24",
        is_synthetic_demonstration=False
    ),

    # 2. Whole Life / Traditional Life Insurance
    InsuranceProduct(
        id="life-lic-jeevan-umang",
        name="Jeevan Umang Whole Life Plan",
        insurer="Life Insurance Corporation of India (LIC)",
        category="life",
        tagline="Guaranteed annual survival benefits with lifelong protection up to age 100",
        min_entry_age=18,
        max_entry_age=55,
        min_annual_income=250000.0,
        min_sum_assured=2000000.0,
        max_sum_assured=50000000.0,
        claim_settlement_ratio=98.5,
        solvency_ratio=1.75,
        base_rate_per_lakh=480.0, # Traditional plans have higher premium due to savings/guarantee component
        key_features=[
            "8% of sum assured paid annually as survival benefit after premium payment term",
            "Lump sum maturity benefit at age 100 plus simple reversionary bonuses",
            "Sovereign guarantee backing under LIC Act Section 37"
        ],
        riders_available=["Accidental Death & Disability Benefit", "Term Assurance Rider"],
        exclusions=["Suicide within 12 months", "Misstatement of age exceeding limits"],
        source_provenance="LIC Public Product Filing",
        is_synthetic_demonstration=False
    ),

    # 3. Health Insurance
    InsuranceProduct(
        id="health-hdfc-optima-secure",
        name="Optima Secure Health Plan",
        insurer="HDFC ERGO General Insurance",
        category="health",
        tagline="4X coverage benefit from day 1 with zero deductions on non-medical expenses",
        min_entry_age=18,
        max_entry_age=65,
        min_annual_income=200000.0,
        min_sum_assured=500000.0,
        max_sum_assured=20000000.0,
        claim_settlement_ratio=97.8,
        solvency_ratio=1.85,
        base_rate_per_lakh=210.0,
        key_features=[
            "Secure Benefit: 2X coverage instantly from Day 1",
            "Automatic restore benefit upon exhaustion of sum insured",
            "Zero deduction on consumables and gloves/syringes"
        ],
        riders_available=["Critical Illness Add-on", "Hospital Daily Cash"],
        exclusions=["Pre-existing conditions for initial 36 months", "Cosmetic/aesthetic procedures"],
        source_provenance="IRDAI General Insurance Filings",
        is_synthetic_demonstration=False
    ),
    InsuranceProduct(
        id="health-care-supreme",
        name="Care Supreme Comprehensive Health",
        insurer="Care Health Insurance",
        category="health",
        tagline="Unlimited automatic recharge with cumulative bonus booster",
        min_entry_age=18,
        max_entry_age=75,
        min_annual_income=200000.0,
        min_sum_assured=500000.0,
        max_sum_assured=10000000.0,
        claim_settlement_ratio=96.9,
        solvency_ratio=1.70,
        base_rate_per_lakh=195.0,
        key_features=[
            "Unlimited automatic recharge for related and unrelated illnesses",
            "Cumulative bonus up to 500% of sum insured without reduction on claim",
            "No room rent sub-limits on standard private rooms"
        ],
        riders_available=["Care OPD Rider", "Annual Health Checkup Plus"],
        exclusions=["30-day initial waiting period", "Alternative non-allopathic treatments without approval"],
        source_provenance="IRDAI Disclosures",
        is_synthetic_demonstration=False
    ),

    # 4. General Insurance (Motor / Home / Travel)
    InsuranceProduct(
        id="gen-bajaj-allianz-home-shield",
        name="Bharat Griha Raksha (Home Shield)",
        insurer="Bajaj Allianz General Insurance",
        category="general",
        tagline="Standardized comprehensive property protection against natural catastrophes",
        min_entry_age=18,
        max_entry_age=80,
        min_annual_income=150000.0,
        min_sum_assured=1000000.0,
        max_sum_assured=50000000.0,
        claim_settlement_ratio=98.1,
        solvency_ratio=2.10,
        base_rate_per_lakh=25.0,
        key_features=[
            "Covers structural damage from earthquake, flood, cyclone, and fire",
            "Automatic 20% home contents cover without itemised listing",
            "Rent for alternative accommodation during building repair"
        ],
        riders_available=["Valuable Content Floater", "Personal Accident of Occupants"],
        exclusions=["Willful negligence", "War and nuclear risks"],
        source_provenance="IRDAI Standard Home Policy Mandate",
        is_synthetic_demonstration=False
    ),

    # 5. Investment-Linked Insurance (ULIPs)
    InsuranceProduct(
        id="ulip-sbi-retire-smart",
        name="SBI Life Retire Smart ULIP",
        insurer="SBI Life Insurance",
        category="investment_linked",
        tagline="Market-linked equity and debt portfolio growth with built-in life cover",
        min_entry_age=18,
        max_entry_age=60,
        min_annual_income=300000.0,
        min_sum_assured=1000000.0,
        max_sum_assured=20000000.0,
        claim_settlement_ratio=97.5,
        solvency_ratio=2.09,
        base_rate_per_lakh=320.0,
        key_features=[
            "Guaranteed additions added at regular intervals to boost corpus",
            "Advantage Plan automated asset allocation between equity & debt",
            "Tax-free capital gains under Section 10(10D) subject to statutory limits"
        ],
        riders_available=["Accidental Total Disability Benefit"],
        exclusions=["Market investment risks borne by policyholder", "Suicide within 12 months"],
        source_provenance="SBI Life Public Catalog",
        is_synthetic_demonstration=False
    ),

    # 6. Business Insurance
    InsuranceProduct(
        id="biz-icici-keyman-term",
        name="Corporate Keyman Term Protection",
        insurer="ICICI Prudential Life Insurance",
        category="business",
        tagline="Shield company valuation and loan covenants against loss of key executives",
        min_entry_age=21,
        max_entry_age=65,
        min_annual_income=1200000.0, # High threshold for corporate executives
        min_sum_assured=20000000.0, # Min ₹2 Cr
        max_sum_assured=500000000.0, # ₹50 Cr
        claim_settlement_ratio=99.2,
        solvency_ratio=2.15,
        base_rate_per_lakh=135.0,
        key_features=[
            "Proceeds directly fund business succession and emergency operating runway",
            "Eligible as deductible business expense under Section 37(1) of Income Tax Act",
            "Protects lender confidence and prevents premature calling of company loans"
        ],
        riders_available=["Critical Illness Executive Protection", "Permanent Disablement Rider"],
        exclusions=["Self-harm", "Unapproved foreign travel to war zones"],
        source_provenance="Corporate Insurance Guidelines",
        is_synthetic_demonstration=False
    ),

    # 7. Other Insurance (Cyber & Accident)
    InsuranceProduct(
        id="other-hdfc-cyber-sachet",
        name="Personal Cyber Sachet Protector",
        insurer="HDFC ERGO General Insurance",
        category="other",
        tagline="Comprehensive digital identity, UPI phishing, and cyber extortion defense",
        min_entry_age=18,
        max_entry_age=75,
        min_annual_income=100000.0,
        min_sum_assured=100000.0,
        max_sum_assured=2500000.0,
        claim_settlement_ratio=97.0,
        solvency_ratio=1.85,
        base_rate_per_lakh=80.0,
        key_features=[
            "Reimbursement of unauthorized financial transactions from UPI and credit cards",
            "Covers legal defence fees and digital reputation remediation costs",
            "Identity theft monitoring and specialist cyber forensic assistance"
        ],
        riders_available=["Smart Device Hardware Repair Rider"],
        exclusions=["Cryptocurrency loss", "Voluntary disclosure of OTP to third parties"],
        source_provenance="IRDAI Retail Cyber Guidelines",
        is_synthetic_demonstration=False
    )
]

_SAMPLE_ENTRIES = [p for p in _SAMPLE_ENTRIES if p.category != "term"]
for _p in _SAMPLE_ENTRIES:
    _p.data_status = "unverified_sample"
    _p.is_synthetic_demonstration = True
    _p.source_provenance = "Illustrative sample entry. Not verified against the insurer's official documents"

TERM_PLANS: List[InsuranceProduct] = _load_term_plans()
PRODUCT_CATALOGUE: List[InsuranceProduct] = TERM_PLANS + _SAMPLE_ENTRIES

def get_products_by_category(category: Optional[str] = None) -> List[InsuranceProduct]:
    if not category or category == "all":
        return PRODUCT_CATALOGUE
    cat = category.lower().replace("-", "_")
    return [p for p in PRODUCT_CATALOGUE if p.category == cat or cat in p.category]

def get_product_by_id(product_id: str) -> Optional[InsuranceProduct]:
    for p in PRODUCT_CATALOGUE:
        if p.id == product_id:
            return p
    return None
