import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Traditional Life Insurance Guide | LifeSure AI",
  description: "Endowment, money-back and whole life insurance in India. Sovereign guarantees, bonuses, and differences from term insurance."
};

export default function TraditionalLifeInsurancePage() {
  const products = [
    {
      id: "life-lic-jeevan-umang",
      name: "Jeevan Umang Whole Life Plan",
      insurer: "Life Insurance Corporation of India (LIC)",
      category: "life",
      tagline: "Guaranteed 8% annual survival benefits with lifelong protection up to age 100",
      min_entry_age: 18,
      max_entry_age: 55,
      min_annual_income: 250000,
      min_sum_assured: 2000000,
      max_sum_assured: 50000000,
      claim_settlement_ratio: 98.5,
      solvency_ratio: 1.75,
      base_rate_per_lakh: 480,
      key_features: [
        "8% of sum assured paid annually as survival benefit after premium payment term",
        "Lump sum maturity benefit at age 100 plus simple reversionary bonuses",
        "Sovereign guarantee backing under LIC Act Section 37"
      ],
      riders_available: ["Accidental Death & Disability Benefit", "Term Assurance Rider"],
      exclusions: ["Suicide within 12 months", "Misstatement of age exceeding underwriting limits"],
      source_provenance: "LIC Public Product Filing",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="life"
      categoryTitle="Traditional Life Insurance"
      tagline="Endowment, money-back, and whole-life savings plans providing capital protection, bonuses, and sovereign backing."
      purpose="Traditional life insurance combines a modest death benefit with a disciplined savings or guaranteed annuity component. Premiums are pooled into conservative debt instruments, providing guaranteed payouts or periodic bonuses upon surviving the policy term."
      whoShouldConsider={[
        "Conservative investors seeking guaranteed, non-market-volatile long-term cash flows",
        "Individuals prioritizing absolute capital preservation with sovereign backing",
        "Retirees looking for lifelong guaranteed pension income up to 100 years of age"
      ]}
      keyBenefits={[
        "Guaranteed annual cashflows or lump-sum maturity endowments",
        "Sovereign guarantee on sum assured and bonuses under LIC Act Section 37",
        "Exemption from market volatility and equity crash risks",
        "Loan facilities available against policy surrender value after 2-3 years"
      ]}
      exclusions={[
        "Lower internal rate of return (typically 4.5% to 6.0% p.a.) compared to diversified mutual funds",
        "High surrender penalty if terminated during the initial 3 policy years",
        "Suicide clause within the first 12 months from policy inception"
      ]}
      pricingFactors={[
        "Premium Payment Term (PPT): Limited pay (e.g. 15 yrs) vs regular pay over full tenure",
        "Selected Guaranteed Benefit Percentage (e.g. 8% of sum assured p.a.)",
        "Entry Age and Health Underwriting Band"
      ]}
      questionsToAsk={[
        "What is the net effective Internal Rate of Return (IRR) factoring in bonuses and tax?",
        "What is the exact surrender value schedule if I cannot pay premiums after 3 years?",
        "Are bonuses guaranteed by contract or declared annually based on insurer valuation surplus?"
      ]}
      products={products}
    />
  );
}
