// Resources content. Every regulatory figure here was checked against IRDAI primary documents
// (Master Circular on Protection of Policyholders' Interests 2024, Master Circular on Health
// Insurance 2024, Insurance Ombudsman Rules 2017 as amended 9 Nov 2023). Checked 29 Oct 2026.
// Anything we could not confirm from an official text is worded as "check your policy" rather than stated as fact.

export type Source = { label: string; href: string };

export const SOURCES = {
  ppi: { label: "IRDAI Master Circular on Protection of Policyholders' Interests, 2024", href: "https://irdai.gov.in/document-detail?documentId=5625747" },
  health: { label: "IRDAI Master Circular on Health Insurance Business, 2024", href: "https://irdai.gov.in/documents/37343/365525/" },
  ombudsman: { label: "Insurance Ombudsman Rules 2017 (as amended 9 Nov 2023)", href: "https://www.cioins.co.in/notification/Insurance%20Ombudsman%20Rules,%202017(%20as%20amended%20till%2009.11.2023).pdf" },
  s45: { label: "IRDAI circular on Section 45, 28 Oct 2015", href: "https://irdai.gov.in/document-detail?documentId=379913" },
  bgr: { label: "IRDAI standard product guidelines: Bharat Griha Raksha", href: "https://irdai.gov.in/documents/37343/0/Annexure-I-Bharat+Griha+Raksha.pdf/f6742d71-8194-333f-1409-2c8c652a0964" },
  bima: { label: "IRDAI Bima Bharosa (grievance portal)", href: "https://bimabharosa.irdai.gov.in/" },
  cio: { label: "Council for Insurance Ombudsmen: file a complaint", href: "https://cioins.co.in/Complaint/Online" },
  lifeFaq: { label: "IRDAI: life insurance FAQs", href: "https://irdai.gov.in/life3" },
  lifeList: { label: "IRDAI: list of life insurers", href: "https://irdai.gov.in/list-of-life-insurers1" },
} satisfies Record<string, Source>;

export type GlossaryTerm = { term: string; group: "Choosing an insurer" | "Policy basics" | "Claims and legal" | "Health" | "Riders"; meaning: string; why: string; source?: Source };

export const GLOSSARY: GlossaryTerm[] = [
  { term: "Claim settlement ratio", group: "Choosing an insurer", meaning: "Claims an insurer paid, as a share of claims it received in a year. Insurers publish it by number of claims and sometimes by amount.", why: "Check the year and whether it is by number or by amount before comparing two insurers. A single year says little, so look at several." },
  { term: "Solvency ratio", group: "Choosing an insurer", meaning: "How much capital an insurer holds compared with what regulation requires it to hold against its liabilities. IRDAI's minimum is 1.5 times (150%).", why: "A higher ratio means a bigger buffer. Anything above 1.5 meets the rule.", source: SOURCES.lifeFaq },
  { term: "Sum assured", group: "Policy basics", meaning: "The amount the insurer pays if the insured event happens, such as death on a term plan.", why: "This is the number your family actually receives. Size it to their needs, not to the premium." },
  { term: "Policy term and premium payment term", group: "Policy basics", meaning: "The term is how long cover lasts. The payment term is how long you pay. They can differ, for example 'pay for 10 years, covered for 30'.", why: "Limited-pay plans cost more per year but finish payment earlier." },
  { term: "Free-look period", group: "Policy basics", meaning: "A window after you receive the policy in which you can return it and get a refund, after deductions for stamp duty and any medical costs. For policies of one year or longer it is 30 days from receipt, for both life and health.", why: "Read the policy wording in this window. Cancelling later costs you.", source: SOURCES.ppi },
  { term: "Grace period", group: "Policy basics", meaning: "Extra days after a premium due date during which the policy stays in force even if you have not paid. Its length depends on the plan and payment mode.", why: "Your policy schedule states it. Cover usually continues through the grace period." },
  { term: "Nominee", group: "Claims and legal", meaning: "The person you name to receive the claim money. You can name more than one with percentage shares. If a nominee is a minor, an appointee must be named. You can change the nominee during the policy term.", why: "A claim cannot be paid without a nominee or legal heir. Keep it current after marriage or a birth.", source: SOURCES.ppi },
  { term: "Assignment", group: "Claims and legal", meaning: "Transferring your rights in a policy to another party, for example to a bank as security for a loan.", why: "After assignment the lender has first claim up to the loan balance. Check this before you rely on the payout for family expenses." },
  { term: "Section 45 (Insurance Act, 1938)", group: "Claims and legal", meaning: "After the 2015 amendment, an insurer has three years from issue, commencement of risk, revival or rider date to call a life policy in question for misstatement or suppression of a material fact that does not amount to fraud. IRDAI's circular states no life policy can be contested on any ground after three years, and no claim can be repudiated without legally tenable evidence.", why: "Disclose everything truthfully at the proposal stage. After three years, a claim cannot be rejected over innocent errors.", source: SOURCES.s45 },
  { term: "Moratorium (health)", group: "Health", meaning: "After 60 months of continuous health cover, the insurer cannot contest the policy or reject a claim except for established fraud. Cover carried over through porting counts toward the 60 months.", why: "Keep cover continuous. Port rather than let a policy lapse.", source: SOURCES.health },
  { term: "Pre-existing disease (PED) waiting period", group: "Health", meaning: "The period before illnesses you already had are covered. Recent rules shortened the maximum from 48 to 36 months, but the exact period is whatever your policy states.", why: "Declare every existing condition. Compare waiting periods between policies before buying." },
  { term: "Cashless claim", group: "Health", meaning: "The insurer pays the network hospital directly. IRDAI rules require a decision on a cashless request immediately and not later than one hour, and final discharge authorisation within three hours.", why: "If a hospital delays beyond three hours, extra charges are for the insurer to bear.", source: SOURCES.health },
  { term: "Room rent limit and proportionate deduction", group: "Health", meaning: "Some policies cap the room rent they pay. If you take a pricier room, other charges linked to room category can be cut in proportion.", why: "A policy with no room rent cap avoids this. Check the clause before you buy." },
  { term: "Waiver of premium rider", group: "Riders", meaning: "If a covered event such as disability or a listed critical illness happens, future premiums are waived and cover continues.", why: "Cheap relative to its value for a sole earner. Check which events trigger it." },
  { term: "Critical illness rider", group: "Riders", meaning: "Pays a lump sum on first diagnosis of an illness listed in the policy, whether or not you are hospitalised.", why: "Only listed illnesses count, and each has a definition. Read the list." },
  { term: "Accidental death rider", group: "Riders", meaning: "Pays an extra sum if death is caused by an accident, on top of the base sum assured.", why: "It pays only for accidents. It does not replace adequate base cover." },
  { term: "Bharat Griha Raksha", group: "Policy basics", meaning: "IRDAI's standard home insurance product, mandatory for general insurers selling fire and allied perils cover from 1 April 2021. Wording is uniform across insurers. It covers home building and/or contents against 14 listed events, including fire, natural calamities, burst pipes and theft after an insured event.", why: "You can compare insurers on price and service, because the cover wording is the same.", source: SOURCES.bgr },
];

export type ClaimStep = { title: string; body: string };

export const CLAIM_STEPS: ClaimStep[] = [
  { title: "Tell the insurer", body: "Intimate the death to the insurer by phone, branch, email or its website, and note the date. The settlement clock runs from the date of intimation. A claim cannot be closed or rejected only because intimation was late." },
  { title: "Submit the claim form and documents", body: "At minimum: the claim form and the death certificate. Insurers add documents by case. For an accident, expect an FIR and post-mortem report. For a death in hospital, the discharge summary. Each insurer must list the documents it needs in the policy document and on its website. A claim cannot be rejected or closed for want of documents." },
  { title: "Follow the timeline", body: "IRDAI's 2024 master circular sets 15 days from intimation for a death claim that needs no investigation, and 45 days where an investigation is needed. Late payment carries interest at bank rate plus 2%, paid without you asking, counted from the date of intimation." },
  { title: "If you disagree, complain to the insurer in writing", body: "The insurer must resolve a complaint within 14 days and give reasons, tied to the policy terms, if it rejects. File through the insurer, and track it on IRDAI's Bima Bharosa portal." },
  { title: "Then go to the Insurance Ombudsman", body: "Free of charge. Eligible if the insurer rejected your complaint, did not reply within one month, or you are unhappy with the answer. File within one year of that. The Ombudsman can award up to ₹50 lakh including expenses, in general within three months of receiving everything needed. The insurer must comply within 30 days or face ₹5,000 per day after that, unless it appeals." },
];

export const CLAIM_DOCS = [
  { group: "Always", items: ["Claim form, filled and signed by the nominee", "Death certificate (issued by the local authority)"] },
  { group: "If the death was an accident", items: ["FIR", "Post-mortem report"] },
  { group: "If the person died in hospital", items: ["Hospital discharge summary or death summary"] },
  { group: "Commonly asked by insurers", items: ["Original policy document", "Nominee photo ID and address proof", "Bank account details for the payout"] },
];
export const CLAIM_DOCS_NOTE = "The first three groups come from IRDAI's circular, which says the list is not exhaustive. The last group is common insurer practice. Your insurer must publish its exact list, so confirm with them.";

export type Article = { id: string; title: string; kind: string; minutes: number; intro: string; points: string[]; tool?: { label: string; href: string }; sources: Source[] };

export const ARTICLES: Article[] = [
  {
    id: "how-much-cover",
    title: "How much life cover do you need?",
    kind: "Term life",
    minutes: 3,
    intro: "A flat multiple of income is a quick start, not an answer. What matters is what your family would have to pay for, and for how long, if your income stopped.",
    points: [
      "Add up what has to be paid: outstanding loans, years of household expenses, and future goals such as a child's education.",
      "Subtract what already exists: savings, investments, and any cover you hold, including employer cover that ends if you leave the job.",
      "Allow for inflation. A cost today is higher when it falls due, so keep the planning assumptions modest and revisit them when your life changes.",
      "Revisit cover at big events: marriage, a child, a new loan, a large rise in income.",
    ],
    tool: { label: "Estimate your cover gap", href: "/tools/life-cover-calculator" },
    sources: [],
  },
  {
    id: "disclosure",
    title: "Disclose honestly: Section 45 and your family's claim",
    kind: "Claims and law",
    minutes: 3,
    intro: "Insurers can question a life policy only for a limited time. That makes full, truthful answers at the proposal stage the best protection you can give your nominee.",
    points: [
      "Under Section 45 as amended in 2015, an insurer has three years to call a policy in question for misstating or hiding a material fact that is not fraud. The clock runs from the latest of issue, start of risk, revival or rider date.",
      "IRDAI's circular says no life policy can be contested on any ground after those three years, and no claim can be rejected without legally tenable evidence.",
      "Inside the three years, a claim can be challenged. Declare health history, smoking, alcohol, occupation and other policies exactly as asked.",
      "If the insurer calls the policy in question in time, it must refund the premiums collected.",
    ],
    sources: [SOURCES.s45, SOURCES.ppi],
  },
  {
    id: "term-vs-trop",
    title: "Term plan or return-of-premium plan?",
    kind: "Term life",
    minutes: 3,
    intro: "A return-of-premium (ROP) plan costs more because you are also buying a refund. Compare before you decide.",
    points: [
      "Ask the insurer for both quotes for the same cover, age and term. The premium for ROP is higher by an amount you can see directly.",
      "Ask what the refund is worth: the money returned decades later buys less than it does today.",
      "A cheaper pure term plan frees money you can invest yourself. Whether that works for you depends on whether you actually invest it.",
      "Whichever you choose, the death cover is the point. Do not shrink the cover to afford a refund feature.",
    ],
    tool: { label: "Compare real term plans", href: "/products" },
    sources: [],
  },
  {
    id: "riders",
    title: "Which riders are worth paying for",
    kind: "Term life",
    minutes: 3,
    intro: "Riders add cost. Decide by whether the event would damage your family's finances in a way your base cover does not handle.",
    points: [
      "Waiver of premium keeps cover alive if you can no longer pay. It matters most for sole earners.",
      "A critical illness rider pays a lump sum on diagnosis of a listed illness. Read the list and the definitions, because only listed conditions pay.",
      "An accidental death rider pays extra for accidents only. It is an add-on, not a substitute for enough base cover.",
      "Ask each insurer for the rider's exact premium and wording before choosing.",
    ],
    sources: [],
  },
  {
    id: "health-basics",
    title: "Reading a health policy before you buy",
    kind: "Health",
    minutes: 4,
    intro: "Most health claim disputes come from clauses people did not read. These are the ones to check first.",
    points: [
      "Waiting periods: how long before pre-existing diseases and specified illnesses are covered. Ask for the exact months.",
      "Room rent limits: a cap can lead to proportionate cuts in other charges. A policy without a cap avoids this.",
      "Moratorium: after 60 months of continuous cover the insurer cannot contest the policy except for established fraud. Cover carried over when you port counts.",
      "Cashless: IRDAI requires a cashless decision within one hour and discharge authorisation within three hours.",
      "Free-look: 30 days from receipt of the policy for policies of a year or more.",
    ],
    sources: [SOURCES.health],
  },
  {
    id: "home-cover",
    title: "Bharat Griha Raksha: one home policy, same terms everywhere",
    kind: "General insurance",
    minutes: 3,
    intro: "IRDAI made the home policy standard in 2021, so the cover wording is the same at every insurer. You compare price and service, not fine print.",
    points: [
      "It covers the building (on a reinstatement basis) and/or contents. You must take at least one.",
      "It lists 14 insured events, including fire, natural calamities, burst or overflowing water tanks and pipes, and theft within 7 days of an insured event.",
      "Contents are included automatically at 20% of the building sum insured, up to ₹10 lakh. Architect, surveyor and engineer fees are covered up to 5% of the claim, and debris removal up to 2%.",
      "Terms can run up to 10 years. Sum insured rises 10% a year on multi-year policies.",
      "Optional extras include valuables on an agreed-value basis and a ₹5 lakh personal accident cover.",
    ],
    sources: [SOURCES.bgr],
  },
];

export const GUIDES = [
  { title: "First policy checklist", intro: "For someone buying life cover for the first time.", steps: ["Work out your cover need with the life cover calculator", "Get quotes from several insurers for the same cover and term", "Answer health and lifestyle questions truthfully", "Check the claim settlement ratio, its year and its basis", "Name a nominee, and an appointee if the nominee is a minor", "Read the policy in the 30-day free-look window"], tool: { label: "Open the cover calculator", href: "/tools/life-cover-calculator" } },
  { title: "Loans and life cover", intro: "For borrowers who want the family protected from the debt.", steps: ["List every loan and its balance", "Size cover to include the loan plus family living costs", "If a lender takes an assignment, know that it gets paid first", "Review cover each time you take a new loan"], tool: { label: "Check your protection gap", href: "/tools/protection-gap" } },
  { title: "Get your family claim-ready", intro: "So a nominee can act quickly at a hard moment.", steps: ["Tell your nominee which policies exist and with whom", "Keep policy numbers and insurer contact details in one place", "Keep nominee details up to date after life events", "Share the claim steps on this site with your family"], tool: { label: "Read the claim guide", href: "/resources/claims" } },
];
