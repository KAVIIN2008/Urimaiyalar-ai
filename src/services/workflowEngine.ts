import { prisma } from '../lib/db';
import { onEvent } from './eventEngine';

// ============================================================================
// 1. WORKFLOW RULE SCHEMA
// ============================================================================

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: {
    eventType: string;
    condition: (payload: any, context?: any) => boolean;
  };
  action: {
    type: 'notify' | 'remind' | 'create_order' | 'log' | 'update_db';
    execute: (payload: any, context?: any) => Promise<WorkflowActionResult>;
    description: string;
  };
  enabled: boolean;
  createdAt: Date;
  createdBy: 'system' | 'user_natural_language';
  nlDescription?: string; // The original NL text the user typed
}

export interface WorkflowActionResult {
  success: boolean;
  message: string;
  data?: any;
}

// In-memory rule store
const workflowRules: Map<string, WorkflowRule> = new Map();

export function getAllRules(): WorkflowRule[] {
  return Array.from(workflowRules.values());
}

export function getRuleById(id: string): WorkflowRule | undefined {
  return workflowRules.get(id);
}

export function deleteRule(id: string): boolean {
  return workflowRules.delete(id);
}

export function toggleRule(id: string, enabled: boolean): boolean {
  const rule = workflowRules.get(id);
  if (!rule) return false;
  rule.enabled = enabled;
  return true;
}

// ============================================================================
// 2. NATURAL LANGUAGE → WORKFLOW RULE PARSER
// ============================================================================

export interface NLWorkflowParseResult {
  success: boolean;
  rule?: WorkflowRule;
  error?: string;
  confidence: number;
  humanReadable: string;
}

export function parseNaturalLanguageWorkflow(nlText: string): NLWorkflowParseResult {
  const lower = nlText.toLowerCase();

  // ---- PATTERN 1: "If stock < N, remind me" ----
  const stockLowMatch = lower.match(/(?:if|when|whenever|என்றால்|போது)\s+(?:stock|சரக்கு|இருப்பு)\s+(?:of\s+)?([a-zA-Z\u0B80-\u0BFF\s]{2,20}?)?\s*(?:<|less than|below|குறைவாக|கீழ்|than)\s*(\d+)/);
  if (stockLowMatch) {
    const productName = stockLowMatch[1]?.trim() || null;
    const threshold = parseInt(stockLowMatch[2]);
    const ruleId = `wf_stock_low_${Date.now()}`;

    const rule: WorkflowRule = {
      id: ruleId,
      name: `Low Stock Alert${productName ? ` (${productName})` : ''}`,
      trigger: {
        eventType: 'STOCK_LOW_ALERT',
        condition: (payload) => {
          const items = payload?.items || [payload];
          return items.some((item: any) => {
            if (productName) return item.name?.toLowerCase().includes(productName.toLowerCase()) && item.currentStock < threshold;
            return item.currentStock < threshold;
          });
        },
      },
      action: {
        type: 'notify',
        description: `Alert when ${productName || 'any product'} stock drops below ${threshold}`,
        execute: async (payload) => {
          const items = payload?.items || [payload];
          const triggered = items.filter((i: any) => i.currentStock < threshold);
          const msg = `🚨 LOW STOCK WORKFLOW ALERT: ${triggered.map((i: any) => `${i.name}: ${i.currentStock} remaining`).join(', ')}`;
          console.log(`[WORKFLOW] ${msg}`);
          return { success: true, message: msg, data: triggered };
        },
      },
      enabled: true,
      createdAt: new Date(),
      createdBy: 'user_natural_language',
      nlDescription: nlText,
    };

    workflowRules.set(ruleId, rule);
    registerWorkflowEventHandler(rule);

    return {
      success: true,
      rule,
      confidence: 0.93,
      humanReadable: `✅ Workflow created: Alert me when ${productName || 'any product'} stock goes below ${threshold} units.`,
    };
  }

  // ---- PATTERN 2: "If customer due > N, send reminder" ----
  const dueHighMatch = lower.match(/(?:if|when|whenever|என்றால்|போது)\s+(?:customer|வாடிக்கையாளர்|due|கடன்|பாக்கி)\s+(?:due|balance|amount)?\s*(?:>|more than|above|அதிகமாக)\s*(\d+)/);
  if (dueHighMatch) {
    const threshold = parseInt(dueHighMatch[1]);
    const ruleId = `wf_due_high_${Date.now()}`;

    const rule: WorkflowRule = {
      id: ruleId,
      name: `High Customer Due Alert (>₹${threshold})`,
      trigger: {
        eventType: 'CUSTOMER_DUES_UPDATED',
        condition: (payload) => (payload?.totalDue || payload?.amountDue || 0) > threshold,
      },
      action: {
        type: 'remind',
        description: `Send reminder when customer due exceeds ₹${threshold}`,
        execute: async (payload) => {
          const msg = `💳 DUE ALERT: Customer ID ${payload?.customerId} owes more than ₹${threshold}. Consider sending a WhatsApp reminder.`;
          console.log(`[WORKFLOW] ${msg}`);
          return { success: true, message: msg };
        },
      },
      enabled: true,
      createdAt: new Date(),
      createdBy: 'user_natural_language',
      nlDescription: nlText,
    };

    workflowRules.set(ruleId, rule);
    registerWorkflowEventHandler(rule);

    return {
      success: true,
      rule,
      confidence: 0.88,
      humanReadable: `✅ Workflow created: Remind me when any customer's due exceeds ₹${threshold}.`,
    };
  }

  // ---- PATTERN 3: "Every time I add a sale, update profit dashboard" ----
  const saleCreatedMatch = lower.match(/(?:every time|whenever|each time|whenever|ஒவ்வொரு முறையும்|விற்பனை|sale).*(?:sale|விற்பனை).*(?:update|recalculate|refresh|காட்டு|profit|dashboard)/);
  if (saleCreatedMatch) {
    const ruleId = `wf_sale_profit_${Date.now()}`;
    const rule: WorkflowRule = {
      id: ruleId,
      name: 'Auto-Refresh Profit on Sale',
      trigger: { eventType: 'SALE_CREATED', condition: () => true },
      action: {
        type: 'log',
        description: 'Recalculate and log profit snapshot after each sale',
        execute: async (payload) => {
          console.log(`[WORKFLOW] Sale created (ID: ${payload?.saleId}) — profit dashboard refresh triggered.`);
          return { success: true, message: 'Profit dashboard refresh event fired.' };
        },
      },
      enabled: true,
      createdAt: new Date(),
      createdBy: 'user_natural_language',
      nlDescription: nlText,
    };
    workflowRules.set(ruleId, rule);
    registerWorkflowEventHandler(rule);
    return { success: true, rule, confidence: 0.85, humanReadable: '✅ Workflow created: Profit dashboard will refresh after every sale.' };
  }

  return {
    success: false,
    confidence: 0,
    humanReadable: '❌ Workflow pattern not recognized. Try: "If stock < 20, remind me" or "If customer due > 5000, send reminder"',
    error: 'No matching workflow pattern found.',
  };
}

// ============================================================================
// 3. RUNTIME — Register rule handlers on event bus
// ============================================================================

function registerWorkflowEventHandler(rule: WorkflowRule): void {
  onEvent(rule.trigger.eventType as any, async (event) => {
    if (!rule.enabled) return;
    if (rule.trigger.condition(event.payload)) {
      const result = await rule.action.execute(event.payload);
      console.log(`[WORKFLOW] Rule "${rule.name}" executed: ${result.message}`);
    }
  }, `Workflow: ${rule.name}`);
}

// ============================================================================
// 4. BUILT-IN SYSTEM WORKFLOWS
// ============================================================================

export function bootstrapDefaultWorkflows(): void {
  // System rule: auto-create purchase order draft when stock is critically low (< 5 units)
  const criticalStockRule: WorkflowRule = {
    id: 'sys_critical_stock_order',
    name: 'Critical Stock Auto-Draft Order',
    trigger: {
      eventType: 'WORKFLOW_TRIGGERED',
      condition: (payload) => payload?.rule === 'low_stock_alert' && payload?.currentStock < 5,
    },
    action: {
      type: 'create_order',
      description: 'Auto-draft purchase order when stock < 5',
      execute: async (payload) => {
        const msg = `🛒 CRITICAL STOCK DRAFT: "${payload?.productName}" has only ${payload?.currentStock} units. Auto-draft purchase order suggested.`;
        console.log(`[WORKFLOW] ${msg}`);
        return { success: true, message: msg, data: { productId: payload?.productId, suggestedQty: 50 } };
      },
    },
    enabled: true,
    createdAt: new Date(),
    createdBy: 'system',
  };
  workflowRules.set(criticalStockRule.id, criticalStockRule);
  registerWorkflowEventHandler(criticalStockRule);
  console.log('[WORKFLOW ENGINE] Bootstrapped default workflows.');
}
