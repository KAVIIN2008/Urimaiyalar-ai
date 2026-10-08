# 🤖 URIMAIYALAR OS — MULTI-AGENT ARCHITECTURE

## Overview
Unlike standard chat systems where a single prompt handles every responsibility, Urimaiyalar OS implements a decoupled multi-agent architecture with dynamic topology execution.

---

## 👥 The Specialist Agents

| Agent Name | Primary Responsibility | Primary Tools | Execution Trigger |
| :--- | :--- | :--- | :--- |
| **Master Orchestrator** | Intent scoping, security filtering, execution DAG assembly | `routeIntent`, `planExecution` | All requests |
| **Sales Agent** | Daily/monthly revenue aggregation, transaction logging, top product analysis | `create_sale`, `get_daily_sales`, `get_weekly_sales` | Sales queries & mutations |
| **Finance Agent** | Profit calculation, cash flow tracking, expense logging | `get_revenue`, `get_expenses`, `get_profit`, `compare_financial_periods` | P&L & Cash flow queries |
| **Inventory Agent** | Stock levels, low-stock warnings, reorder suggestions, stock mutations | `add_stock`, `reduce_stock`, `get_inventory`, `get_low_stock` | Stock questions & updates |
| **Customer/CRM Agent** | Udhar/credit balance tracking, customer lookup, payment recording | `search_customer`, `record_payment`, `get_customer_dues` | Customer & Credit queries |
| **Knowledge/RAG Agent** | Government subsidies, MSME loan eligibility, official schemes | `search_schemes`, `evaluate_eligibility` | Scheme & policy questions |
| **Business Insights Agent** | Multi-period comparisons, profit drops, margin analysis | `compare_financial_periods` | Analytical "Why" questions |
| **Action Agent** | Atomic database commit coordinator via Prisma transactions | `ToolRegistry.executeTool` | All state mutations |
| **Guardian / Validator Agent**| Verification of database mutations, financial arithmetic, and citations | `ValidatorEngine.validate*` | Mandatory pre-response step |

---

## 🔄 Dynamic Execution Routing

### 1. Fast Conversational Path (Zero Agent Overhead)
```text
User: "Hi" / "வணக்கம்"
  ↓
Master Orchestrator (Intent = GREETING)
  ↓
Direct LLM Gateway (Conversational System Prompt)
  ↓
Response: "வணக்கம்! இன்று உங்கள் வணிகத்தில் என்ன பார்க்க வேண்டும்?"
(Latency: 95ms | Agents Executed: None)
```

### 2. Single Domain Action Path
```text
User: "Add 500 sales today"
  ↓
Master Orchestrator (Intent = BUSINESS_ACTION, Action = ADD_SALE, Amount = 500)
  ↓
Action Agent -> ToolRegistry.create_sale({ amount: 500 })
  ↓
Prisma DB -> prisma.sale.create() -> saleId: "evt_..."
  ↓
Guardian Validator -> Checks record existence & mutation receipt
  ↓
Sales Agent -> Formats confirmation with verified total
  ↓
User: "₹500 விற்பனை வெற்றிகரமாக சேர்க்கப்பட்டது."
(Latency: 280ms | Agents Executed: [Sales, Action, Guardian])
```

### 3. Complex Multi-Agent Analytical Path
```text
User: "Why did my profit decrease this month?"
  ↓
Master Orchestrator (Intent = BUSINESS_ANALYSIS)
  ↓
Parallel Execution:
  ├── Sales Agent: Reads monthly sales trajectory
  ├── Finance Agent: Reads expense line-items & rent/utility spikes
  └── Inventory Agent: Evaluates dead stock & margin erosion
  ↓
Insights Agent: Correlates data (e.g. "Revenue rose 5%, but Electricity + Supplier costs rose 32%")
  ↓
Guardian Validator: Recalculates exact differences mathematically
  ↓
Response: Comprehensive breakdown with verifiable numbers
(Latency: 950ms | Agents Executed: [Sales, Finance, Inventory, Insights, Guardian])
```
