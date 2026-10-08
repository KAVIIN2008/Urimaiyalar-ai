/**
 * URIMAIYALAR AI - Deterministic Financial & Business Intelligence Engine
 * The LLM is NEVER the source of truth for arithmetic or accounting.
 * Every calculation is reproducible from database records.
 */

import {
  Product,
  Sale,
  Purchase,
  Expense,
  Customer,
  Supplier,
  FinancialSummary,
  BusinessHealthScore,
} from '../types';

export function calculateFinancialSummary(
  products: Product[],
  sales: Sale[],
  purchases: Purchase[],
  expenses: Expense[],
  customers: Customer[],
  suppliers: Supplier[]
): FinancialSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-09"

  // Helper: normalize date field (Prisma returns Date objects, some paths return ISO strings)
  const toDateStr = (d: string | Date): string =>
    d instanceof Date ? d.toISOString() : String(d);

  // Filter sales
  const todaySalesList = sales.filter((s) => toDateStr(s.date).startsWith(todayStr));
  const monthSalesList = sales.filter((s) => toDateStr(s.date).startsWith(currentYearMonth));

  const todaySales = todaySalesList.reduce((acc, s) => acc + s.total, 0);
  const monthlySales = monthSalesList.reduce((acc, s) => acc + s.total, 0);

  // Filter expenses
  const todayExpensesList = expenses.filter((e) => toDateStr(e.date).startsWith(todayStr));
  const monthExpensesList = expenses.filter((e) => toDateStr(e.date).startsWith(currentYearMonth));

  const todayExpenses = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);
  const monthlyExpenses = monthExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Calculate Cost of Goods Sold (COGS) for monthly sales based on product purchasePrice
  const productPriceMap = new Map<string, number>();
  products.forEach((p) => {
    // Support both costPrice (Prisma schema) and purchasePrice (legacy type)
    productPriceMap.set(p.id, (p as any).purchasePrice ?? (p as any).costPrice ?? 0);
  });

  let monthlyCostOfGoods = 0;
  monthSalesList.forEach((sale) => {
    sale.items.forEach((item) => {
      const cost = productPriceMap.get(item.productId) || (item.unitPrice * 0.8);
      monthlyCostOfGoods += cost * item.quantity;
    });
  });

  let todayCostOfGoods = 0;
  todaySalesList.forEach((sale) => {
    sale.items.forEach((item) => {
      const cost = productPriceMap.get(item.productId) || (item.unitPrice * 0.8);
      todayCostOfGoods += cost * item.quantity;
    });
  });

  const todayProfit = Math.round(todaySales - todayCostOfGoods - todayExpenses);
  const monthlyGrossProfit = Math.round(monthlySales - monthlyCostOfGoods);
  const monthlyNetProfit = Math.round(monthlyGrossProfit - monthlyExpenses);

  const profitMarginPercent = monthlySales > 0
    ? Number(((monthlyNetProfit / monthlySales) * 100).toFixed(1))
    : 0;

  // Credit outstanding
  const customerCreditOutstanding = customers.reduce(
    (acc, c) => acc + (c.outstandingBalance || 0),
    0
  );
  const supplierCreditOutstanding = suppliers.reduce(
    (acc, s) => acc + (s.outstandingBalance || 0),
    0
  );

  // Stock values and counts
  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );
  const lowStockCount = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStock
  ).length;
  const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;

  return {
    todaySales,
    todayExpenses,
    todayProfit,
    monthlySales,
    monthlyExpenses,
    monthlyCostOfGoods,
    monthlyGrossProfit,
    monthlyNetProfit,
    profitMarginPercent,
    customerCreditOutstanding,
    supplierCreditOutstanding,
    totalStockValue,
    lowStockCount,
    outOfStockCount,
  };
}

export function computeBusinessHealthScore(
  summary: FinancialSummary,
  products: Product[],
  customers: Customer[]
): BusinessHealthScore {
  // 1. Profit Score (0 - 25 points)
  let profitScore = 15;
  if (summary.monthlyNetProfit > 0) {
    if (summary.profitMarginPercent >= 15) profitScore = 25;
    else if (summary.profitMarginPercent >= 8) profitScore = 20;
    else profitScore = 16;
  } else {
    profitScore = Math.max(5, 10 + summary.profitMarginPercent);
  }

  // 2. Inventory Health (0 - 20 points)
  const totalProducts = products.length || 1;
  const stockedRatio = (totalProducts - summary.outOfStockCount - summary.lowStockCount * 0.5) / totalProducts;
  const inventoryScore = Math.min(20, Math.max(5, Math.round(stockedRatio * 20)));

  // 3. Credit Health (0 - 20 points)
  // Ratio of customer credit to monthly sales (ideal is < 30% of monthly turnover)
  let creditScore = 18;
  if (summary.monthlySales > 0) {
    const creditRatio = summary.customerCreditOutstanding / summary.monthlySales;
    if (creditRatio <= 0.25) creditScore = 20;
    else if (creditRatio <= 0.45) creditScore = 16;
    else if (creditRatio <= 0.70) creditScore = 11;
    else creditScore = 6;
  }

  // 4. Expense Control (0 - 20 points)
  // Expenses should ideally be < 40% of gross profit
  let expenseScore = 16;
  if (summary.monthlyGrossProfit > 0) {
    const expenseRatio = summary.monthlyExpenses / summary.monthlyGrossProfit;
    if (expenseRatio <= 0.35) expenseScore = 20;
    else if (expenseRatio <= 0.55) expenseScore = 16;
    else if (expenseRatio <= 0.75) expenseScore = 12;
    else expenseScore = 8;
  }

  // 5. Customer Activity (0 - 15 points)
  const activeCustomers = customers.filter((c) => c.purchaseCount >= 2).length;
  const customerRatio = customers.length ? activeCustomers / customers.length : 0.8;
  const customerScore = Math.min(15, Math.max(6, Math.round(customerRatio * 15)));

  const overall = Math.min(100, Math.max(10, profitScore + inventoryScore + creditScore + expenseScore + customerScore));

  let status: 'Excellent' | 'Healthy' | 'Moderate' | 'Needs Attention' = 'Healthy';
  let statusTa = 'ஆரோக்கியமான வணிகம்';
  let analysis = 'Business is generating consistent profit with stable inventory velocity.';

  if (overall >= 85) {
    status = 'Excellent';
    statusTa = 'சிறந்த வணிக வளர்ச்சி';
    analysis = 'Very strong margins, controlled expenses, and prompt credit recovery.';
  } else if (overall >= 70) {
    status = 'Healthy';
    statusTa = 'சீராக இயங்கும் வணிகம்';
    analysis = 'Profitable operations with minor stock reorder requirements.';
  } else if (overall >= 50) {
    status = 'Moderate';
    statusTa = 'கவனிக்க வேண்டிய வணிக நிலை';
    analysis = 'Operating profit is tight. Monitor slow-moving items and overdue customer credit.';
  } else {
    status = 'Needs Attention';
    statusTa = 'உடனடி கவனம் தேவை';
    analysis = 'High outstanding credit and depleted stock require immediate working capital attention.';
  }

  return {
    overall,
    profitScore,
    inventoryScore,
    creditScore,
    expenseScore,
    customerScore,
    status,
    statusTa,
    analysis,
  };
}

export function formatCurrency(amount?: number | null): string {
  const safeNum = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeNum);
}
