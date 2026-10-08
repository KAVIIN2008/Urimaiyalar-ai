// src/services/llm/ModelRouter.ts
// ============================================================================
// URIMAIYALAR OS — INTELLIGENT MODEL ROUTER
// Assigns optimal models based on query intent, latency, and reasoning depth
// ============================================================================

export type TaskComplexity = 'fast' | 'structured' | 'reasoning' | 'rag';

export interface RouteDecision {
  complexity: TaskComplexity;
  recommendedModel: string;
  maxTokens: number;
  temperature: number;
  rationale: string;
}

export class ModelRouter {
  static routeByIntent(intentCategory: string): RouteDecision {
    const norm = (intentCategory || '').toUpperCase();

    // 1. Ultra-fast conversational path
    if (['GREETING', 'FAREWELL', 'SMALL_TALK', 'HELP', 'CLARIFICATION'].includes(norm)) {
      return {
        complexity: 'fast',
        recommendedModel: 'llama-3.1-8b-instant',
        maxTokens: 256,
        temperature: 0.6,
        rationale: 'Casual conversational turn requiring minimal latency and zero business computation.',
      };
    }

    // 2. Structured Action / Tool Calling
    if (['BUSINESS_ACTION', 'CREATE_SALE', 'RECORD_PAYMENT', 'UPDATE_STOCK'].includes(norm)) {
      return {
        complexity: 'structured',
        recommendedModel: 'llama-3.3-70b-versatile',
        maxTokens: 512,
        temperature: 0.1,
        rationale: 'High-precision entity extraction for database mutation requiring strict schema fidelity.',
      };
    }

    // 3. Deep Business Analysis & Multi-period Comparisons
    if (['BUSINESS_ANALYSIS', 'COMPARE_PERIODS', 'ANALYZE_PROFIT'].includes(norm)) {
      return {
        complexity: 'reasoning',
        recommendedModel: 'llama-3.3-70b-versatile',
        maxTokens: 1536,
        temperature: 0.3,
        rationale: 'Deep financial multi-agent reasoning, variance analysis, and explanatory synthesis.',
      };
    }

    // 4. Grounded Knowledge & Government Schemes RAG
    if (['SCHEME_QUERY', 'KNOWLEDGE_QUERY', 'RAG_QUERY'].includes(norm)) {
      return {
        complexity: 'rag',
        recommendedModel: 'llama-3.3-70b-versatile',
        maxTokens: 1024,
        temperature: 0.2,
        rationale: 'Document grounding, statutory cap computation, and verified portal citation.',
      };
    }

    // Default: Standard Business Query
    return {
      complexity: 'structured',
      recommendedModel: 'llama-3.3-70b-versatile',
      maxTokens: 512,
      temperature: 0.2,
      rationale: 'Standard business ledger retrieval and summarization.',
    };
  }
}
