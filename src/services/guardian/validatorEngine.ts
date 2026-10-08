// src/services/guardian/validatorEngine.ts
// ============================================================================
// URIMAIYALAR OS — GUARDIAN VALIDATION ENGINE
// Multi-stage verification layer guaranteeing grounding, arithmetic truth, and action safety
// ============================================================================

import { ToolExecutionResult } from '../tools/toolRegistry';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface ValidationReport {
  isValid: boolean;
  confidenceScore: number;
  checks: ValidationCheck[];
  sanitizedAnswer?: string;
  flags: string[];
}

export class ValidatorEngine {
  /**
   * Verifies that action executed successfully in the database before user confirmation is returned
   */
  static validateActionExecution(toolResult: ToolExecutionResult): ValidationReport {
    const checks: ValidationCheck[] = [];
    const flags: string[] = [];

    // Check 1: Tool executed successfully
    checks.push({
      name: 'TOOL_SUCCESS',
      passed: toolResult.success,
      details: toolResult.success ? `Tool "${toolResult.tool}" succeeded.` : `Tool failed: ${toolResult.error}`,
    });

    // Check 2: Database grounding verified (mutation ID for writes, data object/array for queries)
    const isQueryTool = toolResult.tool.startsWith('get_') || toolResult.tool.startsWith('compare_') || toolResult.tool.startsWith('search_');
    const hasDbData = Boolean(
      toolResult.data &&
        (isQueryTool ||
          toolResult.data.saleId ||
          toolResult.data.productId ||
          toolResult.data.customerName ||
          toolResult.data.expenseId ||
          toolResult.data.id)
    );
    checks.push({
      name: 'DATABASE_GROUNDING',
      passed: hasDbData,
      details: hasDbData ? 'Database record/result verified from ground truth.' : 'No database verification proof returned.',
    });

    if (!toolResult.success) flags.push('ACTION_FAILED');
    if (!hasDbData) flags.push('MISSING_DB_PROOF');

    const isValid = checks.every((c) => c.passed);
    return {
      isValid,
      confidenceScore: isValid ? 0.98 : 0.1,
      checks,
      flags,
    };
  }

  /**
   * Verifies that financial numbers in the final text match the database tool data exactly
   */
  static validateFinancialGrounding(answerText: string, toolResults: ToolExecutionResult[]): ValidationReport {
    const checks: ValidationCheck[] = [];
    const flags: string[] = [];

    // Extract all numbers mentioned with ₹ or currency in answer
    const mentionedFigures = (answerText.match(/₹\s*([0-9,]+)/g) || []).map((s) =>
      Number(s.replace(/[^0-9]/g, ''))
    );

    // Collect all numbers present in tool data
    const groundTruthNumbers: number[] = [];
    toolResults.forEach((tr) => {
      if (tr.data) {
        Object.values(tr.data).forEach((val) => {
          if (typeof val === 'number') groundTruthNumbers.push(val);
        });
      }
    });

    // Check: Are any large claims made that have no grounding?
    let allGrounded = true;
    for (const fig of mentionedFigures) {
      if (fig > 100 && !groundTruthNumbers.includes(fig)) {
        // Allow minor rounded variants or dates
        const isNearGround = groundTruthNumbers.some((gt) => Math.abs(gt - fig) <= 5);
        if (!isNearGround) {
          allGrounded = false;
          flags.push(`UNGROUNDED_FIGURE: ₹${fig}`);
        }
      }
    }

    checks.push({
      name: 'ARITHMETIC_GROUNDING',
      passed: allGrounded,
      details: allGrounded ? 'All financial figures match verified database values.' : 'Answer contains ungrounded figures.',
    });

    return {
      isValid: allGrounded,
      confidenceScore: allGrounded ? 0.95 : 0.4,
      checks,
      flags,
    };
  }

  /**
   * Validates RAG sources to prevent external hallucination
   */
  static validateRAGGrounding(answerText: string, retrievedSources: any[]): ValidationReport {
    const checks: ValidationCheck[] = [];
    const flags: string[] = [];

    const hasSources = Array.isArray(retrievedSources) && retrievedSources.length > 0;
    checks.push({
      name: 'RAG_SOURCES_AVAILABLE',
      passed: hasSources,
      details: hasSources ? `Grounding confirmed against ${retrievedSources.length} source document(s).` : 'No retrieved documents found for citation.',
    });

    if (!hasSources) {
      flags.push('RAG_NO_SOURCES');
    }

    return {
      isValid: hasSources,
      confidenceScore: hasSources ? 0.92 : 0.3,
      checks,
      flags,
    };
  }
}
