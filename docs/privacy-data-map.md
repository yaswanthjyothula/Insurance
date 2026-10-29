# LifeSure AI - Privacy Data Mapping & DPDP Compliance Register

## 1. Statutory Alignment
- **Jurisdiction:** Republic of India
- **Applicable Statutes:** Digital Personal Data Protection Act, 2023 (DPDP Act), Information Technology Act 2000 & 2021 Intermediary Rules.
- **Classification:** Data Fiduciary (LifeSure AI Technologies Pvt. Ltd.)

## 2. Data Flow Inventory

| Data Element | Purpose of Processing | Storage Location | Retention Period | Third-Party Disclosure | Erasure Mechanism |
|--------------|------------------------|------------------|------------------|------------------------|-------------------|
| Age & Income | Capital Needs Calculation | Ephemeral Memory & Local Data Store | User Session or Account Deletion | None | One-Click Account Delete |
| Liabilities & Debts | Debt Immunization Engine | Ephemeral Memory | Account Lifetime | None | One-Click Account Delete |
| Policy Excerpts | Policy X-Ray Parsing | In-Memory Temporary Buffer | Session End (Not Persisted) | None | Immediate Drop |
| Vault Documents | Nominee Emergency Vault | AES-256 Local Encrypted Storage | User Controlled | None | Permanent DELETE Endpoint |
| Contact (Name/Email) | Advisor Video Booking | Bookings Store | 180 Days | Assigned Fiduciary Advisor only | User Request |

## 3. Data Subject Rights & Consent
1. **Notice & Purpose-Specific Consent:** Explicit consent collected prior to advisory booking or cloud storage.
2. **Right to Correction & Erasure:** Endpoints `/vault/documents/{id}` and `/scenarios/{id}` provide hard delete.
3. **No Commercial Profiling or Telemarketing:** Zero phone number sharing with external insurance brokers or cold-calling agencies.
