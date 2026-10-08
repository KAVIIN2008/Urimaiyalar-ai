// src/services/llm/GroqProvider.ts
// ============================================================================
// URIMAIYALAR OS — GROQ HIGH-SPEED INFERENCE PROVIDER
// Uses ultra-fast LPU inference (Llama 3.3 70B & Llama 3.1 8B)
// ============================================================================

import { LLMProvider, ChatMessage, LLMRequestOptions, LLMResponse } from './LLMProvider';

export class GroqProvider implements LLMProvider {
  readonly name = 'Groq';
  private apiKey: string;
  private modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async chat(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('[GroqProvider] GROQ_API_KEY is not configured in server environment.');
    }

    const candidateModels = options?.model 
      ? [options.model, ...this.modelsToTry.filter(m => m !== options.model)]
      : this.modelsToTry;

    let lastError: any = null;

    for (const model of candidateModels) {
      const payload: any = {
        model,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 1024,
      };

      if (options?.responseFormat === 'json') {
        payload.response_format = { type: 'json_object' };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 20000);

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[GroqProvider] Model ${model} returned ${res.status}: ${errText.slice(0, 100)}... trying next Groq model`);
          lastError = new Error(`API Error (${res.status}): ${errText}`);
          continue;
        }

        const data = (await res.json()) as any;
        const text = data.choices?.[0]?.message?.content || '';
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;

        return {
          content: text,
          provider: this.name,
          model,
          tokensUsed: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
          },
          totalTokens: promptTokens + completionTokens,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err;
        console.warn(`[GroqProvider] Model ${model} fetch failed: ${err.message}... trying next Groq model`);
      }
    }

    throw new Error(`[GroqProvider] All Groq models failed. Last error: ${lastError?.message}`);
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: LLMRequestOptions): Promise<T> {
    const systemPrompt = `You are a strict, structured AI engine for Urimaiyalar OS.
You must output ONLY valid JSON matching this schema:
${schemaDescription}
Do NOT include markdown formatting or backticks around the JSON.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.chat(messages, {
      ...options,
      responseFormat: 'json',
      model: options?.model || this.modelsToTry[0],
    });

    try {
      const cleanJson = response.content.replace(/^```json/i, '').replace(/```$/i, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err: any) {
      throw new Error(`[GroqProvider] Failed to parse structured output: ${err.message}. Raw: ${response.content}`);
    }
  }
}
