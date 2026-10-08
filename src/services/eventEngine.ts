import { prisma } from '../lib/db';

// ============================================================================
// 1. TYPED BUSINESS EVENTS
// ============================================================================

export type BusinessEventType =
  | 'SALE_CREATED'
  | 'SALE_DELETED'
  | 'EXPENSE_RECORDED'
  | 'STOCK_UPDATED'
  | 'STOCK_LOW_ALERT'
  | 'PURCHASE_CREATED'
  | 'CUSTOMER_PAYMENT_RECEIVED'
  | 'CUSTOMER_DUES_UPDATED'
  | 'WORKFLOW_TRIGGERED'
  | 'PROFIT_RECALCULATED';

export interface BusinessEvent<T = any> {
  id: string;
  type: BusinessEventType;
  payload: T;
  triggeredBy: 'user_action' | 'ai_agent' | 'automation_rule' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EventListener {
  id: string;
  eventType: BusinessEventType;
  handler: (event: BusinessEvent) => Promise<void>;
  description: string;
}

// In-memory event log (ring buffer, last 200 events)
const MAX_EVENT_LOG = 200;
const eventLog: BusinessEvent[] = [];

// ============================================================================
// 2. EVENT BUS
// ============================================================================

const listeners: Map<BusinessEventType, EventListener[]> = new Map();

export function onEvent(eventType: BusinessEventType, handler: EventListener['handler'], description = ''): string {
  const id = `listener_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = listeners.get(eventType) || [];
  existing.push({ id, eventType, handler, description });
  listeners.set(eventType, existing);
  return id;
}

export function offEvent(listenerId: string): void {
  for (const [type, arr] of listeners.entries()) {
    listeners.set(type, arr.filter((l) => l.id !== listenerId));
  }
}

export async function emitEvent<T = any>(
  type: BusinessEventType,
  payload: T,
  triggeredBy: BusinessEvent['triggeredBy'] = 'system',
  meta?: Record<string, any>
): Promise<BusinessEvent<T>> {
  const event: BusinessEvent<T> = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    triggeredBy,
    timestamp: new Date(),
    metadata: meta,
  };

  eventLog.push(event);
  if (eventLog.length > MAX_EVENT_LOG) eventLog.shift();

  console.log(`[EVENT ENGINE] 🔔 ${type} | by: ${triggeredBy} | id: ${event.id}`);

  const handlers = listeners.get(type) || [];
  for (const l of handlers) {
    try {
      await l.handler(event);
    } catch (err: any) {
      console.error(`[EVENT ENGINE] Listener "${l.description}" failed for ${type}:`, err?.message);
    }
  }

  return event;
}

export function getEventLog(limit = 50): BusinessEvent[] {
  return eventLog.slice(-limit).reverse();
}

// ============================================================================
// 3. CORE AUTOMATION HANDLERS
// ============================================================================

async function onSaleCreatedHandler(event: BusinessEvent<{ saleId: number; items: Array<{ productId: number; qty: number }> }>): Promise<void> {
  const { items } = event.payload;
  if (!items?.length) return;
  for (const item of items) {
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.qty } },
      });
    } catch { /* best-effort */ }
  }
  await emitEvent('PROFIT_RECALCULATED', { triggeredBy: 'sale_created' }, 'automation_rule');
}

async function onExpenseRecordedHandler(event: BusinessEvent): Promise<void> {
  console.log(`[AUTOMATION] Expense recorded: Rs.${event.payload?.amount} — recalculating P&L...`);
  await emitEvent('PROFIT_RECALCULATED', { triggeredBy: 'expense_recorded', amount: event.payload?.amount }, 'automation_rule');
}

async function onProfitRecalculatedHandler(event: BusinessEvent): Promise<void> {
  console.log(`[AUTOMATION] P&L snapshot triggered by: ${event.payload?.triggeredBy}`);
}

async function onStockLowAlertHandler(event: BusinessEvent<{ items: any[] }>): Promise<void> {
  const items = event.payload?.items || [];
  for (const item of items) {
    console.warn(`[AUTOMATION] 🚨 LOW STOCK: "${item.name}" — only ${item.currentStock} ${item.unit} remaining!`);
    await emitEvent('WORKFLOW_TRIGGERED', { rule: 'low_stock_alert', productId: item.id, productName: item.name, currentStock: item.currentStock }, 'automation_rule');
  }
}

async function onCustomerPaymentHandler(event: BusinessEvent<{ customerId: number; amount: number }>): Promise<void> {
  const { customerId, amount } = event.payload;
  if (!customerId || !amount) return;
  try {
    await prisma.customer.update({ where: { id: customerId }, data: { totalUdhar: { decrement: amount } } });
    console.log(`[AUTOMATION] Customer ${customerId} payment Rs.${amount} applied.`);
    await emitEvent('CUSTOMER_DUES_UPDATED', { customerId, amountPaid: amount }, 'automation_rule');
  } catch (err: any) {
    console.error(`[AUTOMATION] Customer payment update failed:`, err?.message);
  }
}

// ============================================================================
// 4. BOOTSTRAP
// ============================================================================

let isBootstrapped = false;

export function bootstrapEventEngine(): void {
  if (isBootstrapped) return;
  isBootstrapped = true;
  onEvent('SALE_CREATED', onSaleCreatedHandler, 'Auto-decrement stock + trigger P&L recalculation');
  onEvent('EXPENSE_RECORDED', onExpenseRecordedHandler, 'Trigger P&L on expense');
  onEvent('PROFIT_RECALCULATED', onProfitRecalculatedHandler, 'Log P&L snapshot');
  onEvent('STOCK_LOW_ALERT', onStockLowAlertHandler, 'Alert on low stock');
  onEvent('CUSTOMER_PAYMENT_RECEIVED', onCustomerPaymentHandler, 'Update customer dues');
  console.log('[EVENT ENGINE] Bootstrapped with 5 core automation listeners');
}
