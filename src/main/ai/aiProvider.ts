import OpenAI from 'openai';
import { getSecret, setSecret, deleteSecret } from '../storage/secureStorage';
import { ChatMessage, SessionContext, AppSettings, AIProviderType } from '../models/types';
import { buildSystemPrompt } from './promptBuilder';

// Key names per provider
const keyName = (provider: AIProviderType) => `${provider}-api-key`;

// ─────────────────────────────────────────────────────────────
// OpenAI-compatible providers: openai, openrouter, gemini, ollama
// ─────────────────────────────────────────────────────────────

function getOpenAIClient(
  apiKey: string,
  provider: AIProviderType,
  settings: AppSettings
): OpenAI {
  switch (provider) {
    case 'openrouter':
      return new OpenAI({
        apiKey,
        baseURL: settings.openrouterBaseUrl || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/CyberBrainiac1/TerminalPilot',
          'X-Title': 'TerminalPilot AI',
        },
      });
    case 'gemini':
      return new OpenAI({
        apiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    case 'ollama':
      return new OpenAI({
        apiKey: apiKey || 'ollama',
        baseURL: settings.ollamaBaseUrl || 'http://localhost:11434/v1',
      });
    default: // openai
      return new OpenAI({ apiKey });
  }
}

// ─────────────────────────────────────────────────────────────
// Anthropic (direct API - different request format)
// ─────────────────────────────────────────────────────────────

async function chatAnthropic(
  apiKey: string,
  messages: ChatMessage[],
  model: string,
  systemPrompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: anthropicMessages,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const body = response.body;
  if (!body) throw new Error('No response body from Anthropic');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data) as {
          type: string;
          delta?: { type: string; text?: string };
        };
        if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'text_delta' &&
          parsed.delta.text
        ) {
          fullResponse += parsed.delta.text;
          onChunk(parsed.delta.text);
        }
      } catch {
        // ignore unparseable SSE lines
      }
    }
  }

  return fullResponse;
}

// ─────────────────────────────────────────────────────────────
// AIProvider class
// ─────────────────────────────────────────────────────────────

export class AIProvider {
  // Set the API key for a specific provider
  async setApiKey(provider: AIProviderType, key: string): Promise<void> {
    await setSecret(keyName(provider), key);
  }

  // Clear the API key for a specific provider
  async clearApiKey(provider: AIProviderType): Promise<void> {
    await deleteSecret(keyName(provider));
  }

  // Check whether a specific provider is configured
  async isProviderConfigured(provider: AIProviderType): Promise<boolean> {
    if (provider === 'ollama') return true; // Ollama runs locally, no key needed
    const key = await getSecret(keyName(provider));
    return !!key;
  }

  // Convenience: is the currently-active provider configured?
  async isConfigured(provider: AIProviderType): Promise<boolean> {
    return this.isProviderConfigured(provider);
  }

  async chat(
    messages: ChatMessage[],
    context: SessionContext,
    settings: AppSettings,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const provider = settings.aiProvider;
    const systemPrompt = buildSystemPrompt(context, settings);

    if (provider === 'anthropic') {
      const key = await getSecret(keyName('anthropic'));
      if (!key) throw new Error('Anthropic API key not configured');
      return chatAnthropic(key, messages, settings.aiModel, systemPrompt, onChunk);
    }

    // OpenAI-compatible providers
    let apiKey = await getSecret(keyName(provider));
    if (provider !== 'ollama' && !apiKey) {
      throw new Error(`${providerLabel(provider)} API key not configured`);
    }
    apiKey = apiKey ?? (provider === 'ollama' ? 'ollama' : '');

    const client = getOpenAIClient(apiKey, provider, settings);

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    const stream = await client.chat.completions.create({
      model: settings.aiModel,
      messages: openaiMessages,
      stream: true,
      max_tokens: 2048,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullResponse += delta;
        onChunk(delta);
      }
    }
    return fullResponse;
  }
}

export function providerLabel(provider: AIProviderType): string {
  const labels: Record<AIProviderType, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    openrouter: 'OpenRouter',
    gemini: 'Google Gemini',
    ollama: 'Ollama (local)',
  };
  return labels[provider] ?? provider;
}
