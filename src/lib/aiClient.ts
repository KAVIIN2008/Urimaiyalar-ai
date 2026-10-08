import dotenv from 'dotenv';
dotenv.config();

export interface AiCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  text: string;
  provider: 'groq' | 'ollama' | 'deterministic';
  model: string;
  latencyMs: number;
}

/**
 * Universal AI Client for URIMAIYALAR OS
 * Primary: Groq LPU (openai/gpt-oss-120b with 8,000 token/min headroom + qwen/qwen3.8-27b)
 * Offline Fallback: Ollama local (http://localhost:11434)
 */
export async function generateAiCompletion(
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const { prompt, systemPrompt, conversationHistory = [], temperature = 0.1, maxTokens = 250, jsonMode = false } = options;
  const startTime = Date.now();

  const groqApiKey = process.env.GROQ_API_KEY || '';
  const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

  // 1. TRY GROQ LPU (With auto-model failover)
  if (groqApiKey && !groqApiKey.includes('YOUR_')) {
    for (const model of groqModels) {
      try {
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        if (conversationHistory.length > 0) {
          conversationHistory.forEach((m) => {
            messages.push({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            });
          });
        }
        messages.push({ role: 'user', content: prompt });

        const body: any = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        };

        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '';
          if (content) {
            return {
              text: content.trim(),
              provider: 'groq',
              model,
              latencyMs: Date.now() - startTime,
            };
          }
        } else {
          const errText = await res.text();
          console.warn(`[AI Engine] Groq ${model} status ${res.status}:`, errText);
        }
      } catch (err: any) {
        console.warn(`[AI Engine] Groq ${model} error:`, err.message);
      }
    }
  }

  // 2. TRY OLLAMA (Local offline server)
  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${ollamaBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) {
        return {
          text: content.trim(),
          provider: 'ollama',
          model: ollamaModel,
          latencyMs: Date.now() - startTime,
        };
      }
    }
  } catch {}

  // 3. DETERMINISTIC SAFE FALLBACK
  return {
    text: '',
    provider: 'deterministic',
    model: 'none',
    latencyMs: Date.now() - startTime,
  };
}
