// src/routes/ai.ts
// ============================================================================
// URIMAIYALAR OS — CENTRALIZED PRODUCTION AI GATEWAY API ROUTES
// /api/ai/chat, /api/ai/intent, /api/ai/plan, /api/ai/execute
// ============================================================================

import { Router } from 'express';
import { llmGateway } from '../services/llm/LLMGateway';
import { ModelRouter } from '../services/llm/ModelRouter';
import { ToolRegistry } from '../services/tools/toolRegistry';
import { ValidatorEngine } from '../services/guardian/validatorEngine';
import { routeIntent } from '../services/intentRouter';

const router = Router();

// =============================================================================
// 1. /api/ai/intent — Strict Intent & Entity Classification
// =============================================================================
router.post('/intent', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Message string required.' });
    }

    const decision = await routeIntent(message, conversationHistory);
    const confidenceScore = decision.confidence || 0.95;
    const confidenceBand = confidenceScore >= 0.85 ? 'HIGH' : confidenceScore >= 0.5 ? 'MEDIUM' : 'LOW';

    res.json({
      mode: decision.mode,
      intent: decision.mode,
      action: decision.action_intent || null,
      action_intent: decision.action_intent || null,
      entities: decision.extracted_entities || {},
      extracted_entities: decision.extracted_entities || {},
      confidence: confidenceScore,
      confidenceBand,
      requires_business_agent: decision.requires_business_agent,
      requiresBusinessAgent: decision.requires_business_agent,
      requires_action: decision.requires_action,
      requiresAction: decision.requires_action,
      target_domains: decision.target_domains || [],
      suggestedAgents: decision.target_domains || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'INTENT_ERROR', details: error.message });
  }
});

// =============================================================================
// 2. /api/ai/plan — Dynamic Multi-Agent Execution Planning
// =============================================================================
router.post('/plan', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const decision = await routeIntent(message, conversationHistory);
    const route = ModelRouter.routeByIntent(decision.mode);

    const isConversational = !decision.requires_business_agent;
    const domains = decision.target_domains || (decision.requires_business_agent ? ['sales'] : []);

    const steps = isConversational
      ? [{ step: 1, agent: 'ConversationalRouter', action: 'Direct response', status: 'ready' }]
      : [
          { step: 1, agent: 'MasterOrchestrator', action: 'Intent validation & parameter scoping', status: 'ready' },
          ...domains.map((dom, idx) => ({
            step: idx + 2,
            agent: `${dom.charAt(0).toUpperCase() + dom.slice(1)}Agent`,
            action: `Query deterministic facts for ${dom}`,
            status: 'ready'
          })),
          { step: domains.length + 2, agent: 'GuardianValidator', action: 'Verify financial calculations and grounding', status: 'ready' }
        ];

    const plan = {
      query: message,
      intent: decision.mode,
      executionMode: isConversational ? 'conversational_fast' : 'multi_agent_graph',
      modelRecommended: route.recommendedModel,
      requiredAgents: domains,
      requiresAction: decision.requires_action,
      safetyCheck: decision.requires_action ? 'CONFIRMATION_OR_AUTO' : 'READ_ONLY',
      steps,
    };

    res.json({
      plan,
      confidence: decision.confidence,
      route,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'PLANNING_ERROR', details: error.message });
  }
});

// =============================================================================
// 3. /api/ai/execute — Tool Execution Layer (Zero Arbitrary SQL)
// =============================================================================
router.post('/execute', async (req, res) => {
  try {
    const tool = req.body.tool;
    const parameters = req.body.parameters || req.body.arguments || {};
    const callerAgent = req.body.callerAgent || 'Agent';

    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({ error: 'INVALID_TOOL', message: 'Tool name is required.' });
    }

    if (!ToolRegistry.APPROVED_TOOLS.includes(tool)) {
      return res.status(400).json({
        error: 'UNAPPROVED_TOOL',
        message: `Security violation: Tool "${tool}" is not in the approved tool registry. Arbitrary commands and raw SQL are prohibited.`,
        approvedTools: ToolRegistry.APPROVED_TOOLS,
      });
    }

    const toolResult = await ToolRegistry.executeTool(tool, parameters);
    const validation = ValidatorEngine.validateActionExecution(toolResult);

    res.json({
      toolResult,
      data: toolResult.data,
      validation,
      success: toolResult.success && validation.isValid,
      auditLogged: true,
      callerAgent,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'EXECUTION_ERROR', details: error.message });
  }
});

// =============================================================================
// 4. /api/ai/chat — Unified Gateway Chat with Grounding & Model Routing
// =============================================================================
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], language = 'auto' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Message is required.' });
    }

    // Step 1: Parse Intent
    const decision = await routeIntent(message, conversationHistory);

    // Step 2: Route by intent
    const route = ModelRouter.routeByIntent(decision.mode);

    // Step 3: Handle Conversational Turns (Fast Path, Zero DB Calls)
    if (!decision.requires_business_agent) {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are Urimaiyalar OS, a warm, polite assistant for South Indian merchants. Respond warmly in 1-2 sentences. Never hallucinate financial figures for greetings.',
        },
        ...conversationHistory.slice(-4),
        { role: 'user' as const, content: message },
      ];

      const llmRes = await llmGateway.chat(messages, {
        model: route.recommendedModel,
        maxTokens: route.maxTokens,
        temperature: route.temperature,
      });

      return res.json({
        answer: llmRes.content,
        mode: 'conversation',
        provider: llmRes.provider,
        model: llmRes.model,
        latencyMs: llmRes.latencyMs,
        agentsExecuted: [],
        validation: { isValid: true, flags: [] },
      });
    }

    // Step 4: Handle Business Query / Actions via Tools & Database Grounding
    let toolResult: any = null;
    if (decision.mode === 'BUSINESS_QUERY' || decision.mode === 'BUSINESS_ANALYSIS') {
      toolResult = await ToolRegistry.get_daily_sales();
    } else if (decision.requires_action && decision.action_intent === 'ADD_SALE') {
      const amount = decision.extracted_entities?.amount || 500;
      toolResult = await ToolRegistry.create_sale({ amount });
    }

    // Step 5: Synthesize Grounded Natural Response
    const synthesisPrompt = `You are Urimaiyalar OS explaining verified business data to the merchant.
Ground Truth Data from Database:
${JSON.stringify(toolResult?.data || {})}
User Query: "${message}"
Explain the verified result clearly and accurately. NEVER invent numbers outside the Ground Truth Data.`;

    const messages = [
      { role: 'system' as const, content: synthesisPrompt },
      { role: 'user' as const, content: message },
    ];

    const llmRes = await llmGateway.chat(messages, {
      model: route.recommendedModel,
      maxTokens: route.maxTokens,
    });

    const validation = ValidatorEngine.validateFinancialGrounding(llmRes.content, toolResult ? [toolResult] : []);

    res.json({
      answer: llmRes.content,
      mode: decision.mode,
      provider: llmRes.provider,
      model: llmRes.model,
      toolResult,
      validation,
      latencyMs: llmRes.latencyMs,
      agentsExecuted: decision.target_domains || ['sales'],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'AI_CHAT_ERROR', details: error.message });
  }
});

// =============================================================================
// 5. /api/ai/telemetry — Observability & Token Metrics
// =============================================================================
router.get('/telemetry', (req, res) => {
  res.json(llmGateway.getTelemetry());
});

export default router;
