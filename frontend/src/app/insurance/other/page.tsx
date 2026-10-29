import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Other & Cyber Sachet Insurance Guide | LifeSure AI",
  description: "Specialized retail insurance in India: Cyber defense, UPI phishing protection, and personal accident."
};

export default function OtherInsurancePage() {
  const products = [
    {
      id: "other-hdfc-cyber-sachet",
      name: "Personal Cyber Sachet Protector",
      insurer: "HDFC ERGO General Insurance",
      category: "other",
      tagline: "Comprehensive digital identity, UPI phishing, and cyber extortion defense",
      min_entry_age: 18,
      max_entry_age: 75,
      min_annual_income: 100000,
      min_sum_assured: 100000,
      max_sum_assured: 2500000,
      claim_settlement_ratio: 97.0,
      solvency_ratio: 1.85,
      base_rate_per_lakh: 80,
      key_features: [
        "Reimbursement of unauthorized financial transactions from UPI and credit cards",
        "Covers legal defence fees and digital reputation remediation costs",
        "Identity theft monitoring and specialist cyber forensic assistance"
      ],
      riders_available: ["Smart Device Hardware Repair Rider"],
      exclusions: ["Cryptocurrency loss", "Voluntary disclosure of OTP to third parties"],
      source_provenance: "IRDAI Retail Cyber Guidelines",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="other"
      categoryTitle="Other & Cyber Sachet Insurance"
      tagline="Low-cost digital defense against online financial scams, identity theft, and personal accidents."
      purpose="Specialized sachet insurance solves modern niche risks that traditional policies ignore. Personal Cyber Insurance covers financial loss from UPI phishing, malware attacks, and social engineering, while Personal Accident policies protect against temporary or permanent disablement."
      whoShouldConsider={[
        "Digital banking and UPI payment users transacting frequently on smartphones and e-commerce apps",
        "Frequent travelers, daily commuters, and gig workers facing higher physical transit risks",
        "Parents wanting to protect young family members from cyberbullying and online identity compromise"
      ]}
      keyBenefits={[
        "Direct monetary reimbursement for unauthorized digital bank transactions and card fraud",
        "Coverage for legal costs, IT forensics, and counselling fees following online extortion",
        "Personal Accident income replacement: Weekly cash benefits during temporary total disability"
      ]}
      exclusions={[
        "Losses resulting from voluntary disclosure of OTPs or PINs to unauthorized callers",
        "Speculative losses in cryptocurrency, digital assets, or unapproved foreign exchanges",
        "Intentional self-injury or reckless intoxication"
      ]}
      pricingFactors={[
        "Selected Coverage Tier: Micro sachet plans start from as low as ₹499 to ₹1,499 per year",
        "Occupation Risk Classification (for Personal Accident death and disability benefits)",
        "Device count and family floater options for cyber protection"
      ]}
      questionsToAsk={[
        "Does the cyber policy require a mandatory police FIR before reimbursing digital fraud?",
        "What is the maximum reporting window from the time of unauthorized transaction?",
        "Does the Personal Accident cover provide a regular monthly income if I am temporarily unable to work?"
      ]}
      products={products}
    />
  );
}
