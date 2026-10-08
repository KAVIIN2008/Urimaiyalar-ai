// src/services/llm/LLMProvider.ts
// ============================================================================
// URIMAIYALAR OS — LLM PROVIDER ABSTRACTION INTERFACE
// Production-grade multi-model interface for Groq, Gemini, OpenAI, & Local models
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  timeoutMs?: number;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  totalTokens?: number;
  latencyMs: number;
}

export interface LLMProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  chat(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  generateStructured<T>(prompt: string, schemaDescription: string, options?: LLMRequestOptions): Promise<T>;
}
