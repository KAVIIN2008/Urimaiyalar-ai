// src/services/llm/OpenAICompatibleProvider.ts
// ============================================================================
// URIMAIYALAR OS — OPENAI COMPATIBLE & LOCAL INFERENCE PROVIDER
// Compatible with Local Ollama, vLLM, DeepSeek, or OpenAI
// ============================================================================

import { LLMProvider, ChatMessage, LLMRequestOptions, LLMResponse } from './LLMProvider';

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name = 'OpenAICompatible';
  private baseURL: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(baseURL?: string, apiKey?: string, defaultModel = 'gpt-4o-mini') {
    this.baseURL = baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0) || this.baseURL.includes('localhost') || this.baseURL.includes('127.0.0.1');
  }

  async chat(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

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
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 25000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[OpenAICompatible] Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;

      return {
        content,
        provider: this.name,
        model,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        latencyMs,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: LLMRequestOptions): Promise<T> {
    const systemPrompt = `You are a structured parser for Urimaiyalar OS.
Output valid JSON matching:
${schemaDescription}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.chat(messages, {
      ...options,
      responseFormat: 'json',
    });

    try {
      const cleanJson = response.content.replace(/^```json/i, '').replace(/```$/i, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err: any) {
      throw new Error(`[OpenAICompatible] Failed to parse JSON: ${err.message}. Raw: ${response.content}`);
    }
  }
}
