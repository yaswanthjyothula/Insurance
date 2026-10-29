import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Health Insurance Guide & Network Plans | LifeSure AI",
  description: "Comprehensive medical insurance in India. In-patient care, restoration benefits, room rent rules, and critical illness."
};

export default function HealthInsurancePage() {
  const products = [
    {
      id: "health-hdfc-optima-secure",
      name: "Optima Secure Health Plan",
      insurer: "HDFC ERGO General Insurance",
      category: "health",
      tagline: "4X coverage benefit with zero deductions on consumables and medical disposables",
      min_entry_age: 18,
      max_entry_age: 65,
      min_annual_income: 200000,
      min_sum_assured: 500000,
      max_sum_assured: 20000000,
      claim_settlement_ratio: 97.8,
      solvency_ratio: 1.85,
      base_rate_per_lakh: 210,
      key_features: [
        "Secure Benefit: 2X coverage instantly from Day 1",
        "Automatic restore benefit upon exhaustion of sum insured",
        "Zero deductions on medical consumables, gloves, and syringes"
      ],
      riders_available: ["Critical Illness Add-on", "Hospital Daily Cash"],
      exclusions: ["Pre-existing conditions for initial 36 months", "Cosmetic/aesthetic procedures"],
      source_provenance: "IRDAI General Insurance Filings",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="health"
      categoryTitle="Health Insurance"
      tagline="Comprehensive medical hospitalization, critical illness defense, and cashless care across India's top hospital networks."
      purpose="Health insurance shields your family savings against soaring healthcare and hospitalization costs. It covers room rent, doctor fees, ICU charges, pre/post-hospitalization care, day-care surgeries, and high-cost medical treatments directly through cashless hospital networks."
      whoShouldConsider={[
        "Every individual and family member, regardless of age or employer group insurance coverage",
        "Salaried employees needing independent cover not tied to corporate employment status",
        "Parents seeking to protect their children and senior dependents from private hospital inflation"
      ]}
      keyBenefits={[
        "Cashless admission and discharge across 10,000+ accredited network hospitals",
        "Automatic restoration of sum insured if exhausted during the policy year",
        "No proportionate room rent deductions on standard private single rooms",
        "Tax deductions up to ₹25,000 (self) and ₹50,000 (parents) under Section 80D"
      ]}
      exclusions={[
        "Initial 30-day waiting period for non-accidental hospital admissions",
        "Pre-Existing Diseases (PED) waiting period (typically 24 to 36 months)",
        "Cosmetic surgeries, non-prescribed health tonics, and experimental non-allopathic therapies"
      ]}
      pricingFactors={[
        "Eldest Family Member Age in Floater Plans: Premiums are anchored by the oldest insured life",
        "City/Zone of Residence: Tier-1 metros (Zone 1) have higher healthcare cost indices",
        "Choice of Deductible / Copayment: Opting for a voluntary deductible substantially lowers annual premiums"
      ]}
      questionsToAsk={[
        "Does this policy have sub-limits on room rent or specific treatments (like cataract or joint replacement)?",
        "What is the cumulative bonus booster percentage for claim-free renewal years?",
        "Are medical consumables (gloves, PPE, disposable kits) covered under the base policy or an add-on?"
      ]}
      products={products}
    />
  );
}
