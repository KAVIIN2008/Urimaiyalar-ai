# 🧠 URIMAIYALAR OS — THREE-TIER MEMORY ARCHITECTURE

## Overview
Dynamic business state (such as customer balances, stock counts, and daily cash) should never be baked into LLM parameters or stuffed blindly into context windows. Urimaiyalar OS implements a structured three-tier memory architecture.

---

## 🏛️ The Three Memory Tiers

```text
                             LLM MEMORY
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
 1. CONVERSATION TIER     2. TRANSACTIONAL TIER    3. SEMANTIC TIER
   (Episodic Context)      (Structured Prisma DB)   (Vector Embeddings)
         │                        │                        │
  Last 4 - 6 turns         Shops, Products, Sales,  Government Schemes,
  Active session tokens    Customers, Expenses      MSME Manuals, FAQs
  Resolved pronouns        Real-time ACID state     Cosine similarity
```

---

### Tier 1: Conversational Memory (Episodic)
- **Scope**: Active session dialogue.
- **Window**: Sliding window of last 4-6 conversational turns to prevent context window bloat and reduce token latency.
- **Pronoun Resolution**: Tracks entity anchors across turns (e.g. Turn 1: *"How much does Suresh owe?"*, Turn 2: *"Send him a payment reminder"* -> resolves *"him"* to *"Suresh"*).

### Tier 2: Transactional Business Memory (Relational)
- **Scope**: The authoritative financial and inventory record of the business.
- **Storage**: Prisma SQLite / PostgreSQL (`Shop`, `Product`, `Sale`, `Customer`, `Expense`, `Supplier`).
- **Retrieval Mechanism**: Always queried on demand via `ToolRegistry`. The LLM never assumes stock balances from turn memory if the tool can read fresh transactional state.

### Tier 3: Semantic Knowledge Memory (Vector & RAG)
- **Scope**: Policies, government subsidy criteria, FAQs, GST rules, business regulations.
- **Storage**: `prisma.scheme` + vector representations with cosine similarity indexing.
- **Retrieval**: Triggered dynamically when intent router flags `GOVERNMENT_SCHEME_QUERY` or `KNOWLEDGE_QUERY`.

---

## 🛡️ Multi-Tenant Isolation
All queries into Tier 2 and Tier 3 memory are strictly scoped by `shopId`. A session authenticated for Shop A cannot read or mutate memory belonging to Shop B.
