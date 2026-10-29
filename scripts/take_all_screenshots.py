import os
import subprocess
import time

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUTPUT_DIR = "/Users/sriniketh/Downloads/Insurance/screenshots"
BASE_URL = "http://localhost:3000"

PAGES = [
    ("01_home_page.png", "/"),
    ("02_assessment_page.png", "/assessment"),
    ("03_coverage_results_page.png", "/results"),
    ("04_product_recommendations_page.png", "/products"),
    ("05_digital_advisory_page.png", "/advisory"),
    ("06_sign_in_page.png", "/sign-in"),
    ("07_dashboard_overview_page.png", "/dashboard"),
    ("08_dashboard_policies_page.png", "/dashboard/policies"),
    ("09_dashboard_insurance_vault_page.png", "/dashboard/insurance-vault"),
    ("10_dashboard_appointments_page.png", "/dashboard/appointments"),
    ("11_dashboard_protection_passport_page.png", "/dashboard/protection-passport"),
    ("12_tools_hub_page.png", "/tools"),
    ("13_tool_life_cover_calculator.png", "/tools/life-cover-calculator"),
    ("14_tool_protection_gap.png", "/tools/protection-gap"),
    ("15_tool_affordability_calculator.png", "/tools/affordability-calculator"),
    ("16_tool_scenario_studio.png", "/tools/scenario-studio"),
    ("17_tool_family_survival_simulator.png", "/tools/family-survival-simulator"),
    ("18_tool_policy_xray.png", "/tools/policy-xray"),
    ("19_tool_policy_replacement.png", "/tools/policy-replacement"),
    ("20_tool_premium_shock.png", "/tools/premium-shock"),
    ("21_tool_future_costs.png", "/tools/future-costs"),
    ("22_tool_application_readiness.png", "/tools/application-readiness"),
    ("23_tool_scam_shield.png", "/tools/scam-shield"),
    ("24_tool_emi_calculator.png", "/tools/emi-calculator"),
    ("25_insurance_hub_page.png", "/insurance"),
    ("26_insurance_term_page.png", "/insurance/term"),
    ("27_insurance_life_page.png", "/insurance/life"),
    ("28_insurance_health_page.png", "/insurance/health"),
    ("29_insurance_investment_linked_page.png", "/insurance/investment-linked"),
    ("30_insurance_business_page.png", "/insurance/business"),
    ("31_insurance_general_page.png", "/insurance/general"),
    ("32_insurance_other_page.png", "/insurance/other"),
    ("33_resources_hub_page.png", "/resources"),
    ("34_resources_learning_centre_page.png", "/resources/learning-centre"),
    ("35_resources_guides_page.png", "/resources/guides"),
    ("36_resources_glossary_page.png", "/resources/glossary"),
    ("37_resources_claims_page.png", "/resources/claims"),
    ("38_resources_insurance_companies_page.png", "/resources/insurance-companies"),
    ("39_resources_reviews_page.png", "/resources/reviews"),
    ("40_contact_support_page.png", "/contact"),
    ("41_privacy_policy_page.png", "/privacy-policy"),
    ("42_terms_and_conditions_page.png", "/terms-and-conditions"),
    ("43_cookie_policy_page.png", "/cookie-policy"),
    ("44_refund_policy_page.png", "/refund-policy"),
]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Saving {len(PAGES)} screenshots to {OUTPUT_DIR} ...")
    
    success_count = 0
    for filename, path in PAGES:
        target_file = os.path.join(OUTPUT_DIR, filename)
        url = f"{BASE_URL}{path}"
        cmd = [
            CHROME_BIN,
            "--headless=new",
            "--disable-gpu",
            "--window-size=1440,1080",
            f"--screenshot={target_file}",
            url
        ]
        
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
            if os.path.exists(target_file) and os.path.getsize(target_file) > 1000:
                size_kb = os.path.getsize(target_file) / 1024
                print(f"[OK] {filename} ({size_kb:.1f} KB) -> {path}")
                success_count += 1
            else:
                print(f"[FAILED] {filename} -> {path} (file missing or empty)")
        except Exception as e:
            print(f"[ERROR] {filename} -> {path}: {e}")

    print(f"\nCompleted: {success_count}/{len(PAGES)} screenshots captured in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
