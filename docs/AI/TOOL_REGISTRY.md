# 🛠️ URIMAIYALAR OS — APPROVED PRODUCTION TOOL REGISTRY

## Security Rule: Zero Arbitrary SQL
```text
PROHIBITED:  LLM  ──[ Raw SQL Query ]──>  Database
ALLOWED:     LLM  ──[ Approved Tool ]──>  Validator  ──[ Parameterized Prisma ]──>  Database
```

Under no circumstances can the LLM formulate, modify, or transmit SQL strings (`SELECT`, `INSERT`, `DROP`, `UPDATE`). All interactions occur through typed, approved functions implemented in `src/services/tools/toolRegistry.ts`.

---

## 📋 The 17 Approved Tools

### 1. Finance Domain
| Tool Name | Parameters | Return Schema | Safety Tier |
| :--- | :--- | :--- | :--- |
| `get_revenue` | `{ shopId?: string }` | `{ totalRevenue: number, todaySales: number }` | READ_ONLY |
| `get_expenses` | `{ shopId?: string }` | `{ totalExpenses: number, todayExpenses: number, breakdown: object }` | READ_ONLY |
| `get_profit` | `{ shopId?: string }` | `{ profit: number, revenue: number, expenses: number, isProfitable: boolean }` | READ_ONLY |
| `get_cash_flow` | `{ shopId?: string }` | `{ netCashFlow: number, cashIn: number, cashOut: number }` | READ_ONLY |
| `get_customer_dues` | `{ shopId?: string }` | `{ totalDues: number, customerCount: number, topDebtors: array }` | READ_ONLY |
| `get_supplier_dues` | `{ shopId?: string }` | `{ totalDues: number, supplierCount: number, suppliers: array }` | READ_ONLY |
| `compare_financial_periods` | `{ shopId?: string }` | `{ thisMonth: object, lastMonth: object, variance: object }` | READ_ONLY |

### 2. Sales Domain
| Tool Name | Parameters | Return Schema | Safety Tier |
| :--- | :--- | :--- | :--- |
| `create_sale` | `{ amount: number, paymentMode?: string, notes?: string }` | `{ saleId: string, amount: number, total: number, receiptUrl: string }` | MUTATION |
| `get_daily_sales` | `{ shopId?: string }` | `{ count: number, totalAmount: number, sales: array }` | READ_ONLY |
| `get_weekly_sales` | `{ shopId?: string }` | `{ count: number, totalAmount: number, dailyAverage: number }` | READ_ONLY |
| `get_monthly_sales` | `{ shopId?: string }` | `{ count: number, totalAmount: number, salesByDay: object }` | READ_ONLY |
| `get_top_products` | `{ shopId?: string }` | `{ topProducts: array }` | READ_ONLY |

### 3. Inventory Domain
| Tool Name | Parameters | Return Schema | Safety Tier |
| :--- | :--- | :--- | :--- |
| `get_inventory` | `{ shopId?: string }` | `{ totalProducts: number, totalValuation: number, products: array }` | READ_ONLY |
| `get_low_stock` | `{ shopId?: string }` | `{ lowStockCount: number, items: array }` | READ_ONLY |
| `add_stock` | `{ productId?: string, productName?: string, quantity: number }` | `{ productId: string, name: string, newStock: number }` | MUTATION |

### 4. Customers Domain
| Tool Name | Parameters | Return Schema | Safety Tier |
| :--- | :--- | :--- | :--- |
| `search_customer` | `{ name: string, shopId?: string }` | `{ found: boolean, customer: object }` | READ_ONLY |
| `record_payment` | `{ customerName: string, amount: number, notes?: string }` | `{ paymentId: string, customer: string, newBalance: number }` | MUTATION |

---

## 🔒 Parameter Validation Rules
1. **Numeric Guards**: All `amount` and `quantity` fields must be positive finite numbers (`amount > 0`). Negative, `NaN`, or string values that fail parsing are rejected.
2. **Tenant Scoping**: All tool calls automatically resolve the authenticated `shopId`. A merchant cannot pass another shop's identifier to mutate their records.
3. **Prisma Transactions**: All mutations execute inside atomic `prisma.$transaction()` blocks to prevent orphan entries if any validation step triggers a rollback.
