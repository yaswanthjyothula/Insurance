"""Advisor directory. Glossary, insurer facts and the claim guide now live in the frontend (src/data) with sources."""
from typing import Any, Dict, List

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
