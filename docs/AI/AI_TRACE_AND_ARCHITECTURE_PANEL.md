# ⚡ URIMAIYALAR OS — AI TRACE & ARCHITECTURE PANELS

## 1. Live AI Trace & Intelligence Panel (`/ai/trace`)
Accessible via:
- URL path: `http://localhost:3000/ai/trace` or hash `#ai-trace`
- Top Navbar: Click **"⚡ AI Trace"** (green glowing pill)
- Sidebar: Click **"Live AI Trace"** (Activity icon)
- AI Assistant: Click **"⚡ Live AI Trace"** header pill

### What the Judge Sees:
When a judge enters or clicks:
> *"Add ₹2,500 sales today"*

The UI renders the live step-by-step visual stepper and terminal outcome card:
```text
┌──────────────────────────────────────────────┐
│           URIMAIYALAR AI ENGINE              │
├──────────────────────────────────────────────┤
│ 🧠 LLM Gateway                               │
│ Provider: Groq LPU (openai/gpt-oss-120b)     │
│ Understanding natural-language request...    │
│ ✓ Intent: BUSINESS_ACTION                    │
│ ✓ Action: ADD_SALE                           │
│ ✓ Extracted: { amount: 2500, date: "today" } │
│                                              │
│ 🎯 Master Orchestrator                       │
│ ✓ Routed to: Sales Agent                     │
│                                              │
│ 📈 Domain Tool                               │
│ ✓ create_sale({ amount: 2500 })              │
│                                              │
│ 🗄️ Database (Prisma ORM)                     │
│ ✓ Transaction committed (ID: evt_prod_...)   │
│                                              │
│ 🛡️ Guardian Validator                        │
│ ✓ Transaction & Math Verified (100% Grounded)│
│                                              │
│ ✅ ₹2,500 sale added successfully            │
└──────────────────────────────────────────────┘
```

---

## 2. Visible AI Architecture & Model Transparency Page (`/ai/architecture`)
Accessible via:
- URL path: `http://localhost:3000/ai/architecture` or hash `#ai-architecture`
- Top Navbar: Click **"🧠 Architecture"**
- Sidebar: Click **"AI Architecture"** (Workflow icon)

### Contents of the Architecture Page:
1. **Interactive 10-Layer Execution Topology**:
   - `User Voice/Text -> LLM Gateway -> Intent Engine -> Orchestrator -> Specialist Agents -> Approved Tools -> Database -> Guardian Validator -> Response`.
2. **Judge Q&A & Model Transparency**:
   - **"Which LLM?"**:
     > *"We use an LLM through our centralized LLM Gateway. The application is provider-independent, so the reasoning layer uses our configured model provider while the rest of the architecture remains unchanged. In production, primary inference runs on Groq LPU with `openai/gpt-oss-120b` and `qwen/qwen3.8-27b` (sub-250ms latency), with automated circuit-breaker fallback to Google Gemini (`gemini-2.0-flash`) and local edge models (`llama3.2`)."*
   - **"Did you train this LLM?"**:
     > *"The current production prototype uses the base foundation model through our centralized LLM gateway. We have deliberately decoupled the model layer from the application so our Urimaiyalar domain model can be evaluated independently. We developed a 650-case Urimaiyalar domain dataset (covering Tamil/Tanglish code-switching, MSME business intents, and approved tool schemas) for our domain fine-tuning and LoRA adaptation pipeline."*
3. **Domain Fine-Tuning Pipeline Visualization**:
   - `Base Foundation Model -> 650-Case Golden Dataset -> Supervised Fine-Tuning / LoRA -> Urimaiyalar Domain Model -> Golden Benchmark Suite`.
4. **Architecture Comparison Table**:
   - Compares standard hallucination-prone chatbots against Urimaiyalar's grounded database-first architecture.
