// src/services/tools/toolRegistry.ts
// ============================================================================
// URIMAIYALAR OS — APPROVED PRODUCTION TOOL REGISTRY
// Strict zero-arbitrary-SQL tool execution layer with parameterized Prisma operations
// ============================================================================

import { prisma } from '../../lib/db';

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTimestamp: string;
  source: 'database' | 'engine' | 'rag';
}

export class ToolRegistry {
  public static readonly APPROVED_TOOLS: string[] = [
    'get_revenue',
    'get_expenses',
    'get_profit',
    'get_cash_flow',
    'get_customer_dues',
    'get_supplier_dues',
    'compare_financial_periods',
    'create_sale',
    'get_daily_sales',
    'get_weekly_sales',
    'get_monthly_sales',
    'get_top_products',
    'get_inventory',
    'get_low_stock',
    'add_stock',
    'search_customer',
    'record_payment',
  ];

  private static defaultShopId = '6d7904e5-69ac-469a-95a7-7ad5e9d4c73a';

  private static async getEffectiveShopId(shopId?: string): Promise<string> {
    if (shopId && shopId.trim().length > 0) return shopId;
    const shop = await prisma.shop.findFirst();
    return shop ? shop.id : this.defaultShopId;
  }

  // ===========================================================================
  // 1. FINANCE TOOLS (Deterministic Calculations & Grounded Aggregations)
  // ===========================================================================

  static async get_revenue(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const sales = await prisma.sale.findMany({ where: { shopId: sId } });
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaySales = sales
      .filter((s) => new Date(s.createdAt) >= todayStart)
      .reduce((sum, s) => sum + s.total, 0);

    return {
      tool: 'get_revenue',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: {
        totalRevenue,
        todayRevenue: todaySales,
        totalSalesCount: sales.length,
      },
    };
  }

  static async get_expenses(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const expenses = await prisma.expense.findMany({ where: { shopId: sId } });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayExpenses = expenses
      .filter((e) => new Date(e.createdAt) >= todayStart)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      tool: 'get_expenses',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: {
        totalExpenses,
        todayExpenses,
        expenseCount: expenses.length,
      },
    };
  }

  static async get_profit(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const [revRes, expRes] = await Promise.all([
      this.get_revenue(sId),
      this.get_expenses(sId),
    ]);

    const totalRevenue = revRes.data.totalRevenue;
    const totalExpenses = expRes.data.totalExpenses;
    const todayRevenue = revRes.data.todayRevenue;
    const todayExpenses = expRes.data.todayExpenses;

    // Deterministic Calculation in code: Profit = Revenue - Expenses
    const netProfit = totalRevenue - totalExpenses;
    const todayProfit = todayRevenue - todayExpenses;
    const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    return {
      tool: 'get_profit',
      success: true,
      source: 'engine',
      executionTimestamp: new Date().toISOString(),
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        todayRevenue,
        todayExpenses,
        todayProfit,
        marginPercent,
      },
    };
  }

  static async get_cash_flow(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({ where: { shopId: sId } }),
      prisma.expense.findMany({ where: { shopId: sId } }),
    ]);

    const cashIn = sales.reduce((sum, s) => sum + s.amountPaid, 0);
    const cashOut = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netCashFlow = cashIn - cashOut;

    return {
      tool: 'get_cash_flow',
      success: true,
      source: 'engine',
      executionTimestamp: new Date().toISOString(),
      data: { cashIn, cashOut, netCashFlow },
    };
  }

  static async get_customer_dues(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const customers = await prisma.customer.findMany({
      where: { shopId: sId, totalUdhar: { gt: 0 } },
      orderBy: { totalUdhar: 'desc' },
    });
    const totalDues = customers.reduce((sum, c) => sum + c.totalUdhar, 0);

    return {
      tool: 'get_customer_dues',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { totalOutstandingDues: totalDues, debtorsCount: customers.length, topDebtors: customers.slice(0, 5) },
    };
  }

  static async get_supplier_dues(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const suppliers = await prisma.supplier.findMany({
      where: { shopId: sId, balanceDue: { gt: 0 } },
      orderBy: { balanceDue: 'desc' },
    });
    const totalDues = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);

    return {
      tool: 'get_supplier_dues',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { totalSupplierPayables: totalDues, supplierCount: suppliers.length, suppliers },
    };
  }

  static async compare_financial_periods(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [salesThisMonth, salesLastMonth] = await Promise.all([
      prisma.sale.findMany({ where: { shopId: sId, createdAt: { gte: thisMonthStart } } }),
      prisma.sale.findMany({ where: { shopId: sId, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    const revThisMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);
    const revLastMonth = salesLastMonth.reduce((sum, s) => sum + s.total, 0);
    const growthPercent = revLastMonth > 0 ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100) : 100;

    return {
      tool: 'compare_financial_periods',
      success: true,
      source: 'engine',
      executionTimestamp: new Date().toISOString(),
      data: { revThisMonth, revLastMonth, growthPercent },
    };
  }

  // ===========================================================================
  // 2. SALES TOOLS (Parameterized Writes and Queries)
  // ===========================================================================

  static async create_sale(args: {
    amount: number;
    customerName?: string;
    items?: Array<{ productId?: string; productName: string; quantity: number; unitPrice: number }>;
    paymentType?: string;
    shopId?: string;
  }): Promise<ToolExecutionResult> {
    const { amount, customerName = 'Walk-in Customer', items = [], paymentType = 'cash' } = args;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { tool: 'create_sale', success: false, error: 'Amount must be a positive numeric value.', executionTimestamp: new Date().toISOString(), source: 'engine' };
    }

    const sId = await this.getEffectiveShopId(args.shopId);
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          shopId: sId,
          invoiceNo,
          customerName,
          subtotal: amount,
          total: amount,
          paymentType,
          amountPaid: amount,
          balanceDue: 0,
          items: {
            create: items.map((i) => ({
              productId: i.productId || 'manual_item',
              productName: i.productName || 'Sale Item',
              quantity: i.quantity || 1,
              unit: 'unit',
              unitPrice: i.unitPrice || amount,
              totalPrice: (i.quantity || 1) * (i.unitPrice || amount),
            })),
          },
        },
      });

      // Deduct inventory if product specified
      for (const item of items) {
        if (item.productId && item.productId !== 'manual_item') {
          await tx.product.updateMany({
            where: { id: item.productId, shopId: sId },
            data: { currentStock: { decrement: item.quantity || 1 } },
          });
        }
      }

      // Record business memory
      await tx.memory.create({
        data: {
          shopId: sId,
          title: `Sale to ${customerName}: ₹${amount}`,
          description: `AI recorded sale invoice #${invoiceNo} for ₹${amount}.`,
          category: 'sale',
          entityName: customerName,
          importance: amount >= 2000 ? 'high' : 'medium',
        },
      });

      return createdSale;
    });

    return {
      tool: 'create_sale',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { saleId: sale.id, invoiceNo: sale.invoiceNo, total: sale.total, customer: sale.customerName },
    };
  }

  static async get_daily_sales(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sales = await prisma.sale.findMany({
      where: { shopId: sId, createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    const total = sales.reduce((sum, s) => sum + s.total, 0);

    return {
      tool: 'get_daily_sales',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { count: sales.length, totalAmount: total, sales },
    };
  }

  static async get_weekly_sales(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sales = await prisma.sale.findMany({
      where: { shopId: sId, createdAt: { gte: weekAgo } },
      orderBy: { createdAt: 'desc' },
    });
    const total = sales.reduce((sum, s) => sum + s.total, 0);

    return {
      tool: 'get_weekly_sales',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { count: sales.length, totalAmount: total },
    };
  }

  static async get_monthly_sales(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const sales = await prisma.sale.findMany({
      where: { shopId: sId, createdAt: { gte: monthAgo } },
    });
    const total = sales.reduce((sum, s) => sum + s.total, 0);

    return {
      tool: 'get_monthly_sales',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { count: sales.length, totalAmount: total },
    };
  }

  static async get_top_products(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const products = await prisma.product.findMany({
      where: { shopId: sId },
      orderBy: { currentStock: 'asc' },
      take: 5,
    });
    return {
      tool: 'get_top_products',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { topProducts: products },
    };
  }

  // ===========================================================================
  // 3. INVENTORY TOOLS
  // ===========================================================================

  static async get_inventory(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const products = await prisma.product.findMany({
      where: { shopId: sId },
      orderBy: { currentStock: 'asc' },
    });
    const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);

    return {
      tool: 'get_inventory',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { totalProducts: products.length, totalInventoryValue, products },
    };
  }

  static async get_low_stock(shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const products = await prisma.product.findMany({ where: { shopId: sId } });
    const lowStock = products.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0);
    const outOfStock = products.filter((p) => p.currentStock <= 0);

    return {
      tool: 'get_low_stock',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
      },
    };
  }

  static async add_stock(args: { productName: string; quantity: number; shopId?: string }): Promise<ToolExecutionResult> {
    const { productName, quantity } = args;
    if (!quantity || quantity <= 0) {
      return { tool: 'add_stock', success: false, error: 'Quantity must be positive integer.', executionTimestamp: new Date().toISOString(), source: 'engine' };
    }
    const sId = await this.getEffectiveShopId(args.shopId);

    const product = await prisma.product.findFirst({
      where: {
        shopId: sId,
        OR: [
          { name: { contains: productName } },
          { nameTa: { contains: productName } },
        ],
      },
    });

    if (!product) {
      return { tool: 'add_stock', success: false, error: `Product "${productName}" not found in inventory.`, executionTimestamp: new Date().toISOString(), source: 'database' };
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { currentStock: { increment: quantity } },
    });

    return {
      tool: 'add_stock',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { productId: updated.id, productName: updated.name, previousStock: product.currentStock, newStock: updated.currentStock },
    };
  }

  // ===========================================================================
  // 4. CUSTOMER TOOLS
  // ===========================================================================

  static async search_customer(name: string, shopId?: string): Promise<ToolExecutionResult> {
    const sId = await this.getEffectiveShopId(shopId);
    const customers = await prisma.customer.findMany({
      where: {
        shopId: sId,
        name: { contains: name },
      },
    });
    return {
      tool: 'search_customer',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { foundCount: customers.length, customers },
    };
  }

  static async record_payment(args: { customerName: string; amount: number; shopId?: string }): Promise<ToolExecutionResult> {
    const { customerName, amount } = args;
    if (!amount || amount <= 0) {
      return { tool: 'record_payment', success: false, error: 'Payment amount must be greater than zero.', executionTimestamp: new Date().toISOString(), source: 'engine' };
    }
    const sId = await this.getEffectiveShopId(args.shopId);

    const customer = await prisma.customer.findFirst({
      where: { shopId: sId, name: { contains: customerName } },
    });

    if (!customer) {
      return { tool: 'record_payment', success: false, error: `Customer "${customerName}" not found.`, executionTimestamp: new Date().toISOString(), source: 'database' };
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { totalUdhar: { decrement: amount } },
    });

    await prisma.memory.create({
      data: {
        shopId: sId,
        title: `Payment received: ₹${amount} from ${customer.name}`,
        description: `Customer credit updated. Remaining dues: ₹${updated.totalUdhar}`,
        category: 'credit',
        entityName: customer.name,
        importance: 'high',
      },
    });

    return {
      tool: 'record_payment',
      success: true,
      source: 'database',
      executionTimestamp: new Date().toISOString(),
      data: { customerName: updated.name, amountPaid: amount, remainingUdhar: updated.totalUdhar },
    };
  }

  // ===========================================================================
  // 5. MASTER TOOL DISPATCHER (Zero SQL Allowed)
  // ===========================================================================

  static async executeTool(toolName: string, parameters: Record<string, any>): Promise<ToolExecutionResult> {
    const norm = (toolName || '').toLowerCase().trim();

    switch (norm) {
      case 'get_revenue':
        return this.get_revenue(parameters.shopId);
      case 'get_expenses':
        return this.get_expenses(parameters.shopId);
      case 'get_profit':
        return this.get_profit(parameters.shopId);
      case 'get_cash_flow':
        return this.get_cash_flow(parameters.shopId);
      case 'get_customer_dues':
        return this.get_customer_dues(parameters.shopId);
      case 'get_supplier_dues':
        return this.get_supplier_dues(parameters.shopId);
      case 'compare_financial_periods':
        return this.compare_financial_periods(parameters.shopId);
      case 'create_sale':
        return this.create_sale(parameters as any);
      case 'get_daily_sales':
        return this.get_daily_sales(parameters.shopId);
      case 'get_weekly_sales':
        return this.get_weekly_sales(parameters.shopId);
      case 'get_monthly_sales':
        return this.get_monthly_sales(parameters.shopId);
      case 'get_top_products':
        return this.get_top_products(parameters.shopId);
      case 'get_inventory':
        return this.get_inventory(parameters.shopId);
      case 'get_low_stock':
        return this.get_low_stock(parameters.shopId);
      case 'add_stock':
        return this.add_stock(parameters as any);
      case 'search_customer':
        return this.search_customer(parameters.name, parameters.shopId);
      case 'record_payment':
        return this.record_payment(parameters as any);
      default:
        return {
          tool: toolName,
          success: false,
          error: `Tool "${toolName}" is not registered in the approved tool registry. Direct arbitrary operations are strictly blocked.`,
          executionTimestamp: new Date().toISOString(),
          source: 'engine',
        };
    }
  }
}
