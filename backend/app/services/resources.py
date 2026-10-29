from typing import List, Dict, Any, Optional

GLOSSARY_ITEMS: List[Dict[str, Any]] = [
    {
        "term": "Claim Settlement Ratio (CSR)",
        "category": "metrics",
        "definition": "The percentage of insurance claims settled by an insurer compared to the total claims received during a financial year.",
        "example": "If an insurer receives 10,000 death claims and approves 9,920, their CSR is 99.2%. IRDAI publishes this annually.",
        "importance": "High indicator of prompt insurer payout track record; aim for >98%."
    },
    {
        "term": "Solvency Ratio",
        "category": "metrics",
        "definition": "The measure of an insurer's capital availability relative to its outstanding policy liabilities.",
        "example": "IRDAI mandates a minimum solvency ratio of 1.50 (150%). A ratio of 2.10 means the company holds 2.1x the required buffer.",
        "importance": "Protects against insolvency risks during catastrophic loss years."
    },
    {
        "term": "Human Life Value (HLV)",
        "category": "planning",
        "definition": "The present discounted economic value of future earnings that a breadwinner would provide to their family during their working lifetime.",
        "example": "A 30-year-old earning ₹15 Lakhs/year until age 60 has an HLV of ~₹2.2 Crore after deducting personal living costs.",
        "importance": "Prevents severe underinsurance when setting life protection coverage."
    },
    {
        "term": "Free-Look Period",
        "category": "legal",
        "definition": "A statutory window (usually 30 days) allowing a policyholder to inspect the policy contract and cancel for a full refund minus stamp duty.",
        "example": "If you buy a policy online and discover unexpected exclusions in the policy document, you can return it within 30 days.",
        "importance": "Gives zero-risk review period to inspect all clauses and terms."
    },
    {
        "term": "Section 45 (Insurance Act 1938)",
        "category": "legal",
        "definition": "Protects policyholders by stating that after 3 continuous years, no life insurance policy can be called into question or rejected on grounds of misstatement.",
        "example": "Even if an error occurred in health disclosure, after 3 years the insurer cannot repudiate the death claim.",
        "importance": "Essential peace of mind guarantee for long-term term insurance."
    },
    {
        "term": "Waiver of Premium (WOP)",
        "category": "riders",
        "definition": "A rider that exempts the policyholder from paying future premiums if they suffer permanent disability or critical illness, keeping the life cover active.",
        "example": "Upon total permanent disability in an accident, future ₹20,000 annual premiums are waived, but the ₹1 Cr cover remains intact.",
        "importance": "Ensures policy does not lapse when an earner loses their ability to earn."
    }
]

INSURER_DIRECTORY: List[Dict[str, Any]] = [
    {
        "name": "HDFC Life Insurance Co. Ltd.",
        "type": "Life Insurance",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "101",
        "claim_settlement_ratio": 99.3,
        "solvency_ratio": 2.03,
        "established": 2000,
        "website": "https://www.hdfclife.com",
        "source": "IRDAI Annual Report 2023-24"
    },
    {
        "name": "ICICI Prudential Life Insurance Co. Ltd.",
        "type": "Life Insurance",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "105",
        "claim_settlement_ratio": 99.2,
        "solvency_ratio": 2.15,
        "established": 2001,
        "website": "https://www.iciciprulife.com",
        "source": "IRDAI Annual Report 2023-24"
    },
    {
        "name": "Max Life Insurance Co. Ltd.",
        "type": "Life Insurance",
        "headquarters": "New Delhi",
        "irda_reg_no": "104",
        "claim_settlement_ratio": 99.5,
        "solvency_ratio": 1.92,
        "established": 2000,
        "website": "https://www.maxlifeinsurance.com",
        "source": "IRDAI Annual Report 2023-24"
    },
    {
        "name": "Life Insurance Corporation of India (LIC)",
        "type": "Life Insurance (Public Sector)",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "512",
        "claim_settlement_ratio": 98.5,
        "solvency_ratio": 1.75,
        "established": 1956,
        "website": "https://www.licindia.in",
        "source": "LIC Statutory Disclosures"
    },
    {
        "name": "Tata AIA Life Insurance Co. Ltd.",
        "type": "Life Insurance",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "110",
        "claim_settlement_ratio": 99.1,
        "solvency_ratio": 1.88,
        "established": 2001,
        "website": "https://www.tataaia.com",
        "source": "IRDAI Annual Report 2023-24"
    },
    {
        "name": "HDFC ERGO General Insurance Co. Ltd.",
        "type": "General / Health Insurance",
        "headquarters": "Mumbai, Maharashtra",
        "irda_reg_no": "146",
        "claim_settlement_ratio": 97.8,
        "solvency_ratio": 1.85,
        "established": 2002,
        "website": "https://www.hdfcergo.com",
        "source": "General Insurance Council"
    }
]

CLAIM_COMPANION_GUIDE: Dict[str, Any] = {
    "title": "Comprehensive Claim Preparation Companion",
    "overview": "A step-by-step master checklist and guide for nominees to seamlessly file and track life insurance claims.",
    "steps": [
        {
            "step_number": 1,
            "title": "Immediate Intimation",
            "action": "Notify the insurer online or via their 24x7 toll-free helpline within 30 days of the unfortunate event.",
            "documents_needed": ["Policy number", "Date and cause of demise", "Nominee name & contact"]
        },
        {
            "step_number": 2,
            "title": "Essential Documentation Gathering",
            "action": "Compile certified copies of original municipal records.",
            "documents_needed": [
                "Original policy bond / certificate",
                "Municipal Death Certificate with QR verification",
                "Hospital discharge summary and medical death cause certificate",
                "Nominee Photo ID (Aadhaar / Passport) and PAN Card",
                "Cancelled bank cheque of the nominee's active savings account"
            ]
        },
        {
            "step_number": 3,
            "title": "Special Case Requirements (Accidental / Unnatural)",
            "action": "For accident, injury or road claims, statutory police documents are mandatory.",
            "documents_needed": [
                "Police First Information Report (FIR)",
                "Post-Mortem / Autopsy Report",
                "Final Police Investigation Report / Panchnama"
            ]
        },
        {
            "step_number": 4,
            "title": "Settlement & Escrow",
            "action": "Under IRDAI rules, claims must be processed within 30 days of complete document submission. Insurers pay penal interest for unauthorized delays."
        }
    ]
}

ADVISOR_DIRECTORY: List[Dict[str, Any]] = [
    {
        "id": "adv-ananya-sharma",
        "name": "Ananya Sharma, CFP®",
        "title": "Senior Financial Protection Advisor",
        "credentials": "Certified Financial Planner (FPSB), SEBI Registered RA",
        "experience_years": 12,
        "specialties": ["Term Insurance Structuring", "High Net-Worth Estate Planning", "HUF Protection"],
        "available_slots": ["Tomorrow 10:00 AM", "Tomorrow 2:30 PM", "Friday 11:00 AM", "Friday 4:00 PM"],
        "is_fiduciary_aligned": True
    },
    {
        "id": "adv-rajesh-iyer",
        "name": "Rajesh Iyer",
        "title": "Chartered Insurance Professional",
        "credentials": "Associate of Insurance Institute of India (AIII)",
        "experience_years": 16,
        "specialties": ["Critical Illness Portfolios", "Business Keyman Cover", "Claim Dispute Resolution"],
        "available_slots": ["Tomorrow 3:00 PM", "Saturday 10:30 AM", "Saturday 1:00 PM"],
        "is_fiduciary_aligned": True
    },
    {
        "id": "adv-priya-nair",
        "name": "Priya Nair, MBA",
        "title": "Family Risk & Dependency Strategist",
        "credentials": "AMFI Registered, FPSB Certified Specialist",
        "experience_years": 9,
        "specialties": ["Young Family Protection", "Child Education Shielding", "Dual-Income Planning"],
        "available_slots": ["Thursday 11:30 AM", "Thursday 4:30 PM", "Friday 3:00 PM"],
        "is_fiduciary_aligned": True
    }
]
