/**
 * URIMAIYALAR AI - Core Type Definitions
 * "Your Business Memory. Your Business Intelligence."
 */

export type LanguageCode =
  | 'ta'
  | 'en'
  | 'tanglish'
  | 'hi'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'or'
  | 'as'
  | 'ur'
  | 'ne'
  | 'sa'
  | 'kok'
  | 'ks'
  | 'doi'
  | 'mai'
  | 'mni'
  | 'sat'
  | 'sd'
  | 'brx'
  | (string & {});

export interface BusinessProfile {
  id: string;
  name: string;
  businessName: string;
  businessNameTa: string;
  businessType: string;
  district: string;
  state: string;
  address: string;
  phone: string;
  currency: string;
  preferredLanguage: LanguageCode;
  gstStatus: boolean;
  gstNumber?: string;
  startDate: string;
  employeeCount: number;
}

export type UnitType = 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'bag' | 'box' | 'packet';

export interface Product {
  id: string;
  name: string;
  nameTa: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  supplierName?: string;
  salesVelocity?: 'fast' | 'medium' | 'slow';
  lastUpdated: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string | Date;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentType: 'cash' | 'credit' | 'upi' | 'partial';
  amountPaid: number;
  balanceDue: number;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  costPrice?: number;
  unitCost?: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  invoiceNumber?: string;
  date: string | Date;
  supplierId?: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  totalAmount?: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  amountPaid: number;
  balanceDue: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  nameTa?: string;
  phone: string;
  address: string;
  creditLimit?: number;
  totalPurchases: number;
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
  totalUdhar?: number;
  lastTransactionDate: string;
  purchaseCount: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address: string;
  city?: string;
  productsSupplied: string[];
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  outstandingPayable?: number;
  lastPurchaseDate: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'transport'
  | 'salary'
  | 'packaging'
  | 'maintenance'
  | 'marketing'
  | 'tea_snacks'
  | 'tea_refreshments'
  | 'utilities'
  | 'miscellaneous'
  | 'other'
  | (string & {});

export interface Expense {
  id: string;
  title: string;
  titleTa?: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  date: string | Date;
  paymentMode?: 'cash' | 'upi' | 'bank';
  notes?: string;
}

export interface CreditRecord {
  id: string;
  type: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  partyPhone: string;
  totalCredit: number;
  amountPaid: number;
  outstandingAmount: number;
  dueDate: string;
  status: 'active' | 'overdue' | 'cleared';
  lastReminderDate?: string;
  history: {
    date: string;
    type: 'credit_added' | 'payment_received';
    amount: number;
    note: string;
  }[];
}

export interface BusinessMemory {
  id: string;
  timestamp: string;
  title: string;
  titleTa?: string;
  description: string;
  content?: string;
  contentTa?: string;
  category: 'sale' | 'purchase' | 'credit_promise' | 'customer_note' | 'inventory' | 'decision' | 'observation' | string;
  entityName?: string;
  relatedEntityName?: string;
  tags: string[];
  importance?: 'low' | 'medium' | 'high';
  pinned?: boolean;
  createdDate?: string;
}

export type AlertType =
  | 'LOW_STOCK'
  | 'CREDIT_OVERDUE'
  | 'SALES_DROP'
  | 'PROFIT_DROP'
  | 'EXPENSE_INCREASE'
  | 'PAYMENT_DUE'
  | 'SCHEME_MATCH'
  | 'OPPORTUNITY';

export interface BusinessAlert {
  id: string;
  type: AlertType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  date: string;
  read: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  nameTa: string;
  department: string;
  description: string;
  descriptionTa: string;
  eligibility: string[];
  maxSubsidy: string;
  subsidyPercent?: number;
  targetBeneficiaries: string;
  documents: string[];
  officialUrl: string;
  lastVerified: string;
}

export type GovtScheme = GovernmentScheme;

export interface MarketCommodity {
  id: string;
  name: string;
  nameTa: string;
  commodityName?: string;
  commodityNameTa?: string;
  marketLocation: string;
  mandiLocation?: string;
  currentPrice: number;
  currentWholesalePrice?: number;
  previousPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable' | 'UP' | 'DOWN' | 'STABLE';
  changePercent?: number;
  changeAmount?: number;
  insight: string;
  insightTa: string;
  lastUpdated?: string;
}

export interface FinancialSummary {
  todaySales: number;
  todayExpenses: number;
  todayProfit?: number;
  todayCostOfGoods?: number;
  todayGrossProfit?: number;
  todayNetProfit?: number;
  monthlySales: number;
  monthlyExpenses: number;
  monthlyCostOfGoods: number;
  monthlyGrossProfit: number;
  monthlyNetProfit: number;
  profitMarginPercent: number;
  customerCreditOutstanding: number;
  supplierCreditOutstanding?: number;
  supplierPayablesOutstanding?: number;
  totalStockValue?: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface BusinessHealthScore {
  overall: number; // 0-100
  profitScore: number;
  inventoryScore: number;
  creditScore: number;
  expenseScore: number;
  customerScore: number;
  status: 'Excellent' | 'Healthy' | 'Moderate' | 'Needs Attention' | string;
  statusTa: string;
  analysis: string;
}

export interface IntentEntityExtraction {
  intent: string;
  language: LanguageCode;
  confidence: number;
  entities: {
    customer?: string;
    customerName?: string;
    supplier?: string;
    supplierName?: string;
    product?: string;
    productName?: string;
    quantity?: number;
    unit?: string;
    amount?: number;
    date?: string;
    paymentType?: string;
    paymentMode?: string;
    category?: string;
    expenseCategory?: string;
    memoryContent?: string;
    [key: string]: any;
  };
  requiresConfirmation: boolean;
  confirmationPromptTa?: string;
  confirmationPromptEn?: string;
  rawText: string;
}

export interface AssistantResponse {
  answer: string;
  answerTa: string;
  intent: string;
  verifiedData?: Record<string, any>;
  sources: string[];
  suggestedQuestions?: string[];
  actionPrompt?: IntentEntityExtraction;
}
