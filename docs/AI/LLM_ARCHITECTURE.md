# 🧠 URIMAIYALAR OS — PRODUCTION LLM ARCHITECTURE

## Executive Philosophy
> **"The model can reason, but it cannot invent the business. The database knows the business."**

In traditional chatbot architectures, LLMs are improperly trusted to recall financial balances, compute taxes, hallucinate inventory counts, and invent government schemes. In **Urimaiyalar OS**, we enforce an uncompromising engineering doctrine:

1. **LLM = Reasoning, Language Parsing & Intent Decomposition**
2. **Database = Sole Source of Truth (Prisma ORM over SQLite/PostgreSQL)**
3. **Tools = Approved Backend Actions (Zero Arbitrary SQL)**
4. **Code = Deterministic Financial Calculations & Auditing**
5. **RAG = Verified Evidence from Official Government & MSME Repositories**
6. **Validator = Guardian Verifying Math & Database Mutexes Before UI Emission**
7. **Master Orchestrator = Multi-Agent Task Routing**

---

## 🏗️ 10-Layer AI Topology

```text
                           USER
               (Voice / Text / 22 Languages)
                             │
                             ▼
                    ┌─────────────────┐
                    │   LLM GATEWAY   │
                    │  Circuit Breaker│
                    └────────┬────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │  MODEL ROUTER    │
                   │ Intent Classifier│
                   └─────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   CONVERSATIONAL STREAM              BUSINESS STREAM
   (Greetings, Small Talk,           (Queries, Actions, Analysis)
    Fast 8B / Local)                          │
            │                                 ▼
            │                        MASTER ORCHESTRATOR
            │                                 │
            │                ┌────────────────┼────────────────┐
            │                ▼                ▼                ▼
            │          Finance Agent     Sales Agent    Inventory Agent
            │                │                │                │
            │                └────────────────┼────────────────┘
            │                                 ▼
            │                          APPROVED TOOLS
            │                     (Deterministic Registry)
            │                                 │
            │                                 ▼
            │                           REAL DATABASE
            │                        (Prisma Transactions)
            │                                 │
            │                                 ▼
            │                         GUARDIAN VALIDATOR
            │                     (Math & Grounding Proof)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                    FINAL AUDITED ANSWER
                             │
                             ▼
                           USER
```

---

## ⚡ The Ten Production AI Layers

### Layer 1: Centralized LLM Gateway
Direct SDK calls to cloud providers are completely banned from component files. All calls traverse the singleton `LLMGateway` (`src/services/llm/LLMGateway.ts`). It handles automated failover across Groq, Google Gemini, OpenAI-compatible endpoints, and deterministic fallback.

### Layer 2: Model Router & Latency Optimization
Requests are categorized into distinct compute tiers:
- **Fast Tier (`instant`)**: Greetings, acknowledgments, casual queries (`<150ms`).
- **Structured Tier (`json`)**: Intent extraction, entity slot filling (`<300ms`).
- **Reasoning Tier (`deep`)**: Cross-period financial comparisons, inventory velocity (`<1200ms`).
- **Knowledge Tier (`rag`)**: Subsidies, MSME schemes, regulatory filings (`<800ms`).

### Layer 3: Deterministic Intent Engine
Separates casual conversational turns (`GREETING`, `FAREWELL`, `THANKS`) from actionable operations (`BUSINESS_ACTION`, `BUSINESS_QUERY`, `BUSINESS_ANALYSIS`, `GOVERNMENT_SCHEME_QUERY`). Casual turns never invoke database mutations.

### Layer 4: Multi-Agent Orchestrator
Dynamic routing delegates only to domain-specific agents (`Sales`, `Finance`, `Inventory`, `CRM`, `RAG`). Unused agents are never spun up.

### Layer 5: Approved Tool Registry (Zero SQL)
All mutations and reads are strictly restricted to 17 parameter-checked TypeScript methods (`ToolRegistry.ts`). Raw SQL and arbitrary schema commands are rejected with `400 Bad Request`.

### Layer 6: Grounded Database Truth
The LLM never generates numbers on its own. The backend reads real Prisma models, performs exact arithmetic in Node.js, and passes ground-truth tables into the synthesis prompt.

### Layer 7: Guardian Validator Engine
Before any answer is returned to the user or socket, `ValidatorEngine` verifies:
1. `TOOL_SUCCESS`: Did the tool return true?
2. `DATABASE_GROUNDING`: Does a real row ID exist?
3. `ARITHMETIC_ACCURACY`: Does `Revenue - Expenses == Profit`?
4. `RAG_VERIFICATION`: Are citations present in retrieved text?

### Layer 8: Confidence Banding
- `HIGH` (`>= 0.85`): Safe auto-execution.
- `MEDIUM` (`0.50 - 0.84`): Clarification requested.
- `LOW` (`< 0.50`): Mutation halted.

### Layer 9: Three-Tier Memory Architecture
- **Episodic**: Active conversation history.
- **Transactional**: Relational schema in Prisma SQLite/PostgreSQL.
- **Semantic**: Vector embeddings for schemes and documents.

### Layer 10: Full Audit Trail & Observability
Every tool execution, token count, latency measurement, and agent step is logged into `prisma.memory` and telemetry streams.
