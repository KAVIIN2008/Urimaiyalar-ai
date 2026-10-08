# ⚙️ Deterministic Eligibility Rules Engine
## Mathematical Rule Specification & Decision Trees

---

## 1. Engine Mission

The **Urimaiyalar Eligibility Rules Engine** (`src/services/eligibilityEngine.ts`) is a pure, side-effect-free, deterministic evaluation system. 

It guarantees that **no LLM or non-deterministic process decides whether an Indian business owner is eligible for government capital or interest subsidies**.

---

## 2. Input Contract (`UserEligibilityProfile`)

```typescript
export interface UserEligibilityProfile {
  age?: number;
  state?: string;
  district?: string;
  business_type?: 'MANUFACTURING' | 'SERVICE' | 'TRADING' | string;
  sector?: string;
  project_cost?: number;
  education?: 'BELOW_8TH' | '8TH_PASS' | '10TH_PASS' | '12TH_PASS' | 'DEGREE_DIPLOMA_ITI' | 'GRADUATE' | 'POST_GRADUATE' | string;
  entrepreneur_type?: 'FIRST_GENERATION' | 'EXISTING' | string;
  social_category?: 'GENERAL' | 'BC' | 'MBC' | 'SC' | 'ST' | 'OBC' | 'MINORITY' | string;
  annual_income?: number;
  residency_years?: number;
  existing_business?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'TRANSGENDER' | string;
  is_differently_abled?: boolean;
  is_ex_serviceman?: boolean;
  location_type?: 'RURAL' | 'URBAN' | string;
}
```

---

## 3. Evaluation Decision Tree

```
START: Evaluate Scheme(S, Profile)
│
├── 1. Check Age
│   ├── Missing? ──> Push to MissingFields[]
│   ├── Age < S.minAge ──> Push to FailedCriteria[] (Below age limit)
│   ├── Age > S.maxAge ──> Push to FailedCriteria[] (Exceeds age ceiling)
│   └── Passed ──> Push to MatchedCriteria[]
│
├── 2. Check Business Type (Sector Rules)
│   ├── Missing? ──> Push to MissingFields[]
│   ├── Profile.business_type NOT IN S.businessTypes ──> Push to FailedCriteria[]
│   └── Passed ──> Push to MatchedCriteria[]
│
├── 3. Check Project Cost Range
│   ├── Missing? ──> Push to MissingFields[]
│   ├── Cost < S.projectCostMin ──> Push to FailedCriteria[] (Below minimum limit)
│   ├── Cost > S.projectCostMax ──> Push to FailedCriteria[] (Exceeds ceiling)
│   └── Passed ──> Push to MatchedCriteria[]
│
├── 4. Check Educational Minimum
│   ├── S.educationRequired == 'ANY' ──> Pass
│   ├── Missing? ──> Push to MissingFields[]
│   ├── Level(Profile.education) < Level(S.minEducation) ──> Push to FailedCriteria[]
│   └── Passed ──> Push to MatchedCriteria[]
│
├── 5. Check State Residency (For State Schemes)
│   ├── Missing? ──> Push to MissingFields[]
│   ├── State NOT 'Tamil Nadu' ──> Push to FailedCriteria[]
│   └── Passed ──> Push to MatchedCriteria[]
│
├── 6. Check First-Generation Requirement (e.g., NEEDS)
│   ├── Missing? ──> Push to MissingFields[]
│   ├── Entrepreneur NOT 'FIRST_GENERATION' ──> Push to FailedCriteria[]
│   └── Passed ──> Push to MatchedCriteria[]
│
└── 7. Check Income Ceiling (e.g., UYEGP ₹5L cap)
    ├── S.maxIncome == null ──> Pass (No ceiling)
    ├── Missing? ──> Push to MissingFields[]
    ├── Income > S.maxIncome ──> Push to FailedCriteria[]
    └── Passed ──> Push to MatchedCriteria[]
```

---

## 4. Status Determination Matrix

| Failed Count | Missing Count | Matched Count | Output Status | Action |
| :---: | :---: | :---: | :--- | :--- |
| **> 0** | Any | Any | `NOT_ELIGIBLE` | Explains exact criteria failed |
| **0** | **> 0** | **0** | `INSUFFICIENT_INFORMATION` | Asks user for missing fields |
| **0** | **> 0** | **> 0** | `PARTIAL_MATCH` | Indicates met rules, asks missing |
| **0** | **0** | **> 0** | `MATCH` | Confirms eligibility, calculates grant |

---

## 5. Official Statutory Disclaimers

By design, the engine strictly forbids misleading promises of guaranteed approvals. Every response contains:

> **English:** *"You appear to meet the published eligibility criteria. Final approval is subject to the implementing authority/bank and applicable scheme rules."*

> **Tamil:** *"அரசு வெளியிட்டுள்ள வழிகாட்டுதல்களின்படி நீங்கள் தகுதியுடையவராகத் தெரிகிறீர்கள். இறுதி ஒப்புதல் சம்பந்தப்பட்ட அரசுத் துறை/வங்கியின் நேரடி பரிசீலனைக்கு உட்பட்டது."*
