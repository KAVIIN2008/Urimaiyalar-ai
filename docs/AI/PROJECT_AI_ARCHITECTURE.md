# URIMAIYALAR OS — PRODUCTION AI ARCHITECTURE SPECIFICATION
**Version 3.0 | Enterprise Production Standard**
*Author: Antigravity AI Architecture Team*

---

## 1. Executive Vision

Urimaiyalar OS (உரிமையாளர் OS) is an AI-powered business operating system designed specifically for micro, small, and medium enterprises (MSMEs) and kirana stores across India.

### Core Architectural Philosophy:
> **The LLM can reason, translate, and understand intent, but it is NEVER the source of truth for business facts or arithmetic calculations.**

| Layer | Responsibility | Source of Authority |
| :--- | :--- | :--- |
| **LLM Gateway** | Natural language reasoning, intent extraction, synthesis | Groq / Gemini / OpenAI / Local |
| **Database** | Immutable source of truth for all business entities | SQLite / PostgreSQL (Prisma ORM) |
| **Tools** | Parameterized actions & queries | Approved Backend Tool Registry |
| **Calculation Engine** | Deterministic mathematical operations | TypeScript Financial Engine |
| **RAG Knowledge Base** | Grounded external scheme & policy data | Trusted Vector/Document Stores |
| **Guardian / Validator**| Independent verification & safety enforcement | Deterministic Validation Rules |
| **Orchestrator** | Dynamic multi-agent routing & execution control | Master Agent Graph |

---

## 2. 10-Layer Production AI Topology

```text
                                 USER
                       (Text / Voice / 22 Languages)
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │      1. LLM GATEWAY           │
                    │ Multi-Provider Circuit Breaker│
                    │ (Groq / Gemini / Local / etc) │
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │     2. MODEL ROUTER           │
                    │ Fast / Reasoning / Structured │
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │   3. INTENT & ENTITY PARSER   │
                    │  Strict JSON Categorization   │
                    │  Confidence Engine (H / M / L)│
                    └──────────────┬────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
          [CONVERSATIONAL MODE]           [BUSINESS MODE]
                     │                           │
                     ▼                           ▼
            Conversation Handler      4. MASTER ORCHESTRATOR
         (Zero DB / Zero Agents)                 │
                     │             ┌─────────────┼─────────────┐
                     │             ▼             ▼             ▼
                     │          Finance        Sales       Inventory
                     │           Agent         Agent         Agent
                     │             │             │             │
                     │             ▼             ▼             ▼
                     │          Customer      Insights      RAG/Govt
                     │           Agent         Agent         Agent
                     │             │             │             │
                     │             └─────────────┼─────────────┘
                     │                           ▼
                     │                5. APPROVED TOOL REGISTRY
                     │                  (Zero Arbitrary SQL)
                     │                           │
                     │                           ▼
                     │              6. DETERMINISTIC CALCULATIONS
                     │                 (Profit = Rev - Exp)
                     │                           │
                     │                           ▼
                     │                 7. REAL DATABASE MUTATION
                     │                    (Prisma Transaction)
                     │                           │
                     │                           ▼
                     │                 8. EVENT AUTOMATION BUS
                     │                    (Memory & Alerts)
                     │                           │
                     │                           ▼
                     │                9. GUARDIAN / VALIDATOR
                     │                  (Post-Action Verify)
                     │                           │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                      10. FINAL GROUNDED RESPONSE
                         (Synthesized & Audited)
                                   │
                                   ▼
                                 USER
```

---

## 3. Strict Data Flow Rules

1. **No Arbitrary SQL:** The LLM is strictly prohibited from executing raw SQL statements. All database access must flow through strongly typed, parameterized tools in the backend tool registry.
2. **No Hallucinated Financials:** When a user asks "How much did I sell today?", the answer must be queried directly from `prisma.sale`. The LLM receives the numbers and only formats the presentation.
3. **No Unverified Actions:** When a user says "Add ₹500 sales", the LLM cannot confirm "Done" until the database transaction commits and the row is verified by the validator.
4. **Conversational Isolation:** Casual greetings ("Hi", "Hello", "Thanks", "Bye") are handled by the conversational layer without invoking business agents, querying the database, or displaying agent traces.
5. **Multi-Dialect Intent Normalization:** Voice commands in Tamil, English, and Tanglish (e.g., *"Innaiku 500 sales add pannu"*) normalize to a unified internal action `ADD_SALE(amount: 500, date: today)`.

---
*Certified for implementation in Urimaiyalar OS.*
