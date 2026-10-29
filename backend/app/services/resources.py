from typing import List, Dict, Any, Optional

GLOSSARY_ITEMS: List[Dict[str, Any]] = [
    # Actuarial & Metrics
    {
        "term": "Claim Settlement Ratio (CSR)",
        "category": "metrics",
        "definition": "The percentage of claims settled by an insurer relative to the total claims reported during a financial year. IRDAI calculates this based on number of policies and claim amounts.",
        "example": "If an insurer receives 20,000 death claims and approves 19,860, their CSR by policy count is 99.30%. Check 3-year consistency rather than a single year's peak.",
        "importance": "Primary indicator of claim honoring reliability. Choose insurers with consistent CSR > 98% over the past 3 consecutive financial years."
    },
    {
        "term": "Solvency Ratio",
        "category": "metrics",
        "definition": "The ratio of an insurance company's available capital assets to its statutory liabilities. It measures the insurer's financial buffer to pay all claims even during catastrophic black-swan events.",
        "example": "IRDAI mandates a minimum regulatory solvency ratio of 1.50 (150%). Top Indian life insurers maintain buffers between 1.80x and 2.20x.",
        "importance": "Guarantees long-term survival of the insurer over your 30-40 year policy horizon."
    },
    {
        "term": "Persistency Ratio",
        "category": "metrics",
        "definition": "The proportion of policyholders who continue paying renewal premiums at specific milestone durations: 13th month, 25th month, 37th month, and 61st month.",
        "example": "An 85% 13th-month persistency means 85 out of 100 customers renewed their policy after Year 1. A high 61st-month persistency indicates zero mis-selling and satisfied long-term policyholders.",
        "importance": "Indicates customer satisfaction, absence of mis-selling, and sustainable policy pricing."
    },
    {
        "term": "Human Life Value (HLV)",
        "category": "planning",
        "definition": "The present discounted economic value of net future earnings that a breadwinner will contribute to their family during their remaining working life, after deducting personal taxes and living expenses.",
        "example": "A 32-year-old earning ₹18 Lakhs/year until age 60, deducting 30% personal consumption at 7% real wage-to-discount differential, has an HLV of ~₹2.6 Crore.",
        "importance": "The actuarial benchmark to determine true life cover sum assured and prevent crippling underinsurance."
    },
    {
        "term": "Capital Needs Analysis (Net Needs)",
        "category": "planning",
        "definition": "A comprehensive protection estimation method calculating: (Present Value of household living expenses) + (All outstanding loan debts) + (Future child education/marriage goals) minus (Existing liquid assets and existing life cover).",
        "example": "Gross family commitments of ₹2.10 Cr minus ₹30L mutual funds and ₹25L existing employer cover yields a net coverage gap of ₹1.55 Crore.",
        "importance": "Accounts for actual liabilities and specific family inflation milestones rather than arbitrary income multipliers."
    },

    # Legal & Statutory Protections
    {
        "term": "Section 45 (Insurance Act, 1938)",
        "category": "legal",
        "definition": "The statutory incontestability clause enacted by the Parliament of India. It states that after a life insurance policy has been in force for three continuous years, the insurer CANNOT question, repudiate, or reject a claim on any ground whatsoever, including misstatement.",
        "example": "If a policyholder passed away in Year 5, the insurer cannot deny the claim by alleging undisclosed non-material prior medical conditions. The claim must be paid in full.",
        "importance": "The single most powerful consumer legal protection in Indian insurance. Full truthful disclosure during the first 3 years earns permanent immunity."
    },
    {
        "term": "Free-Look Period",
        "category": "legal",
        "definition": "A statutory window granted to policyholders upon receiving the physical or digital policy document to review all clauses, terms, and exclusions. If unsatisfied, the policy can be returned for a 100% refund (minus stamp duty and proportionate medical test costs).",
        "example": "Under IRDAI Master Circular 2024, the free-look period for distance/online marketing is 30 days from document receipt.",
        "importance": "Enables risk-free inspection of policy wording to detect any discrepancies between sales pitches and actual contract clauses."
    },
    {
        "term": "Married Women's Property Act, 1874 (MWP Act)",
        "category": "legal",
        "definition": "Section 6 of the MWP Act allows a married man to assign a life insurance policy solely for the benefit of his wife and/or children. Once endorsed, the policy forms an independent trust and cannot be attached by creditors, banks, courts, or tax authorities.",
        "example": "A business owner facing commercial insolvency with ₹2 Cr debt has an MWP-endorsed ₹1.5 Cr term plan. The bank creditors cannot seize or attach a single rupee of the claim payout; it belongs exclusively to the wife and kids.",
        "importance": "Critical shield for business owners, startup founders, professionals, and anyone with commercial liabilities."
    },
    {
        "term": "Nomination vs Assignment",
        "category": "legal",
        "definition": "Nomination authorizes a person to receive claim proceeds as a custodian (under Section 39). Under the amended Insurance Act, beneficial nominees (spouse, parents, children) have absolute title. Assignment (Section 38) legally transfers full policy ownership to another entity, such as a bank for a home loan collateral.",
        "example": "Naming your spouse as beneficial nominee makes them the absolute owner of the death benefit. Assigning the policy to SBI makes SBI the first recipient to recover outstanding loan balance.",
        "importance": "Prevents family inheritance disputes and ensures claim funds reach rightful dependents directly."
    },
    {
        "term": "Section 10(10D) & Section 80C",
        "category": "legal",
        "definition": "Income Tax Act statutory provisions. Section 80C offers deduction up to ₹1.5 Lakh/yr for life insurance premiums. Section 10(10D) provides 100% tax-free maturity and death claim proceeds, provided the annual premium does not exceed 10% of sum assured (for traditional plans) or ₹5 Lakhs aggregate (Finance Act 2023).",
        "example": "A ₹1 Crore pure term insurance death benefit is 100% exempt from income tax in the hands of the nominee under Section 10(10D).",
        "importance": "Essential tax structuring awareness for both annual deductions and tax-exempt claim payouts."
    },

    # Riders & Add-on Benefits
    {
        "term": "Waiver of Premium (WOP)",
        "category": "riders",
        "definition": "A rider stipulating that if the life assured suffers Permanent Total Disability (PTD) or contracts a listed Critical Illness, all future renewal premiums across the policy term are completely waived, while 100% life cover remains fully active.",
        "example": "After a car accident causing loss of limbs, an earner can no longer work. The insurer pays future ₹24,000 annual premiums until age 60, preserving the ₹1.5 Cr family cover.",
        "importance": "The most cost-effective rider (~₹800-₹1,200/yr). Prevents policy lapse when earning ability is lost."
    },
    {
        "term": "Accelerated Critical Illness (CI) Rider",
        "category": "riders",
        "definition": "A rider that advances a portion or whole of the basic sum assured as an immediate lump sum upon first diagnosis of any of 34-64 listed major illnesses (e.g., cancer, stroke, heart attack, kidney failure), irrespective of hospitalization costs.",
        "example": "Diagnosed with Stage 3 cancer, the insured receives ₹25 Lakhs immediate cash within 15 days to fund experimental therapy, living expenses, and lost wages.",
        "importance": "Acts as income replacement during prolonged medical recovery when medical insurance only covers hospital bills."
    },
    {
        "term": "Accidental Death & Dismemberment (AD&D)",
        "category": "riders",
        "definition": "Pays an additional sum assured (often doubling the payout) if the policyholder passes away or loses sight/limbs directly due to an accident.",
        "example": "With a ₹1 Cr basic term cover and ₹50L AD&D rider, demise in a vehicular accident yields ₹1.50 Crore total payout to the nominee.",
        "importance": "High utility for frequent road commuters and industrial workers at a nominal incremental premium."
    },

    # Health & General Insurance
    {
        "term": "Pre-Existing Disease (PED) Waiting Period",
        "category": "health",
        "definition": "The statutory duration during which illnesses or medical conditions that existed before purchasing a health policy are not covered. Under IRDAI 2024 regulations, the maximum allowable PED waiting period across India was reduced from 48 months to 36 months.",
        "example": "An applicant with pre-existing Type 2 Diabetes can claim diabetes-related hospitalizations after 36 continuous months of policy coverage.",
        "importance": "Full disclosure during proposal prevents claim repudiation after the waiting period finishes."
    },
    {
        "term": "Room Rent Sub-Limits & Pro-Rata Deduction",
        "category": "health",
        "definition": "A policy clause restricting daily hospital room charges to a fixed rupee cap or percentage (e.g., 1% of sum insured). Choosing a room above this limit triggers proportionate deduction across the entire hospital bill—including doctor fees, ICU, and surgery charges.",
        "example": "On a ₹5L policy with 1% (₹5,000) room limit, staying in an ₹8,000 room causes the insurer to deduct 37.5% across the entire ₹3 Lakh hospital bill.",
        "importance": "Always prioritize policies with NO room rent capping to avoid catastrophic out-of-pocket penalties."
    },
    {
        "term": "No Claim Bonus (NCB) / Cumulative Bonus",
        "category": "health",
        "definition": "An automatic increase in the health insurance sum insured granted for every claim-free year without any increase in the premium payable, usually up to 50% to 100% of base cover.",
        "example": "A ₹10 Lakh base policy with 20% annual NCB increases to ₹12L in Year 2 and up to ₹20L in Year 6 with zero premium hikes.",
        "importance": "Builds substantial inflation-hedging medical coverage over time."
    },
    {
        "term": "Bharat Griha Raksha",
        "category": "general",
        "definition": "The standard home insurance policy mandated by IRDAI across all general insurance companies in India. It provides uniform cover for home buildings and household contents against 14 natural perils including flood, earthquake, cyclone, fire, and subsidence.",
        "example": "A homeowner pays ~₹2,500/yr for ₹50 Lakhs building reconstruction cover and ₹10 Lakhs home contents protection under standardized IRDAI terms.",
        "importance": "Eliminates policy fine-print differences across insurers for residential property protection."
    }
]

INSURER_DIRECTORY: List[Dict[str, Any]] = [
    {
        "name": "Life Insurance Corporation of India (LIC)",
        "type": "Public Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "512",
        "claim_settlement_ratio": 98.52,
        "solvency_ratio": 1.95,
        "established": 1956,
        "website": "https://www.licindia.in",
        "disclosures_url": "https://licindia.in/public-disclosures",
        "toll_free": "022-68276827",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "HDFC Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "101",
        "claim_settlement_ratio": 99.50,
        "solvency_ratio": 2.03,
        "established": 2000,
        "website": "https://www.hdfclife.com",
        "disclosures_url": "https://www.hdfclife.com/public-disclosures",
        "toll_free": "1800 266 9777",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "ICICI Prudential Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "105",
        "claim_settlement_ratio": 99.17,
        "solvency_ratio": 2.15,
        "established": 2001,
        "website": "https://www.iciciprulife.com",
        "disclosures_url": "https://www.iciciprulife.com/about-us/public-disclosure.html",
        "toll_free": "1860 266 7766",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Max Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "New Delhi",
        "irda_reg_no": "104",
        "claim_settlement_ratio": 99.65,
        "solvency_ratio": 1.92,
        "established": 2000,
        "website": "https://www.maxlifeinsurance.com",
        "disclosures_url": "https://www.maxlifeinsurance.com/about-us/public-disclosures",
        "toll_free": "1860 120 5577",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Tata AIA Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "110",
        "claim_settlement_ratio": 99.13,
        "solvency_ratio": 1.88,
        "established": 2001,
        "website": "https://www.tataaia.com",
        "disclosures_url": "https://www.tataaia.com/about-us/public-disclosure.html",
        "toll_free": "1860 266 9966",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "SBI Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "111",
        "claim_settlement_ratio": 98.75,
        "solvency_ratio": 2.12,
        "established": 2001,
        "website": "https://www.sbilife.co.in",
        "disclosures_url": "https://www.sbilife.co.in/en/about-us/public-disclosure",
        "toll_free": "1800 267 9090",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Kotak Mahindra Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "107",
        "claim_settlement_ratio": 98.82,
        "solvency_ratio": 2.65,
        "established": 2001,
        "website": "https://www.kotaklife.com",
        "disclosures_url": "https://www.kotaklife.com/about-us/public-disclosures",
        "toll_free": "1800 209 8800",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Bajaj Allianz Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Pune, Maharashtra",
        "irda_reg_no": "116",
        "claim_settlement_ratio": 99.23,
        "solvency_ratio": 4.88,
        "established": 2001,
        "website": "https://www.bajajallianzlife.com",
        "disclosures_url": "https://www.bajajallianzlife.com/about-us/public-disclosure.html",
        "toll_free": "1800 209 7272",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Aditya Birla Sun Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "109",
        "claim_settlement_ratio": 98.05,
        "solvency_ratio": 1.83,
        "established": 2000,
        "website": "https://lifeinsurance.adityabirlacapital.com",
        "disclosures_url": "https://lifeinsurance.adityabirlacapital.com/about-us/public-disclosures",
        "toll_free": "1800 270 7000",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Canara HSBC Life Insurance Co. Ltd.",
        "type": "Private Sector Life Insurer",
        "headquarters": "Gurugram, Haryana",
        "irda_reg_no": "136",
        "claim_settlement_ratio": 99.01,
        "solvency_ratio": 2.52,
        "established": 2008,
        "website": "https://www.canarahsbclife.com",
        "disclosures_url": "https://www.canarahsbclife.com/about-us/public-disclosure.html",
        "toll_free": "1800 103 0003",
        "source": "IRDAI Annual Report 2023-24",
        "category": "life"
    },
    {
        "name": "Star Health and Allied Insurance Co. Ltd.",
        "type": "Standalone Health Insurer (SAHI)",
        "headquarters": "Chennai, Tamil Nadu",
        "irda_reg_no": "129",
        "claim_settlement_ratio": 90.12,
        "solvency_ratio": 2.14,
        "established": 2006,
        "website": "https://www.starhealth.in",
        "disclosures_url": "https://www.starhealth.in/public-disclosure",
        "toll_free": "1800 425 2255",
        "source": "General Insurance Council 2023-24",
        "category": "health"
    },
    {
        "name": "Care Health Insurance Ltd. (formerly Religare)",
        "type": "Standalone Health Insurer (SAHI)",
        "headquarters": "Gurugram, Haryana",
        "irda_reg_no": "148",
        "claim_settlement_ratio": 92.45,
        "solvency_ratio": 1.82,
        "established": 2012,
        "website": "https://www.careinsurance.com",
        "disclosures_url": "https://www.careinsurance.com/about-us/public-disclosure.html",
        "toll_free": "1800 102 4488",
        "source": "General Insurance Council 2023-24",
        "category": "health"
    },
    {
        "name": "Niva Bupa Health Insurance Co. Ltd.",
        "type": "Standalone Health Insurer (SAHI)",
        "headquarters": "New Delhi",
        "irda_reg_no": "145",
        "claim_settlement_ratio": 91.80,
        "solvency_ratio": 1.76,
        "established": 2008,
        "website": "https://www.nivabupa.com",
        "disclosures_url": "https://www.nivabupa.com/public-disclosure.html",
        "toll_free": "1860 500 8888",
        "source": "General Insurance Council 2023-24",
        "category": "health"
    },
    {
        "name": "HDFC ERGO General Insurance Co. Ltd.",
        "type": "General & Health Insurer",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "146",
        "claim_settlement_ratio": 97.80,
        "solvency_ratio": 1.85,
        "established": 2002,
        "website": "https://www.hdfcergo.com",
        "disclosures_url": "https://www.hdfcergo.com/about-us/public-disclosure",
        "toll_free": "022 6234 6234",
        "source": "General Insurance Council 2023-24",
        "category": "general"
    }
]

CLAIM_COMPANION_GUIDE: Dict[str, Any] = {
    "title": "Comprehensive Nominee Claim Settlement Companion",
    "overview": "A definitive, legally grounded master checklist and statutory roadmap for family nominees to file, track, and settle life insurance death claims smoothly in India.",
    "regulatory_framework": {
        "regulator": "Insurance Regulatory and Development Authority of India (IRDAI)",
        "governing_statute": "IRDAI (Protection of Policyholders' Interests) Regulations, 2017 & Section 45 Insurance Act, 1938",
        "settlement_mandate_days": 30,
        "penal_interest_rate": "Bank Rate + 2% per annum for any unauthorized delay beyond 30 days"
    },
    "escalation_pathway": [
        {
            "tier": 1,
            "authority": "Insurer Grievance Redressal Officer (GRO)",
            "timeline": "Must resolve within 14 days",
            "action": "Submit formal written grievance quoting policy number and claim docket.",
            "url": "https://bimabharosa.irdai.gov.in"
        },
        {
            "tier": 2,
            "authority": "IRDAI Bima Bharosa Portal (formerly IGMS)",
            "timeline": "Regulator tracks insurer compliance",
            "action": "Register online dispute on IRDAI's statutory grievance portal or dial national toll-free helpline.",
            "url": "https://bimabharosa.irdai.gov.in",
            "helpline": "155255 / 1800 4254 732"
        },
        {
            "tier": 3,
            "authority": "Insurance Ombudsman (Council for Insurance Ombudsmen - CIO)",
            "timeline": "Binding award issued within 3 months",
            "action": "Quasi-judicial forum for claims up to ₹50 Lakhs. Completely free for consumers; award is strictly binding on the insurer.",
            "url": "https://www.cioins.co.in",
            "helpline": "17 Ombudsman centres across India"
        }
    ],
    "steps": [
        {
            "step_number": 1,
            "title": "Immediate Claim Intimation",
            "timeline": "Within 30 days of the demise (delays are condoned if accompanied by reasonable medical cause)",
            "action": "Notify the insurer online through their official portal, claim email, or 24x7 toll-free helpline. Note the generated Claim Reference Docket Number.",
            "documents_needed": [
                "Policy Certificate or Schedule Number",
                "Full legal name of the deceased policyholder",
                "Date, exact time, and place of demise",
                "Nominee contact phone, email, and current residential address"
            ]
        },
        {
            "step_number": 2,
            "title": "Mandatory Municipal & KYC Documentation",
            "timeline": "Compile certified attested originals within 15-30 days",
            "action": "Obtain authentic government municipal records with verifiable digital QR codes or official seals.",
            "documents_needed": [
                "Original Policy Bond / Certificate (or Indemnity Bond Form if misplaced)",
                "Official Municipal Death Certificate (certified copy with QR verification)",
                "Hospital Death Summary & Attending Physician Statement stating cause of death",
                "Nominee Government Photo Identity Proof (Aadhaar Card, Passport, or Voter ID)",
                "Nominee PAN Card (mandatory for TDS verification and anti-money laundering compliance)",
                "Cancelled original bank cheque or bank-attested passbook of the nominee's active savings account"
            ]
        },
        {
            "step_number": 3,
            "title": "Special Documentation for Accidental / Unnatural Claims",
            "timeline": "Required strictly when death is accidental, occupational, or unnatural",
            "action": "Secure official police and forensic reports from the local jurisdiction.",
            "documents_needed": [
                "Police First Information Report (FIR) / Detailed Inquest Panchnama",
                "Post-Mortem / Forensic Autopsy Examination Report",
                "Police Final Investigation Closure Report (Form 54 / Charge Sheet)",
                "Driving Licence copy of the deceased (if demise occurred during a vehicular road incident)",
                "Hospital Medico-Legal Certificate (MLC) & toxicology report if applicable"
            ]
        },
        {
            "step_number": 4,
            "title": "Statutory 30-Day Settlement & Fund Credit",
            "timeline": "Strictly 30 days from receipt of all required documents",
            "action": "Under Regulation 14 of IRDAI PPI Regulations, the insurer must process and release the fund transfer directly via NEFT/RTGS to the nominee's account. Any clarification must be raised in a single unified letter, not in piecemeal delays.",
            "documents_needed": [
                "NEFT Electronic Clearance Mandate",
                "Claim Discharge Voucher signed by the nominee upon sanction"
            ]
        }
    ]
}

ADVISOR_DIRECTORY: List[Dict[str, Any]] = [
    {
        "id": "adv-ananya-sharma",
        "name": "Ananya Sharma, CFP®",
        "title": "Senior Financial Protection Advisor",
        "credentials": "Certified Financial Planner (FPSB India #98421), SEBI Registered RA",
        "experience_years": 12,
        "specialties": ["Term Insurance Structuring", "High Net-Worth Estate Planning", "MWP Act Trusts"],
        "available_slots": ["Tomorrow 10:00 AM", "Tomorrow 2:30 PM", "Friday 11:00 AM", "Friday 4:00 PM"],
        "is_fiduciary_aligned": True
    },
    {
        "id": "adv-rajesh-iyer",
        "name": "Rajesh Iyer",
        "title": "Chartered Insurance Professional",
        "credentials": "Associate of Insurance Institute of India (AIII), Licentiate #44910",
        "experience_years": 16,
        "specialties": ["Critical Illness Portfolios", "Business Keyman Cover", "Claim Dispute Ombudsman Resolution"],
        "available_slots": ["Tomorrow 3:00 PM", "Saturday 10:30 AM", "Saturday 1:00 PM"],
        "is_fiduciary_aligned": True
    },
    {
        "id": "adv-priya-nair",
        "name": "Priya Nair, MBA",
        "title": "Family Risk & Dependency Strategist",
        "credentials": "AMFI Registered Mutual Fund Advisor, FPSB Specialist Certification",
        "experience_years": 9,
        "specialties": ["Young Family Protection", "Child Higher Education Shielding", "Dual-Income Tax Optimization"],
        "available_slots": ["Thursday 11:30 AM", "Thursday 4:30 PM", "Friday 3:00 PM"],
        "is_fiduciary_aligned": True
    }
]
