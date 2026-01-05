/**
 * Cloudflare-compatible Groq API Client
 * 
 * Uses raw fetch instead of groq-sdk to avoid private class field issues
 * with Cloudflare Workers bundling.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Create a Groq chat completion using raw fetch
 * Compatible with Cloudflare Workers
 */
export async function createChatCompletion(
  apiKey: string,
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Groq client class with SDK-like interface
 * Uses fetch internally for Cloudflare Workers compatibility
 */
export class GroqClient {
  private apiKey: string;

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }

  chat = {
    completions: {
      create: async (options: ChatCompletionOptions): Promise<ChatCompletionResponse> => {
        return createChatCompletion(this.apiKey, options);
      },
    },
  };
}
