import OpenAI from 'openai';
import { getSecret, setSecret, deleteSecret } from '../storage/secureStorage';
import { ChatMessage, SessionContext, AppSettings } from '../models/types';
import { buildSystemPrompt } from './promptBuilder';

const API_KEY_NAME = 'openai-api-key';

export class AIProvider {
  private client: OpenAI | null = null;

  async setApiKey(key: string): Promise<void> {
    await setSecret(API_KEY_NAME, key);
    this.client = null; // reset client to use new key
  }

  async clearApiKey(): Promise<void> {
    await deleteSecret(API_KEY_NAME);
    this.client = null;
  }

  async isConfigured(): Promise<boolean> {
    const key = await getSecret(API_KEY_NAME);
    return !!key;
  }

  private async getClient(): Promise<OpenAI> {
    if (this.client) return this.client;
    const key = await getSecret(API_KEY_NAME);
    if (!key) throw new Error('API key not configured');
    this.client = new OpenAI({ apiKey: key });
    return this.client;
  }

  async chat(
    messages: ChatMessage[],
    context: SessionContext,
    settings: AppSettings,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const client = await this.getClient();
    const systemPrompt = buildSystemPrompt(context, settings);

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter(m => m.role !== 'system')
        .map(m => ({
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
