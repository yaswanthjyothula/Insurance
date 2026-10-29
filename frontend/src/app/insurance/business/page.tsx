import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Business & Keyman Insurance Guide | LifeSure AI",
  description: "Corporate Keyman insurance, employee group term, partnership continuity, and corporate tax benefits."
};

export default function BusinessInsurancePage() {
  const products = [
    {
      id: "biz-icici-keyman-term",
      name: "Corporate Keyman Term Protection",
      insurer: "ICICI Prudential Life Insurance",
      category: "business",
      tagline: "Shield company valuation, credit lines, and runway against the untimely loss of key executives",
      min_entry_age: 21,
      max_entry_age: 65,
      min_annual_income: 1200000,
      min_sum_assured: 20000000,
      max_sum_assured: 500000000,
      claim_settlement_ratio: 99.2,
      solvency_ratio: 2.15,
      base_rate_per_lakh: 135,
      key_features: [
        "Proceeds directly fund business succession and emergency operating runway",
        "Eligible as deductible business expense under Section 37(1) of Income Tax Act",
        "Protects lender confidence and prevents premature calling of company loans"
      ],
      riders_available: ["Critical Illness Executive Protection", "Permanent Disablement Rider"],
      exclusions: ["Self-harm", "Unapproved foreign travel to war zones"],
      source_provenance: "Corporate Insurance Guidelines",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="business"
      categoryTitle="Business & Keyman Insurance"
      tagline="Protecting enterprise continuity, partnership buyouts, bank credit lines, and employee groups."
      purpose="Business insurance safeguards companies against structural financial vulnerabilities. Keyman insurance protects the balance sheet against the death or disablement of key founders or revenue drivers, while Group Term covers employee families as part of corporate benefits."
      whoShouldConsider={[
        "Startups and enterprises with key founders possessing specialized technical or revenue expertise",
        "Partnerships and private limited companies with shareholder buyout agreements",
        "Companies holding significant bank borrowings where lenders demand keyman collateral"
      ]}
      keyBenefits={[
        "Premiums paid by the employer are deductible as legitimate business expenditure under Section 37(1)",
        "Liquidity to hire and onboard specialized executive replacement leadership without depleting cash reserves",
        "Prevents hostile buyout attempts by funding the purchase of deceased partner shares from legal heirs"
      ]}
      exclusions={[
        "Proceeds received by the company are treated as business revenue and subject to prevailing corporate income tax",
        "Cover is strictly limited by the executive's demonstrable contribution to company net profits",
        "Shareholder-employees holding more than 70% company equity face specific IRDAI underwriting restrictions"
      ]}
      pricingFactors={[
        "Age, health profile, and travel risk frequency of the designated Keyman executive",
        "Company net profits and EBITDA track record over the preceding 3 financial years",
        "Selected Sum Assured (commonly capped at 3x-5x average gross company profit)"
      ]}
      questionsToAsk={[
        "Is the policy structured under pure Keyman (company as beneficiary) or Employer-Employee trust?",
        "What happens to the policy if the key executive resigns or leaves the company?",
        "Can the policy be assigned to financial lending institutions as primary collateral security?"
      ]}
      products={products}
    />
  );
}
