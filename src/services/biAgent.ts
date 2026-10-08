import { prisma } from '../lib/db';
import { initialGovernmentSchemes } from '../data/demoData';
import { generateAiCompletion } from '../lib/aiClient';
import { searchSchemes } from './schemesDbService';

// ============================================================================
// 1. DATA TOOLS IMPLEMENTATION (Strict Prisma / Database Queries)
// ============================================================================

export interface DateFilter {
  startDate: Date;
  endDate: Date;
  label: string;
}

function parseTimeframe(timeframe?: string): DateFilter {
  const now = new Date();
  const tf = (timeframe || 'THIS_MONTH').toUpperCase();

  if (tf === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { startDate: start, endDate: end, label: 'Today (இன்று)' };
  }

  if (tf === 'YESTERDAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    return { startDate: start, endDate: end, label: 'Yesterday (நேற்று)' };
  }

  if (tf === 'LAST_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { startDate: start, endDate: end, label: 'Last Month (கடந்த மாதம்)' };
  }

  if (tf === 'THIS_YEAR') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return { startDate: start, endDate: end, label: 'This Year (இந்த ஆண்டு)' };
  }

  // Default: THIS_MONTH
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start, endDate: end, label: 'This Month (இந்த மாதம்)' };
}

export const BITools = {
  /**
   * Tool: get_daily_sales
   * Retrieves today's sales metrics, order count, and payment mode split
   */
  async get_daily_sales() {
    const { startDate, endDate, label } = parseTimeframe('TODAY');
    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { items: true },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const cashSales = sales.filter((s) => s.paymentType === 'cash').reduce((sum, s) => sum + Number(s.total || 0), 0);
    const upiSales = sales.filter((s) => s.paymentType === 'upi').reduce((sum, s) => sum + Number(s.total || 0), 0);
    const creditSales = sales.filter((s) => s.paymentType === 'credit').reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);

    const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s) => {
      s.items?.forEach((item) => {
        const key = item.productId || item.productName;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productSalesMap[key].qty += Number(item.quantity || 1);
        productSalesMap[key].revenue += Number(item.total || 0);
      });
    });

    const topItems = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return {
      period: label,
      totalSales: totalRevenue,
      billCount: sales.length,
      cashReceived: cashSales,
      upiReceived: upiSales,
      newCreditGiven: creditSales,
      topSellingItemsToday: topItems,
      hasRecords: sales.length > 0,
    };
  },

  /**
   * Tool: get_monthly_sales
   * Retrieves monthly sales with month-over-month comparison
   */
  async get_monthly_sales() {
    const thisMonth = parseTimeframe('THIS_MONTH');
    const lastMonth = parseTimeframe('LAST_MONTH');

    const [currentSales, prevSales] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: thisMonth.startDate, lte: thisMonth.endDate } },
        include: { items: true },
      }),
      prisma.sale.findMany({
        where: { date: { gte: lastMonth.startDate, lte: lastMonth.endDate } },
      }),
    ]);

    const currentRevenue = currentSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const prevRevenue = prevSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

    let growthPercent = 0;
    if (prevRevenue > 0) {
      growthPercent = Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
    }

    return {
      currentMonthLabel: thisMonth.label,
      currentMonthSales: currentRevenue,
      currentMonthBillCount: currentSales.length,
      previousMonthLabel: lastMonth.label,
      previousMonthSales: prevRevenue,
      previousMonthBillCount: prevSales.length,
      growthPercent: growthPercent,
      isPositiveGrowth: currentRevenue >= prevRevenue,
      hasRecords: currentSales.length > 0,
    };
  },

  /**
   * Tool: get_sales
   * Flexible sales query with customizable timeframe
   */
  async get_sales(params: { timeframe?: string } = {}) {
    const { startDate, endDate, label } = parseTimeframe(params?.timeframe);
    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { items: true },
    });

    const total = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    return {
      timeframe: label,
      totalSales: total,
      ordersCount: sales.length,
      salesListSummary: sales.slice(-6).map((s) => ({
        invoice: s.invoiceNo,
        customer: s.customerName,
        total: s.total,
        paymentType: s.paymentType,
      })),
      hasRecords: sales.length > 0,
    };
  },

  /**
   * Tool: get_inventory
   * Fetches store inventory, total SKU count, and total stock valuation
   */
  async get_inventory() {
    const products = await prisma.product.findMany();
    const totalItems = products.length;
    const totalValuation = products.reduce((sum, p) => {
      const cost = Number(p.costPrice || p.purchasePrice || p.sellingPrice * 0.8);
      return sum + Number(p.currentStock || 0) * cost;
    }, 0);

    const categories: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'general';
      categories[cat] = (categories[cat] || 0) + Number(p.currentStock || 0);
    });

    return {
      totalProductsCount: totalItems,
      totalStockValuationRupees: Math.round(totalValuation),
      categoryBreakdown: categories,
      productsSample: products.slice(0, 10).map((p) => ({
        id: p.id,
        name: p.name,
        nameTa: p.nameTa,
        stock: p.currentStock,
        unit: p.unit,
        price: p.sellingPrice,
      })),
      hasRecords: products.length > 0,
    };
  },

  /**
   * Tool: get_low_stock
   * Fetches products that have reached or dropped below reorder threshold
   */
  async get_low_stock() {
    const products = await prisma.product.findMany();
    const lowStock = products.filter((p) => p.currentStock <= p.minStock);
    const outOfStock = products.filter((p) => p.currentStock === 0);

    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      criticalItems: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        nameTa: p.nameTa,
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: p.unit,
        costPrice: p.costPrice || p.purchasePrice || 0,
        suggestedRestock: Math.max(10, p.minStock * 2 - p.currentStock),
      })),
      allSufficient: lowStock.length === 0,
    };
  },

  /**
   * Tool: get_customer_dues
   * Checks pending credit (கடன் பாக்கி). Can look up an individual customer or summarize all store debtors.
   */
  async get_customer_dues(params?: { customerName?: string }) {
    const customers = await prisma.customer.findMany();

    if (params?.customerName) {
      const target = params.customerName.toLowerCase().trim();
      const matched = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(target) ||
          (c.nameTa && c.nameTa.toLowerCase().includes(target)) ||
          c.phone.includes(target)
      );

      if (matched.length > 0) {
        return {
          found: true,
          exactMatches: matched.map((c) => ({
            id: c.id,
            name: c.name,
            nameTa: c.nameTa,
            phone: c.phone,
            outstandingBalance: c.outstandingBalance || c.totalUdhar || 0,
            creditLimit: c.creditLimit || 3000,
            address: c.address,
          })),
        };
      } else {
        return {
          found: false,
          searchedName: params.customerName,
          message: `இந்த தகவல் உங்கள் கணக்கில் இல்லை. வாடிக்கையாளர் "${params.customerName}" பெயரில் பதிவு காணப்படவில்லை.`,
        };
      }
    }

    // Overall customer dues summary
    const debtors = customers
      .filter((c) => (c.outstandingBalance || c.totalUdhar || 0) > 0)
      .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0));

    const totalOutstanding = debtors.reduce((sum, c) => sum + (c.outstandingBalance || c.totalUdhar || 0), 0);

    return {
      totalOutstandingDues: totalOutstanding,
      debtorCount: debtors.length,
      topDebtors: debtors.slice(0, 5).map((c) => ({
        name: c.name,
        phone: c.phone,
        amountDue: c.outstandingBalance || c.totalUdhar || 0,
      })),
      allClear: debtors.length === 0,
    };
  },

  /**
   * Tool: get_supplier_dues
   * Checks pending payable balance owed to wholesale mandi suppliers
   */
  async get_supplier_dues(params?: { supplierName?: string }) {
    const suppliers = await prisma.supplier.findMany();
    const purchases = await prisma.purchase.findMany({
      where: { paymentStatus: { in: ['unpaid', 'partial'] } },
    });

    const totalOwed = purchases.reduce((sum, p) => sum + Number(p.balanceDue || p.total || 0), 0);

    return {
      totalPayableToSuppliers: totalOwed,
      pendingPurchaseOrdersCount: purchases.length,
      suppliersSample: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        totalPurchases: s.totalPurchases,
      })),
      allClear: totalOwed === 0,
    };
  },

  /**
   * Tool: get_expenses
   * Retrieves operational shop expenses with category distribution
   */
  async get_expenses(params?: { timeframe?: string }) {
    const { startDate, endDate, label } = parseTimeframe(params?.timeframe);
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
    });

    return {
      period: label,
      totalExpenses: total,
      expenseRecordsCount: expenses.length,
      breakdownByCategory: categoryMap,
      sampleRecords: expenses.slice(-5).map((e) => ({
        description: e.description,
        category: e.category,
        amount: e.amount,
      })),
    };
  },

  /**
   * Tool: get_profit
   * Computes true revenue, cost of goods, gross margin, operating expenses, and net profit
   */
  async get_profit(params?: { timeframe?: string }) {
    const { startDate, endDate, label } = parseTimeframe(params?.timeframe);

    const [sales, expenses, purchases] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: { items: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      prisma.purchase.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
    ]);

    const revenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const operatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const purchaseCost = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

    // Estimate COGS based on sales item unit prices (~80% cost default) or direct purchase cost
    const cogs = purchaseCost > 0 ? purchaseCost : Math.round(revenue * 0.8);
    const grossProfit = Math.max(0, revenue - cogs);
    const netProfit = revenue - (cogs + operatingExpenses);
    const marginPercent = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    return {
      period: label,
      totalRevenue: revenue,
      costOfGoodsSold: cogs,
      grossProfit: grossProfit,
      operatingExpenses: operatingExpenses,
      netProfit: netProfit,
      profitMarginPercent: marginPercent,
      isProfitable: netProfit > 0,
    };
  },

  /**
   * Tool: get_cash_flow
   * Computes cash inflows vs cash outflows
   */
  async get_cash_flow() {
    const { startDate, endDate, label } = parseTimeframe('THIS_MONTH');

    const [sales, expenses, purchases] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      prisma.purchase.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
    ]);

    const cashIn = sales.reduce((sum, s) => sum + Number(s.amountPaid || s.total || 0), 0);
    const cashOut =
      expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) +
      purchases.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

    return {
      period: label,
      cashInflow: cashIn,
      cashOutflow: cashOut,
      netCashBalance: cashIn - cashOut,
      status: cashIn >= cashOut ? 'POSITIVE_CASH_FLOW' : 'DEFICIT_WATCH',
    };
  },

  /**
   * Tool: get_customer_details
   * Complete profile & recent ledger records for a customer
   */
  async get_customer_details(params: { nameOrPhone: string }) {
    const target = params.nameOrPhone.toLowerCase().trim();
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: { contains: target } },
          { phone: { contains: target } },
        ],
      },
    });

    if (!customer) {
      return {
        found: false,
        message: `இந்த தகவல் உங்கள் கணக்கில் இல்லை. வாடிக்கையாளர் "${params.nameOrPhone}" காணப்படவில்லை.`,
      };
    }

    const bills = await prisma.sale.findMany({
      where: { customerId: customer.id },
      take: 5,
      orderBy: { date: 'desc' },
    });

    return {
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        nameTa: customer.nameTa,
        phone: customer.phone,
        address: customer.address,
        outstandingBalance: customer.outstandingBalance || customer.totalUdhar || 0,
        creditLimit: customer.creditLimit || 3000,
        totalPurchases: customer.totalPurchases || 0,
      },
      recentBills: bills.map((b) => ({
        invoiceNo: b.invoiceNo,
        date: b.date,
        total: b.total,
        balanceDue: b.balanceDue,
      })),
    };
  },

  /**
   * Tool: get_product_details
   * Product specs, pricing, margins and stock
   */
  async get_product_details(params: { productName: string }) {
    const target = params.productName.toLowerCase().trim();
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: target } },
          { nameTa: { contains: target } },
        ],
      },
    });

    if (!product) {
      return {
        found: false,
        message: `இந்த தகவல் உங்கள் கணக்கில் இல்லை. பொருள் "${params.productName}" உங்கள் இருப்பில் இல்லை.`,
      };
    }

    const profitPerUnit = product.sellingPrice - (product.costPrice || product.purchasePrice || 0);
    const marginPercent = Math.round((profitPerUnit / product.sellingPrice) * 100);

    return {
      found: true,
      product: {
        id: product.id,
        name: product.name,
        nameTa: product.nameTa,
        category: product.category,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice || product.purchasePrice,
        profitPerUnit,
        marginPercent,
        isLowStock: product.currentStock <= product.minStock,
      },
    };
  },

  /**
   * Tool: search_business_schemes
   * Real database-backed Government subsidies, MSME loans, and schemes grounded in official sources
   */
  async search_business_schemes(params: { query: string }) {
    const q = params.query.toLowerCase();
    try {
      const dbResults = await searchSchemes({ query: q });
      const schemesList = dbResults.length > 0 ? dbResults : await searchSchemes({});

      return {
        query: params.query,
        resultsCount: schemesList.length,
        schemes: schemesList.map((s: any) => ({
          id: s.id,
          name: s.name,
          fullName: s.fullName,
          nameTa: s.nameTa,
          fullNameTa: s.fullNameTa,
          governmentLevel: s.governmentLevel,
          department: s.department,
          departmentTa: s.departmentTa,
          category: s.category,
          type: s.category,
          maxSubsidy: `₹${(s.subsidyMaximum / 100000).toFixed(1)} Lakhs (${s.subsidyPercentage}%)`,
          subsidyPercentage: s.subsidyPercentage,
          subsidyMaximum: s.subsidyMaximum,
          interestSubvention: s.interestSubvention,
          projectCostMin: s.projectCostMin,
          projectCostMax: s.projectCostMax,
          description: s.description,
          descriptionTa: s.descriptionTa,
          applicationUrl: s.applicationUrl,
          officialSourceUrl: s.officialSourceUrl,
          officialDocumentUrl: s.officialDocumentUrl,
          sourceAuthority: s.sourceAuthority,
          lastVerifiedAt: s.lastVerifiedAt,
          isStale: s.isStale,
          link: s.applicationUrl,
        })),
      };
    } catch (err) {
      console.error('[BI AGENT] Fallback scheme search error:', err);
      return { query: params.query, resultsCount: 0, schemes: [] };
    }
  },
};

// ============================================================================
// 2. CENTRALIZED SYSTEM PROMPT (Tamil, English, Tanglish + Business Rules)
// ============================================================================

export const URIMAIYALAR_SYSTEM_PROMPT = `
You are URIMAIYALAR AI, the intelligent business operating assistant inside Urimaiyalar OS.

YOUR ROLE:
You help Tamil Nadu business owners, MSMEs, retail shop owners, and wholesale merchants understand and manage their business using simple, respectful, and crystal-clear language.

LANGUAGES SUPPORTED:
- Tamil (தமிழ்)
- English
- Tanglish (e.g., "Ramesh oda balance evvalavu?", "Innaiku sales eppadi irukku?")
- Tamil + English mixed conversation

DEFAULT LANGUAGE RULE:
Reply in the EXACT SAME language and tone used by the user in their query:
- If user asks in Tamil ("இன்றைய விற்பனை என்ன?"), reply in natural Tamil.
- If user asks in Tanglish ("Innaiku sales evvalavu?"), reply in friendly Tanglish or clear Tamil.
- If user asks in English ("What is my total profit?"), reply in clean English.

CRITICAL TRUTH & GROUNDING RULES:
1. NEVER INVENT OR HALLUCINATE BUSINESS DATA.
2. You must ONLY use the exact real-time data retrieved from the database tools provided in the context.
3. If the requested information is NOT in the database (e.g. non-existent customer, unknown product, zero records), clearly state:
   - Tamil: "இந்த தகவல் உங்கள் கணக்கில் இல்லை."
   - English: "This information is not found in your business records."
   - Tanglish: "Intha details unga account-la illa."
4. When calculations are required, use the actual numbers provided in the tool output.

RESPONSE STRUCTURE:
1. Direct Answer: Start with a crisp 1-line answer directly answering the question.
2. Data Breakdown: Use bullet points (•) and bold numbers (**₹5,700**, **25 kg**).
3. Actionable Next Step: When appropriate, give 1 practical business suggestion (e.g., "ரமேஷிற்கு WhatsApp நினைவூட்டல் அனுப்பலாமா?", "பொன்னி அரிசி ஸ்டாக் குறைந்துள்ளது, மண்டிக்கு ஆர்டர் போடலாம்.").

FEW-SHOT EXAMPLES:

Example 1 (Sales):
User: "இந்த மாதம் விற்பனை எப்படி?"
Retrieved Data: { currentMonthSales: 184500, previousMonthSales: 164700, growthPercent: 12 }
AI Response:
இந்த மாதம் உங்கள் மொத்த விற்பனை **₹1,84,500**.
• கடந்த மாதத்துடன் ஒப்பிடும்போது **12% அதிகரித்துள்ளது** (விற்பனை வளர்ச்சி).
• கடந்த மாதம்: **₹1,64,700** | இந்த மாதம்: **₹1,84,500**

Example 2 (Debts):
User: "யார் பணம் தரவில்லை?"
Retrieved Data: { totalOutstandingDues: 27500, debtorCount: 3, topDebtors: [{ name: "ரமேஷ்", amountDue: 8500 }] }
AI Response:
உங்கள் கடையில் **3 வாடிக்கையாளர்களிடம் மொத்தம் ₹27,500** கடன் பாக்கி நிலுவையில் உள்ளது.
• அதிகபட்ச பாக்கி: **ரமேஷ் — ₹8,500**
💡 ரமேஷிற்கு WhatsApp மூலம் உடனடியாக கடன் நினைவூட்டல் செய்தி அனுப்பலாம்.

Example 3 (Follow-up Context):
User: "கடந்த மாதத்துடன் compare பண்ணு"
Previous Context: User asked about sales
Retrieved Data: { currentMonthSales: 184500, previousMonthSales: 164700, growthPercent: 12 }
AI Response:
📊 **விற்பனை ஒப்பீடு (Month-over-Month)**
• இந்த மாதம்: **₹1,84,500**
• கடந்த மாதம்: **₹1,64,700**
• நிகர வளர்ச்சி: **+₹19,800 (+12% உயர்வு)**

Example 4 (Unknown Data):
User: "சுரேஷ் எவ்வளவு கடன் வைத்துள்ளார்?"
Retrieved Data: { found: false, searchedName: "சுரேஷ்" }
AI Response:
⚠️ **இந்த தகவல் உங்கள் கணக்கில் இல்லை.**
"சுரேஷ்" என்ற பெயரில் எந்த வாடிக்கையாளர் பதிவும் உங்கள் பேரேட்டில் காணப்படவில்லை. தயவுசெய்து தொலைபேசி எண் அல்லது முழு பெயரை சரிபார்க்கவும்.
`;

// ============================================================================
// 3. INTENT & TOOL SELECTION ORCHESTRATOR
// ============================================================================

export interface ToolCallDecision {
  toolName: keyof typeof BITools;
  params: any;
}

export function routeToolsLocally(query: string, history: Array<{ role: string; content: string }> = []): ToolCallDecision[] {
  const q = query.toLowerCase();
  const lastUserMsg = history.filter((m) => m.role === 'user').slice(-2).map((m) => m.content.toLowerCase()).join(' ');
  const combinedContext = `${lastUserMsg} ${q}`;

  // 1. Customer specific due / details
  const nameMatch = q.match(/(?:ரமேஷ்|குமார்|செல்வம்|அனிதா|பிரியா|ramesh|kumar|anitha|priya|selvam|senthil|செந்தில்)/i);
  if (nameMatch && (q.includes('கடன்') || q.includes('due') || q.includes('owe') || q.includes('balance') || q.includes('balance') || q.includes('evvalavu') || q.includes('எவ்வளவு'))) {
    return [{ toolName: 'get_customer_dues', params: { customerName: nameMatch[0] } }];
  }

  // 2. Generic customer dues / debt
  if (/யார் பணம் தரவில்லை|கடன் பாக்கி|யார் கடன்|debt|owe|customer due|udhar|ledger|நிலுவை/.test(q)) {
    return [{ toolName: 'get_customer_dues', params: {} }];
  }

  // 3. Low stock / missing inventory
  if (/low stock|தீர்ந்து|குறைவாக|எது குறைவு|முடிகிறது|reorder|out of stock/.test(q)) {
    return [{ toolName: 'get_low_stock', params: {} }];
  }

  // 4. Product inventory / items
  if (/அரிசி|எண்ணெய்|பருப்பு|rice|oil|dal|atta|stock|inventory|பொருள்|சரக்கு/.test(q)) {
    if (nameMatch || /அரிசி|பருப்பு|rice|dal|sugar/.test(q)) {
      const prodName = q.includes('அரிசி') || q.includes('rice') ? 'Rice' : q.includes('பருப்பு') || q.includes('dal') ? 'Dal' : 'Item';
      return [
        { toolName: 'get_product_details', params: { productName: prodName } },
        { toolName: 'get_low_stock', params: {} },
      ];
    }
    return [{ toolName: 'get_inventory', params: {} }];
  }

  // 5. Daily sales
  if (/இன்று|இன்றைய|today|innaiku|daily/.test(q) && /விற்பனை|sales?|collection|வியாபாரம்/.test(q)) {
    return [{ toolName: 'get_daily_sales', params: {} }];
  }

  // 6. Monthly sales & comparisons
  if (/மாதம்|month|மாத விற்பனை|compare|ஒப்பீடு/.test(q) || (/compare|ஒப்பிடு/.test(q) && /விற்பனை|sale/.test(combinedContext))) {
    return [{ toolName: 'get_monthly_sales', params: {} }];
  }

  // 7. Profit & Margins
  if (/லாபம்|profit|margin|நிகர லாபம்|net profit|வருமானம்/.test(q)) {
    return [{ toolName: 'get_profit', params: { timeframe: q.includes('இன்று') ? 'TODAY' : 'THIS_MONTH' } }];
  }

  // 8. Expenses
  if (/செலவு|expense|செலவுகள்|bill|rent|current bill/.test(q)) {
    return [{ toolName: 'get_expenses', params: { timeframe: q.includes('இன்று') ? 'TODAY' : 'THIS_MONTH' } }];
  }

  // 9. Cash flow
  if (/பணப்புழக்கம்|cash flow|இருப்பு பணம்|cash balance/.test(q)) {
    return [{ toolName: 'get_cash_flow', params: {} }];
  }

  // 10. Government schemes
  if (/திட்டம்|மானியம்|scheme|subsidy|loan|msme|mudra|needs/.test(q)) {
    return [{ toolName: 'search_business_schemes', params: { query: q } }];
  }

  // Default fallback: daily sales + customer dues + low stock overview
  return [
    { toolName: 'get_daily_sales', params: {} },
    { toolName: 'get_customer_dues', params: {} },
  ];
}

/**
 * Intelligent Tool Router using Groq LLM with deterministic local fallback
 */
export async function determineToolsToCall(
  query: string,
  history: Array<{ role: string; content: string }> = []
): Promise<ToolCallDecision[]> {
  const routerPrompt = `
You are the Tool Orchestrator for Urimaiyalar OS Business Intelligence Agent.
Determine which database tool(s) must be executed to answer the user's business query.

AVAILABLE TOOLS:
- get_sales(timeframe?: "TODAY"|"THIS_MONTH"|"LAST_MONTH"|"THIS_YEAR")
- get_daily_sales()
- get_monthly_sales()
- get_inventory()
- get_low_stock()
- get_customer_dues(customerName?: string)
- get_supplier_dues(supplierName?: string)
- get_expenses(timeframe?: string)
- get_profit(timeframe?: string)
- get_cash_flow()
- get_customer_details(nameOrPhone: string)
- get_product_details(productName: string)
- search_business_schemes(query: string)

CONVERSATION HISTORY:
${history.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n')}

USER QUERY: "${query}"

Return ONLY a valid JSON array of tool calls. No markdown, no explanations.
Example: [{"toolName": "get_customer_dues", "params": {"customerName": "Ramesh"}}]
`;

  try {
    const res = await generateAiCompletion({
      prompt: routerPrompt,
      systemPrompt: 'You are an accurate tool routing model. Output only JSON array.',
      temperature: 0.0,
      maxTokens: 100,
      jsonMode: true,
    });

    const clean = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].toolName) {
      return parsed.filter((t: any) => typeof (BITools as any)[t.toolName] === 'function');
    }
  } catch {}

  return routeToolsLocally(query, history);
}

// ============================================================================
// 4. MAIN BUSINESS INTELLIGENCE AGENT EXECUTION
// ============================================================================

export interface BIAgentResult {
  answer: string;
  toolsExecuted: string[];
  dataRetrieved: Record<string, any>;
  provider: string;
  latencyMs: number;
}

export async function executeBIAgent(
  query: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<BIAgentResult> {
  const startTime = Date.now();

  // 1. Identify which tools to execute
  const toolDecisions = await determineToolsToCall(query, conversationHistory);
  const toolsExecuted: string[] = [];
  const dataRetrieved: Record<string, any> = {};

  // 2. Execute tools in parallel against real database
  await Promise.all(
    toolDecisions.map(async (decision) => {
      const toolFn = (BITools as any)[decision.toolName];
      if (typeof toolFn === 'function') {
        try {
          const result = await toolFn(decision.params);
          toolsExecuted.push(decision.toolName);
          dataRetrieved[decision.toolName] = result;
        } catch (err: any) {
          console.error(`[BI Agent] Error executing ${decision.toolName}:`, err.message);
        }
      }
    })
  );

  // 3. Synthesize Grounded Answer with Centralized System Prompt via Groq
  const synthesisPrompt = `
CONVERSATION HISTORY (for follow-ups and conversational context):
${conversationHistory.slice(-4).map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n')}

LATEST USER QUERY: "${query}"

RETRIEVED REAL-TIME BUSINESS DATA (ground truth from database):
${JSON.stringify(dataRetrieved, null, 2)}

INSTRUCTIONS:
1. Answer the user query using the retrieved data above.
2. Reply in the same language as the user (Tamil / English / Tanglish).
3. If the data is empty or indicates not found, state clearly: "இந்த தகவல் உங்கள் கணக்கில் இல்லை."
4. Never invent numbers. Keep answers concise, factual, and actionable.
`;

  const completion = await generateAiCompletion({
    prompt: synthesisPrompt,
    systemPrompt: URIMAIYALAR_SYSTEM_PROMPT,
    temperature: 0.1,
    maxTokens: 350,
  });

  return {
    answer: completion.text || 'இந்த தகவல் உங்கள் கணக்கில் இல்லை.',
    toolsExecuted,
    dataRetrieved,
    provider: `${completion.provider} (${completion.model})`,
    latencyMs: Date.now() - startTime,
  };
}
