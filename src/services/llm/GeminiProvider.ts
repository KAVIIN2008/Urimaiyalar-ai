// src/services/llm/GeminiProvider.ts
// ============================================================================
// URIMAIYALAR OS — GOOGLE GEMINI HIGH-CAPACITY INFERENCE PROVIDER
// Enterprise multimodal & deep reasoning engine
// ============================================================================

import { LLMProvider, ChatMessage, LLMRequestOptions, LLMResponse } from './LLMProvider';

export class GeminiProvider implements LLMProvider {
  readonly name = 'Gemini';
  private apiKey: string;
  private fallbackModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.0-pro',
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async chat(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('[GeminiProvider] GEMINI_API_KEY is not configured.');
    }

    const candidateModels = options?.model
      ? [options.model, ...this.fallbackModels.filter((m) => m !== options.model)]
      : this.fallbackModels;

    // Convert OpenAI style messages to Gemini contents format
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemMessage = messages.find((m) => m.role === 'system');
    const systemInstruction = systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined;

    const basePayload: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    };

    if (systemInstruction) {
      basePayload.systemInstruction = systemInstruction;
    }

    if (options?.responseFormat === 'json') {
      basePayload.generationConfig.responseMimeType = 'application/json';
    }

    let lastError: any = null;

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 30000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[GeminiProvider] Model ${model} returned ${res.status}: ${errText.slice(0, 120)}... trying next model`);
          lastError = new Error(`API Error (${res.status}): ${errText}`);
          continue;
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const latencyMs = Date.now() - startTime;

        return {
          content,
          provider: this.name,
          model,
          tokensUsed: {
            prompt: data.usageMetadata?.promptTokenCount || 0,
            completion: data.usageMetadata?.candidatesTokenCount || 0,
            total: data.usageMetadata?.totalTokenCount || 0,
          },
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
          latencyMs,
        };
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err;
        console.warn(`[GeminiProvider] Model ${model} fetch failed: ${err.message}... trying next model`);
      }
    }

    throw new Error(`[GeminiProvider] All Gemini models failed. Last error: ${lastError?.message}`);
  }

  async generateStructured<T>(prompt: string, schemaDescription: string, options?: LLMRequestOptions): Promise<T> {
    const systemPrompt = `You are a strict data extraction AI for Urimaiyalar OS.
You must output valid JSON conforming strictly to:
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
      throw new Error(`[GeminiProvider] Failed to parse JSON: ${err.message}. Raw: ${response.content}`);
    }
  }
}
