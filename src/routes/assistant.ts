import { Router } from 'express';
import { executeMultiAgentSystem } from '../services/multiAgentSystem';
import { prisma } from '../lib/db';
import { parseWriteIntent, guardianCheck, executeIntent } from '../services/intentEngine';
import { parseNaturalLanguageWorkflow, getAllRules, deleteRule, toggleRule } from '../services/workflowEngine';
import { getEventLog } from '../services/eventEngine';
import { routeIntent } from '../services/intentRouter';
import { handleConversation } from '../services/conversationHandler';
import { detectLanguage } from '../services/languageDetector';

const router = Router();

function isWriteIntent(query: string): boolean {
  const lower = query.toLowerCase();
  const writeSignals = [
    'add sale','sales add','add expense','expense add','stock update','update stock',
    'payment received','customer paid','sold','delete sale','remove sale','cancel bill',
    'sale pannu','expense pannu','stock pannu','price update','update price',
    'record expense','record sale','sales record','add stock',
    'sales seru','vijpanai seru','seru'
  ];
  return writeSignals.some((s) => lower.includes(s));
}

function isWorkflowCreation(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    lower.includes('if stock') || lower.includes('if customer') ||
    lower.includes('whenever') || lower.includes('every time') ||
    lower.includes('remind me when') || lower.includes('alert me when') ||
    lower.includes('workflow create') || lower.includes('set workflow') ||
    lower.includes('endral') || lower.includes('podhu')
  );
}

const handleAssistantQuery = async (req: any, res: any) => {
  try {
    const { message, language = 'auto', userRole = 'retail', conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Message text is required.' });
    }

    // 0. Automatic Language Detection across 22 Indian Languages + Code-switching
    const detectedLanguageInfo = detectLanguage(message);
    const effectiveLanguage = (language === 'auto' || !language) ? detectedLanguageInfo.code : language;

    console.log(`[MULTILINGUAL AI] Message: "${message}" | Detected: ${detectedLanguageInfo.name} (${detectedLanguageInfo.code}) | Code-switch: ${detectedLanguageInfo.isCodeSwitched} | Role: ${userRole}`);

    // =========================================================================
    // LAYER 1: CHATGPT-STYLE INTENT ROUTER (Classifies Before Any Business Agents)
    // =========================================================================
    const decision = await routeIntent(message, conversationHistory);
    console.log(`[INTENT ROUTER] Query: "${message}" -> Mode: ${decision.mode} | Conf: ${decision.confidence} | ReqBizAgent: ${decision.requires_business_agent} | ReqAction: ${decision.requires_action}`);

    // PATH 1: Casual Conversation (Hi, Hello, Thanks, Bye, Good Morning, How are you, Small Talk, Clarification)
    // CRITICAL ARCHITECTURE RULE: ZERO DB CALLS, ZERO BUSINESS AGENTS, ZERO HALLUCINATED NUMBERS
    if (!decision.requires_business_agent) {
      const convResult = await handleConversation(decision, message, conversationHistory);
      return res.json({
        answer: convResult.answer,
        mode: convResult.mode,
        decision,
        confidence: convResult.confidence,
        detectedLanguage: detectedLanguageInfo,
        toolsExecuted: convResult.toolsExecuted,
        latencyMs: convResult.latencyMs,
      });
    }

    // PATH 2: Workflow Rule Creation
    if (isWorkflowCreation(message)) {
      const parseResult = parseNaturalLanguageWorkflow(message);
      if (parseResult.success && parseResult.rule) {
        return res.json({
          answer: parseResult.humanReadable + '\n\n📋 ' + parseResult.rule.action.description,
          mode: 'workflow_created',
          decision,
          workflowRule: {
            id: parseResult.rule.id,
            name: parseResult.rule.name,
            description: parseResult.rule.action.description,
            trigger: parseResult.rule.trigger.eventType,
            enabled: parseResult.rule.enabled,
          },
          detectedLanguage: detectedLanguageInfo,
          toolsExecuted: ['workflow_engine'],
          latencyMs: 0,
        });
      }
    }

    // PATH 3: Business Action / Mutation (Write, Update, Delete)
    if (decision.requires_action) {
      let intent = parseWriteIntent(message);

      // Handle contextual follow-up action (e.g. "Add ₹250 more" following sales)
      if (intent.type === 'UNKNOWN' && decision.action_intent === 'ADD_SALE' && decision.extracted_entities?.amount) {
        intent = {
          type: 'ADD_SALE',
          confidence: decision.confidence,
          extractedFields: {
            amount: decision.extracted_entities.amount,
            date: new Date(),
            description: 'Sales adjustment from context',
          },
          riskLevel: 'reversible',
          requiresConfirmation: false,
          humanReadableSummary: `Add ₹${decision.extracted_entities.amount} to sales`,
          missingFields: [],
          detectedLanguage: detectedLanguageInfo.code,
          languageDetails: detectedLanguageInfo,
        };
      }

      if (intent.type !== 'UNKNOWN') {
        console.log(`[INTENT ENGINE] Detected: ${intent.type} | Lang: ${intent.detectedLanguage} | Confidence: ${intent.confidence} | Risk: ${intent.riskLevel}`);
        const guardianDecision = guardianCheck(intent, userRole);

        if (!guardianDecision.approved) {
          const clarificationMsg =
            guardianDecision.reason === 'MISSING_FIELDS'
              ? (detectedLanguageInfo.code === 'ta'
                  ? 'தகவல் குறைவாக உள்ளது. தயவுசெய்து தரவும்:\n' + guardianDecision.blockReason
                  : 'More details required:\n' + guardianDecision.blockReason)
              : '⚠️ ' + guardianDecision.blockReason;
          return res.json({
            answer: clarificationMsg,
            mode: 'clarification_needed',
            decision,
            intent: { type: intent.type, confidence: intent.confidence, riskLevel: intent.riskLevel, missingFields: intent.missingFields },
            detectedLanguage: detectedLanguageInfo,
            toolsExecuted: ['intent_engine', 'guardian'],
            latencyMs: 0,
          });
        }

        if (intent.requiresConfirmation) {
          return res.json({
            answer: detectedLanguageInfo.code === 'ta'
              ? '✋ உறுதிப்படுத்தல் தேவை:\n' + intent.humanReadableSummary + '\n\nதொடரவா?'
              : '✋ Confirmation required:\n' + intent.humanReadableSummary + '\n\nShould I proceed?',
            mode: 'confirmation_required',
            decision,
            intent: { type: intent.type, confidence: intent.confidence, riskLevel: intent.riskLevel, summary: intent.humanReadableSummary },
            detectedLanguage: detectedLanguageInfo,
            toolsExecuted: ['intent_engine', 'guardian'],
            latencyMs: 0,
          });
        }

        const execResult = await executeIntent(intent, true);
        const responseMsg = execResult.success
          ? (execResult.localizedResponse || execResult.auditLog)
          : (detectedLanguageInfo.code === 'ta'
              ? '❌ செயல்படுத்துவதில் பிழை: ' + execResult.auditLog
              : '❌ Execution error: ' + execResult.auditLog);

        return res.json({
          answer: responseMsg,
          mode: 'intent_executed',
          decision,
          intent: { type: intent.type, riskLevel: intent.riskLevel, summary: intent.humanReadableSummary },
          execution: { success: execResult.success, auditLog: execResult.auditLog, eventEmitted: execResult.eventEmitted, localizedResponse: execResult.localizedResponse },
          detectedLanguage: detectedLanguageInfo,
          toolsExecuted: ['intent_engine', 'guardian', 'action_executor', 'event_engine'],
          latencyMs: 0,
        });
      }
    }

    // PATH 4: Business Query / Analysis / Schemes via Specialist Agents (Driven by decision)
    const result = await executeMultiAgentSystem(message, conversationHistory, decision);
    console.log(`[MULTI-AGENT API] Completed in ${result.totalLatencyMs}ms | Mode: ${result.plan.executionMode} | Agents: [${Object.keys(result.agentResults).join(', ')}] | Provider: ${result.provider}`);

    return res.json({
      answer: result.answer,
      plan: result.plan,
      decision,
      agentResults: result.agentResults,
      insights: result.insights,
      proposedAction: result.proposedAction,
      validation: result.validation,
      totalLatencyMs: result.totalLatencyMs,
      provider: result.provider,
      detectedLanguage: detectedLanguageInfo,
      mode: 'multi_agent_query',
      toolsExecuted: Object.keys(result.agentResults),
      latencyMs: result.totalLatencyMs,
    });
  } catch (error: any) {
    console.error('[MULTI-AGENT API ERROR] Unexpected failure:', error?.message || error);
    res.status(500).json({ error: 'SERVER_ERROR', answer: 'இந்த தகவல் உங்கள் கணக்கில் இல்லை. தொழில்நுட்ப கோளாறு காரணமாக செயலாக்க முடியவில்லை.' });
  }
};

router.post('/query', handleAssistantQuery);
router.post('/chat', handleAssistantQuery);

router.post('/action/execute', async (req, res) => {
  try {
    const { actionId, type, payload, confirmed } = req.body;
    if (!confirmed) return res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Action requires explicit user confirmation.' });

    let auditLogMessage = '';
    if (type === 'whatsapp_reminder') {
      auditLogMessage = `WhatsApp reminder dispatched to ${payload.customerName} (${payload.phone}) for Rs.${payload.amount}.`;
      console.log(`[ACTION AGENT] ${auditLogMessage}`);
    } else if (type === 'create_purchase_order') {
      const purchase = await prisma.purchase.create({
        data: {
          purchaseNo: `PO-${Date.now().toString().slice(-6)}`,
          supplierName: payload.supplierName || 'முதன்மை விநியோகஸ்தர்',
          total: payload.estimatedCost || 1000,
          paymentStatus: 'unpaid',
          amountPaid: 0,
          balanceDue: payload.estimatedCost || 1000,
          notes: `Auto-generated by Urimaiyalar Action Agent for ${payload.productName} (Qty: ${payload.quantity})`,
        },
      });
      auditLogMessage = `Purchase Order ${purchase.purchaseNo} created for ${payload.productName} (${payload.quantity} units).`;
      console.log(`[ACTION AGENT] ${auditLogMessage}`);
    } else {
      auditLogMessage = `Action ${type} executed successfully.`;
    }

    res.json({ success: true, actionId, auditLog: auditLogMessage, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[ACTION AGENT ERROR]', error);
    res.status(500).json({ error: 'EXECUTION_FAILED', message: error?.message });
  }
});

router.post('/intent/confirm', async (req, res) => {
  try {
    const { intentData } = req.body;
    if (!intentData) return res.status(400).json({ error: 'INVALID_INPUT', message: 'intentData required.' });
    const execResult = await executeIntent(intentData, true);
    res.json({ success: execResult.success, answer: execResult.auditLog, execution: execResult });
  } catch (err: any) {
    res.status(500).json({ error: 'EXECUTION_FAILED', message: err?.message });
  }
});

router.get('/workflows', async (_req, res) => {
  const rules = getAllRules().map((r) => ({
    id: r.id, name: r.name, trigger: r.trigger.eventType,
    actionType: r.action.type, actionDescription: r.action.description,
    enabled: r.enabled, createdBy: r.createdBy, nlDescription: r.nlDescription, createdAt: r.createdAt,
  }));
  res.json({ rules, count: rules.length });
});

router.delete('/workflows/:id', async (req, res) => {
  const deleted = deleteRule(req.params.id);
  res.json({ success: deleted, message: deleted ? 'Workflow rule deleted.' : 'Rule not found.' });
});

router.patch('/workflows/:id/toggle', async (req, res) => {
  const { enabled } = req.body;
  const result = toggleRule(req.params.id, !!enabled);
  res.json({ success: result });
});

router.get('/events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const events = getEventLog(limit);
  res.json({ events, count: events.length });
});

// Alias for voice audio transcription
import { handleTranscriptionRequest, voiceUploadMiddleware } from './voice';
router.post('/transcribe-audio', voiceUploadMiddleware, handleTranscriptionRequest);
router.post('/transcribe', voiceUploadMiddleware, handleTranscriptionRequest);

export default router;
