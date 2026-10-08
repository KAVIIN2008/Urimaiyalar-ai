# 🛡️ URIMAIYALAR OS — GUARDIAN VALIDATION ENGINE

## Philosophy
In Urimaiyalar OS, an LLM's response is treated as an **untrusted draft** until verified by the deterministic `ValidatorEngine` (`src/services/guardian/validatorEngine.ts`).

```text
               LLM Draft Answer
                      │
                      ▼
            ┌───────────────────┐
            │  GUARDIAN ENGINE  │
            └─────────┬─────────┘
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
 Action Check    Math Check       RAG Check
(Did DB mutate?)(Does Rev-Exp=P?)(Are sources cited?)
      │               │               │
      └───────────────┼───────────────┘
                      ▼
             All 3 Passes?
              ├── YES ──> Emit to UI
              └── NO  ──> Sanitize / Refuse / Auto-Correct
```

---

## 🔍 Validation Subsystems

### 1. Action Execution Verification (`validateActionExecution`)
- **Requirement**: No "Sale recorded" or "Stock updated" confirmation may be presented to the user unless the database mutation returns a concrete ID.
- **Verification Criteria**:
  - `toolResult.success === true`
  - Write tools must contain verified entity IDs (`saleId`, `productId`, `paymentId`).
  - Read tools must contain non-null structured data.
- **Flags**: `ACTION_FAILED`, `MISSING_DB_PROOF`.

### 2. Financial Arithmetic & Grounding (`validateFinancialGrounding`)
- **Requirement**: The LLM must not invent financial metrics or claim conflicting totals.
- **Verification Criteria**:
  - Extracts all currency figures (`₹...`) from the generated response.
  - Matches extracted figures against the ground-truth tool payload (`toolResults.data`).
  - Verifies equation: $\text{Profit} = \text{Revenue} - \text{Expenses}$.
- **Flags**: `UNGROUNDED_FINANCIAL_CLAIM`, `ARITHMETIC_INCONSISTENCY`.
- **Auto-Correction**: If a hallucinated figure is detected, the validator overrides the draft with the ground-truth data from the database.

### 3. RAG Grounding Verification (`validateRAGGrounding`)
- **Requirement**: Every claimed government subsidy percentage or eligibility criteria must cite an official source.
- **Verification Criteria**:
  - Evaluates whether the generated response references the verified documents retrieved by the RAG agent.
  - Rejects answers that invent unsupported government schemes.
- **Flags**: `HALLUCINATED_CITATION`, `UNVERIFIED_POLICY_CLAIM`.

---

## 🚦 Validation Report Contract
```typescript
export interface ValidationReport {
  isValid: boolean;
  confidenceScore: number;
  checks: Array<{ name: string; passed: boolean; details: string }>;
  sanitizedAnswer?: string;
  flags: string[];
}
```
If `isValid === false`, the endpoint logs an alert to telemetry and returns a clean, verified message rather than a hallucinated draft.
