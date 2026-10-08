# 💾 Government Scheme Data Model
## Prisma Schema & Relational Specifications

---

## 1. Relational ER Diagram

```mermaid
erDiagram
    Scheme ||--o{ SchemeSource : "has multiple versions/sources"
    Scheme ||--o{ SchemeAuditLog : "tracks immutable audit changes"

    Scheme {
        string id PK "Unique slug (e.g. needs, uyegp, pmegp)"
        string name "Short Scheme Acronym"
        string fullName "Full Official Name"
        string nameTa "Tamil Short Name"
        string fullNameTa "Tamil Full Name"
        string governmentLevel "STATE or CENTRAL"
        string department "Implementing Department"
        string category "CAPITAL_SUBSIDY, EMPLOYMENT_GENERATION, etc."
        string description "English Description"
        string descriptionTa "Tamil Description"
        string beneficiaryTypes "JSON string array"
        string businessTypes "JSON string array"
        float projectCostMin "Minimum Cost in INR"
        float projectCostMax "Maximum Cost in INR"
        float subsidyPercentage "Direct Subsidy %"
        float subsidyMaximum "Ceiling in INR"
        float interestSubvention "% Subvention on Bank Loan"
        string ageRules "JSON string object"
        string educationRules "JSON string object"
        string residencyRules "JSON string object"
        string incomeRules "JSON string object"
        string sectorRules "JSON string object"
        string specialCategoryRules "JSON string object"
        string applicationUrl "Official Portal URL"
        string officialSourceUrl "Official Authority Portal"
        string officialDocumentUrl "Gazette / PDF URL"
        string sourceAuthority "Implementing Agency"
        datetime lastVerifiedAt "Timestamp of last verification"
        datetime effectiveFrom "Effective Start Date"
        datetime effectiveTo "Expiry / Sunset Date"
        string status "ACTIVE, UNDER_REVIEW, ARCHIVED"
        datetime createdAt "Created Timestamp"
        datetime updatedAt "Updated Timestamp"
    }

    SchemeSource {
        string id PK "UUID"
        string schemeId FK "Foreign Key -> Scheme.id"
        string authority "Issuing Authority"
        string title "Document Title / G.O. Number"
        string documentUrl "PDF or Circular URL"
        string portalUrl "Portal Webpage URL"
        string version "Guideline Version"
        datetime effectiveDate "Gazette Date"
        datetime verifiedAt "Verification Timestamp"
        string status "VERIFIED, NEEDS_REVIEW, HISTORICAL"
        string notes "Verification notes"
    }

    SchemeAuditLog {
        string id PK "UUID"
        string schemeId FK "Foreign Key -> Scheme.id"
        string action "CREATE, UPDATE, VERIFY, ARCHIVE"
        string changedBy "Admin User Identifier"
        string changes "JSON String Diff of Modifications"
        string notes "Audit Rationale"
        datetime timestamp "Audit Timestamp"
    }
```

---

## 2. JSON Rule Schemas

### `ageRules` Schema
```json
{
  "min": 21,
  "maxGeneral": 35,
  "maxSpecial": 45,
  "specialCategories": ["WOMEN", "SC", "ST", "BC", "MBC", "MINORITY", "TRANSGENDER", "EX_SERVICEMEN", "DIFFERENTLY_ABLED"],
  "description": "Minimum 21 years; Maximum 35 for General, up to 45 for Special Categories."
}
```

### `educationRules` Schema
```json
{
  "minimum": "DEGREE_DIPLOMA_ITI",
  "description": "Degree, Diploma, ITI, or accredited Vocational Certificate."
}
```

### `residencyRules` Schema
```json
{
  "state": "Tamil Nadu",
  "minYears": 3,
  "description": "Resident of Tamil Nadu for minimum 3 years."
}
```

### `incomeRules` Schema
```json
{
  "maxAnnualFamilyIncome": 500000,
  "description": "Annual family income must not exceed ₹5,00,000 per annum."
}
```
