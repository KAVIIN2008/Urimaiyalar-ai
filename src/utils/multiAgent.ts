import { initialGovernmentSchemes } from '../data/demoData';
import { generateAiCompletion } from '../lib/aiClient';

// Helper to get the language instruction block — placed at the TOP and BOTTOM of every prompt
function langBlock(uiLang: string): string {
  return `
⚠️ LANGUAGE INSTRUCTION (CRITICAL):
- Detect the language of the user's query.
- You MUST reply in the exact same language the user used in their query.
- If the user asks in English ("How much does Ramesh owe me?"), reply in English.
- If the user asks in Tamil ("ரமேஷ் கடன் எவ்வளவு?"), reply in Tamil.
- Do NOT randomly switch languages.
- You may use numbers and currency symbols (₹, %) freely.
- The UI language preference is '${uiLang}', but the QUERY language takes precedence for your response.
`;
}

const STYLE_INSTRUCTIONS = `
RESPONSE STYLE & FACTUAL ACCURACY (CRITICAL):
1. Start with a concise 1-line executive summary of the answer.
2. Use clean emoji headers: 📊 for data, 💡 for insights, 📈 for trends, ⚠️ for warnings, ✅ for confirmations.
3. Use bullet points (•) for listing data points. Keep each bullet concise.
4. Bold key numbers and metrics using **double asterisks**.
5. Keep the total response under 200 words. Be crisp, not verbose.
6. DATA ACCURACY: Never hallucinate or guess financial values. ONLY use the data provided in the LIVE BUSINESS DATA block.
7. If the exact data (e.g., a specific person's debt) is not present in the provided context, state clearly that you couldn't find records for it.
8. If multiple records match a name loosely, summarize them or ask for clarification.
`;

export class MultiAgentSystem {
  private db: any;
  private lang: string;
  private userRole: string;

  constructor(_aiClient?: any, dbState: any = {}, language: string = 'ta', userRole: string = 'retail') {
    this.db = dbState;
    this.lang = language;
    this.userRole = userRole;
  }

  // ==========================================
  // AGENT 1: SUPERVISOR (Router)
  // ==========================================
  private localRoute(query: string): string {
    const q = query.toLowerCase();
    // Finance keywords
    if (/profit|loss|sales?|revenue|income|expense|cost|debt|owe|credit|balance|udhar|ledger|laba|நஷ்டம்|விற்பனை|லாபம்|செலவு|கடன்|பாக்கி/.test(q)) {
      return 'FINANCE_AGENT';
    }
    // Inventory keywords
    if (/stock|inventory|item|product|unit|quantity|low|available|supply|சரக்கு|பொருள்|இருப்பு|மூட்டை|கிலோ/.test(q)) {
      return 'INVENTORY_AGENT';
    }
    // Policy keywords
    if (/scheme|loan|subsidy|government|msme|grant|policy|திட்டம்|மானியம்|கடன் வசதி/.test(q)) {
      return 'RAG_POLICY_AGENT';
    }
    return 'GENERAL_AGENT';
  }

  async routeQuery(query: string): Promise<string> {
    const prompt = `
    You are the Supervisor Agent for Urimaiyalar AI.
    Your job is to route the user's query to the correct specialized agent.
    
    Query: "${query}"
    
    Available Agents:
    1. FINANCE_AGENT: Handles questions about sales, profits, expenses, customer credit, debts, and ledger.
    2. INVENTORY_AGENT: Handles questions about product stock, low stock, missing items, and supply.
    3. RAG_POLICY_AGENT: Handles questions about government schemes, loans, MSME subsidies, and external rules.
    4. GENERAL_AGENT: For greetings or casual conversation.
    
    Respond ONLY with the exact name of the agent to route to (e.g. FINANCE_AGENT, INVENTORY_AGENT, RAG_POLICY_AGENT, GENERAL_AGENT).
    `;

    try {
      const res = await generateAiCompletion({
        prompt,
        systemPrompt: 'You are an intent router. Return ONLY the agent name.',
        temperature: 0.1,
        maxTokens: 20,
      });

      const route = (res.text || '').trim();
      if (['FINANCE_AGENT', 'INVENTORY_AGENT', 'RAG_POLICY_AGENT', 'GENERAL_AGENT'].includes(route)) {
        return route;
      }
      return this.localRoute(query);
    } catch {
      return this.localRoute(query);
    }
  }

  // ==========================================
  // AGENT 2: RAG POLICY AGENT
  // ==========================================
  private async runRagAgent(query: string): Promise<string> {
    const searchKeywords = query.toLowerCase().split(' ');
    
    const retrievedDocs = initialGovernmentSchemes.filter((scheme: any) => 
      searchKeywords.some(kw => scheme.name.toLowerCase().includes(kw) || scheme.description.toLowerCase().includes(kw))
    );

    const contextDocs = retrievedDocs.length > 0 
      ? retrievedDocs 
      : initialGovernmentSchemes;

    const contextString = contextDocs.map((d: any) => `Name: ${d.name}\nDetails: ${d.description}\nMax Subsidy: ${d.maxSubsidy}`).join('\n\n');

    const prompt = `
    ${langBlock(this.lang)}

    You are the RAG Policy Agent — an expert on Indian MSME government schemes and subsidies.
    Answer the user's query based ONLY on the retrieved documents below.
    If the answer is not in the documents, say you cannot find it in the policy database.
    
    RETRIEVED DOCUMENTS:
    ${contextString}
    
    USER QUERY: "${query}"

    ${STYLE_INSTRUCTIONS}
    
    ${langBlock(this.lang)}
    `;

    try {
      const res = await generateAiCompletion({
        prompt,
        systemPrompt: 'You are the RAG Policy Agent for Indian MSME government schemes and subsidies.',
        temperature: 0.2,
        maxTokens: 350,
      });

      return res.text || 'Unable to retrieve policy data.';
    } catch {
      return 'Unable to retrieve policy data at this moment.';
    }
  }

  // ==========================================
  // AGENT 3: FINANCE AGENT (Tools + Data)
  // ==========================================
  private async runFinanceAgent(query: string): Promise<string> {
    console.log(`[CHAT] User query: "${query}"`);

    // Phase 1: Intent & Entity Extraction
    const extractionPrompt = `
      Extract the intent and entities from the following business query.
      Respond ONLY with a valid JSON object, no markdown, no backticks, no explanations.
      {
        "intent": "PROFIT" | "SALES" | "EXPENSES" | "DEBTS" | "UNKNOWN",
        "timeframe": "TODAY" | "THIS_MONTH" | "THIS_YEAR" | "ALL_TIME",
        "entityName": "string or null (e.g. Ramesh)"
      }
      Query: "${query}"
    `;

    let extractionData = { intent: "UNKNOWN", timeframe: "ALL_TIME", entityName: null };
    try {
      const res = await generateAiCompletion({
        prompt: extractionPrompt,
        temperature: 0.0,
        maxTokens: 80,
        jsonMode: true,
      });
      const text = (res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      extractionData = JSON.parse(text);
      console.log(`[CHAT] Detected intent: ${extractionData.intent} (${res.provider}/${res.model} in ${res.latencyMs}ms)`);
    } catch {
      // Deterministic keyword fallback
      const q = query.toLowerCase();
      if (/இன்று|today/.test(q)) extractionData.timeframe = 'TODAY';
      else if (/மாதம்|month/.test(q)) extractionData.timeframe = 'THIS_MONTH';
      
      const matchName = (this.db.customers || []).find((c: any) =>
        query.toLowerCase().includes((c.name || '').toLowerCase())
      );
      if (matchName) extractionData.entityName = matchName.name;
    }

    // Phase 2: Deterministic Calculation
    console.log(`[CHAT] Calculation Phase...`);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let startDate = new Date(0); // ALL_TIME
    if (extractionData.timeframe === 'TODAY') startDate = startOfToday;
    if (extractionData.timeframe === 'THIS_MONTH') startDate = startOfMonth;
    if (extractionData.timeframe === 'THIS_YEAR') startDate = startOfYear;

    // Filter database
    const filteredSales = (this.db.sales || []).filter((s: any) => new Date(s.date || s.createdAt || 0) >= startDate);
    const filteredExpenses = (this.db.expenses || []).filter((e: any) => new Date(e.date || e.createdAt || 0) >= startDate);
    const filteredPurchases = (this.db.purchases || []).filter((p: any) => new Date(p.date || p.createdAt || 0) >= startDate);

    const totalSales = filteredSales.reduce((sum: number, s: any) => sum + Number(s.total ?? s.totalAmount ?? 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);
    const totalPurchases = filteredPurchases.reduce((sum: number, p: any) => sum + Number(p.total ?? p.totalAmount ?? 0), 0);

    const netProfit = totalSales - (totalExpenses + totalPurchases);

    // Debts & Customer Ledger
    const allCustomers = this.db.customers || [];
    const totalCustomerDebts = allCustomers.reduce((sum: number, c: any) => sum + Number(c.outstandingBalance || 0), 0);

    let targetCustomerName = null;
    let targetCustomerDebt = null;

    if (extractionData.entityName) {
      const searchTarget = String(extractionData.entityName).toLowerCase();
      const matched = allCustomers.find((c: any) => 
        (c.name && c.name.toLowerCase().includes(searchTarget)) ||
        (c.nameTa && c.nameTa.toLowerCase().includes(searchTarget))
      );
      if (matched) {
        targetCustomerName = matched.name;
        targetCustomerDebt = matched.outstandingBalance || 0;
      }
    }

    const calculatedData = {
      period: extractionData.timeframe,
      revenue: totalSales,
      expenses: totalExpenses + totalPurchases,
      profit: netProfit,
      searchedCustomer: extractionData.entityName,
      foundCustomer: targetCustomerName,
      specificCustomerDebt: targetCustomerDebt,
      totalOutstandingBusinessDebt: totalCustomerDebts,
    };

    console.log(`[CHAT] Database result:`, JSON.stringify(calculatedData));

    // Phase 3: Response Generation
    const prompt = `
    ${langBlock(this.lang)}

    You are the Finance & Ledger Agent advising a Retail Business Owner in Tamil Nadu.
    
    The user asked: "${query}"
    
    Here is the exact, deterministic calculated data for their query:
    ${JSON.stringify(calculatedData, null, 2)}
    
    ${STYLE_INSTRUCTIONS}

    ${langBlock(this.lang)}
    `;

    const period = calculatedData.period === 'TODAY' ? 'Today' : calculatedData.period === 'THIS_MONTH' ? 'This Month' : calculatedData.period === 'THIS_YEAR' ? 'This Year' : 'All Time';
    let fallbackAnswer = '';
    if (calculatedData.specificCustomerDebt !== null) {
      fallbackAnswer = calculatedData.foundCustomer
        ? `📊 **${calculatedData.foundCustomer}** owes you **₹${calculatedData.specificCustomerDebt.toLocaleString()}**.`
        : `⚠️ No customer found matching "${calculatedData.searchedCustomer}" in your records.`;
    } else {
      fallbackAnswer = `📊 **${period} Summary**\n• Revenue: **₹${calculatedData.revenue.toLocaleString()}**\n• Expenses: **₹${calculatedData.expenses.toLocaleString()}**\n• Net Profit: **₹${calculatedData.profit.toLocaleString()}**${calculatedData.totalOutstandingBusinessDebt > 0 ? `\n• Outstanding Customer Debts: **₹${calculatedData.totalOutstandingBusinessDebt.toLocaleString()}**` : ''}`;
    }

    try {
      const res = await generateAiCompletion({
        prompt,
        systemPrompt: 'You are the Finance & Ledger Agent. Answer accurately in the user language with emojis.',
        temperature: 0.1,
        maxTokens: 250,
      });

      return res.text || fallbackAnswer;
    } catch {
      return fallbackAnswer;
    }
  }

  // ==========================================
  // AGENT 4: INVENTORY AGENT
  // ==========================================
  private async runInventoryAgent(query: string): Promise<string> {
    const allProducts = (this.db.products || []).map((p: any) => 
      `${p.name}: ${p.currentStock} ${p.unit} in stock (min: ${p.minStock}, sell ₹${p.sellingPrice}, buy ₹${p.costPrice || p.purchasePrice})`
    ).join('\n');

    const lowStock = (this.db.products || []).filter((p: any) => p.currentStock <= p.minStock).map((p: any) => 
      `⚠️ ${p.name}: only ${p.currentStock} ${p.unit} left (minimum needed: ${p.minStock})`
    ).join('\n');

    const outOfStock = (this.db.products || []).filter((p: any) => p.currentStock === 0).map((p: any) => p.name).join(', ');
    
    const prompt = `
    ${langBlock(this.lang)}

    You are the Inventory Intelligence Agent — a supply chain expert for retail and wholesale businesses.
    
    LIVE INVENTORY DATA (real-time):
    
    📦 All Products (${(this.db.products || []).length} items):
    ${allProducts || 'No products in inventory'}
    
    ⚠️ Low Stock Alerts:
    ${lowStock || '✅ All items are sufficiently stocked.'}
    
    🚫 Out of Stock: ${outOfStock || 'None'}
    
    USER QUERY: "${query}"
    
    ${STYLE_INSTRUCTIONS}

    ${langBlock(this.lang)}
    `;

    try {
      const res = await generateAiCompletion({
        prompt,
        systemPrompt: 'You are the Inventory Intelligence Agent. Answer clearly and concisely.',
        temperature: 0.1,
        maxTokens: 250,
      });

      return res.text || 'Unable to retrieve inventory data.';
    } catch {
      return 'Unable to retrieve inventory data.';
    }
  }

  // ==========================================
  // MASTER EXECUTION PIPELINE
  // ==========================================
  public async execute(query: string): Promise<{ answer: string; agentUsed: string }> {
    console.log(`[MultiAgent] Supervising query: "${query}"`);
    const routedAgent = await this.routeQuery(query);
    console.log(`[MultiAgent] Routed to: ${routedAgent}`);

    let answer = '';
    
    switch (true) {
      case routedAgent.includes('RAG_POLICY_AGENT'):
        answer = await this.runRagAgent(query);
        break;
      case routedAgent.includes('FINANCE_AGENT'):
        answer = await this.runFinanceAgent(query);
        break;
      case routedAgent.includes('INVENTORY_AGENT'):
        answer = await this.runInventoryAgent(query);
        break;
      default:
        answer = this.lang === 'ta'
          ? `வணக்கம்! நான் உரிமையாளர் AI (Groq & Qwen இயங்கும் அதிவேக உதவியாளர்). உங்கள் வணிகம் பற்றி கேளுங்கள் — விற்பனை, லாபம், சரக்கு இருப்பு, கடன் பாக்கி எல்லாம் உடனடி பதிலளிப்பேன்.`
          : `Hello! I am Urimaiyalar AI (powered by ultra-fast Groq LPU). Ask me about your business — sales, profits, inventory, customer debts — I will answer instantly.`;
    }

    return { answer, agentUsed: routedAgent };
  }
}
