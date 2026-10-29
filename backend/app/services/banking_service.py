from typing import List, Optional
from app.schemas.banking import BankProfile

DEMO_BANK_PROFILES: List[BankProfile] = [
    BankProfile(
        id="hdfc_corporate",
        bank_name="HDFC Bank",
        bank_code="HDFC",
        account_type="Corporate Classic Salary Account",
        masked_account="•••• 4819",
        holder_name="Praveen Sharma",
        kyc_status="Verified (CKYC Compliant)",
        cibil_score=785,
        monthly_salary_credit=150000.0,
        annual_income=1800000.0,
        monthly_expenses_inferred=60000.0,
        annual_expenses=720000.0,
        age=32,
        employment_type="salaried",
        dependents_count=2,
        active_home_loan_balance=3500000.0,
        active_other_loans_balance=0.0,
        liquid_savings_balance=650000.0,
        existing_term_cover=5000000.0,
        support_horizon_years=20,
        buffer_months=6,
        retirement_age=60,
        smoker_status="no",
        future_goals=[
            {
                "type": "education",
                "name": "Child Higher Education Fund",
                "cost": "2500000",
                "years": "14"
            }
        ],
        verification_badge="RBI Account Aggregator (Anumati AA) Verified",
        consent_statement="Consent ID: AA-HDFC-991204 granted via Anumati Account Aggregator for automated financial planning assessment."
    ),
    BankProfile(
        id="icici_wealth",
        bank_name="ICICI Bank",
        bank_code="ICICI",
        account_type="Wealth Management Executive Salary",
        masked_account="•••• 8902",
        holder_name="Ananya Sen",
        kyc_status="Verified (CKYC Compliant)",
        cibil_score=810,
        monthly_salary_credit=250000.0,
        annual_income=3000000.0,
        monthly_expenses_inferred=100000.0,
        annual_expenses=1200000.0,
        age=38,
        employment_type="salaried",
        dependents_count=3,
        active_home_loan_balance=6500000.0,
        active_other_loans_balance=800000.0,
        liquid_savings_balance=1500000.0,
        existing_term_cover=10000000.0,
        support_horizon_years=22,
        buffer_months=9,
        retirement_age=58,
        smoker_status="no",
        future_goals=[
            {
                "type": "education",
                "name": "Two Children Higher Education",
                "cost": "5000000",
                "years": "10"
            }
        ],
        verification_badge="ICICI iMobile Direct Bureau Sync (CIBIL 810)",
        consent_statement="Direct net-banking API integration linked to verified PAN and salary statement."
    ),
    BankProfile(
        id="sbi_csp",
        bank_name="State Bank of India",
        bank_code="SBI",
        account_type="Corporate Salary Package (Gold)",
        masked_account="•••• 3144",
        holder_name="Rahul Verma",
        kyc_status="Verified (CKYC Compliant)",
        cibil_score=760,
        monthly_salary_credit=95000.0,
        annual_income=1140000.0,
        monthly_expenses_inferred=40000.0,
        annual_expenses=480000.0,
        age=29,
        employment_type="salaried",
        dependents_count=1,
        active_home_loan_balance=2200000.0,
        active_other_loans_balance=200000.0,
        liquid_savings_balance=350000.0,
        existing_term_cover=2500000.0,
        support_horizon_years=25,
        buffer_months=6,
        retirement_age=60,
        smoker_status="no",
        future_goals=[
            {
                "type": "property",
                "name": "Home Renovation & Expansion",
                "cost": "1500000",
                "years": "8"
            }
        ],
        verification_badge="YONO SBI Open Banking & Account Aggregator",
        consent_statement="Consent authenticated via SBI YONO Open Banking secure token."
    ),
    BankProfile(
        id="axis_burgundy",
        bank_name="Axis Bank",
        bank_code="AXIS",
        account_type="Burgundy Corporate Salary Account",
        masked_account="•••• 7261",
        holder_name="Meera Nair",
        kyc_status="Verified (CKYC Compliant)",
        cibil_score=795,
        monthly_salary_credit=185000.0,
        annual_income=2220000.0,
        monthly_expenses_inferred=75000.0,
        annual_expenses=900000.0,
        age=34,
        employment_type="salaried",
        dependents_count=2,
        active_home_loan_balance=4500000.0,
        active_other_loans_balance=450000.0,
        liquid_savings_balance=800000.0,
        existing_term_cover=5000000.0,
        support_horizon_years=20,
        buffer_months=6,
        retirement_age=60,
        smoker_status="no",
        future_goals=[
            {
                "type": "education",
                "name": "International Master's Education",
                "cost": "3500000",
                "years": "12"
            }
        ],
        verification_badge="Axis Open Banking & Experian Bureau Link",
        consent_statement="Verified payroll direct deposit history & Experian active credit lines."
    )
]

class BankingService:
    @classmethod
    def list_profiles(cls) -> List[BankProfile]:
        return DEMO_BANK_PROFILES

    @classmethod
    def get_profile(cls, profile_id: str) -> Optional[BankProfile]:
        for p in DEMO_BANK_PROFILES:
            if p.id == profile_id or p.bank_code.lower() == profile_id.lower():
                return p
        return None
