import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "General & Property Insurance Guide | LifeSure AI",
  description: "Bharat Griha Raksha standardized home, property, motor, and natural disaster insurance."
};

export default function GeneralInsurancePage() {
  const products = [
    {
      id: "gen-bajaj-allianz-home-shield",
      name: "Bharat Griha Raksha (Home Shield)",
      insurer: "Bajaj Allianz General Insurance",
      category: "general",
      tagline: "Standardized comprehensive property protection against natural catastrophes and fire",
      min_entry_age: 18,
      max_entry_age: 80,
      min_annual_income: 150000,
      min_sum_assured: 1000000,
      max_sum_assured: 50000000,
      claim_settlement_ratio: 98.1,
      solvency_ratio: 2.10,
      base_rate_per_lakh: 25,
      key_features: [
        "Covers structural damage from earthquake, flood, cyclone, and fire",
        "Automatic 20% home contents cover without itemised listing",
        "Rent for alternative accommodation during building repairs"
      ],
      riders_available: ["Valuable Content Floater", "Personal Accident of Occupants"],
      exclusions: ["Willful negligence", "War and nuclear risks"],
      source_provenance: "IRDAI Standard Home Policy Mandate",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="general"
      categoryTitle="General & Property Insurance"
      tagline="Protecting your home structure, household contents, vehicles, and tangible assets against natural catastrophes and perils."
      purpose="General insurance covers non-life assets against damage, theft, loss, and third-party liabilities. In India, the IRDAI-mandated 'Bharat Griha Raksha' policy provides standard, crystal-clear coverage for homes against earthquakes, floods, storms, and fires."
      whoShouldConsider={[
        "Homeowners seeking to protect their primary residential building and contents from natural disasters",
        "Tenants wishing to insure household electronics, furniture, and appliances against fire and burglary",
        "Vehicle owners requiring comprehensive own-damage and mandatory third-party liability cover"
      ]}
      keyBenefits={[
        "Complete building reconstruction cost reimbursement based on prevailing CPWD rates",
        "Automatic 20% home contents coverage without cumbersome itemized proof",
        "Temporary rental accommodation allowances while your damaged home is being repaired"
      ]}
      exclusions={[
        "Normal wear and tear, gradual deterioration, or structural degradation over time",
        "Loss caused by deliberate willful negligence or illegal alterations without municipal permits",
        "Damage to bullion, rare antiques, or high-value works of art exceeding specified sublimits"
      ]}
      pricingFactors={[
        "Carpet Area and Construction Quality (Pucca RCC frame vs non-standard brick masonry)",
        "Geographic Seismic Zone and Flood Risk Classification",
        "Selected Sum Insured for Building Structure and Contents"
      ]}
      questionsToAsk={[
        "Is the claim settlement based on reinstatement (reconstruction cost) or depreciated market value?",
        "Are boundary walls, solar panels, and water storage tanks covered under the structure?",
        "What is the excess/deductible applicable in the event of an earthquake or flood claim?"
      ]}
      products={products}
    />
  );
}
