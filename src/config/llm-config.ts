import { Ollama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { BaseLanguageModel } from '@langchain/core/language_models/base';

export interface LLMConfig {
  provider: 'ollama' | 'openai';
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export function createLLM(config?: LLMConfig): BaseLanguageModel {
  // Default to Ollama for local development
  const defaultConfig: LLMConfig = {
    provider: 'ollama',
    model: 'gemma2:2b',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  };

  const llmConfig = config || {
    provider: (process.env.LLM_PROVIDER as 'ollama' | 'openai') || defaultConfig.provider,
    model: process.env.LLM_MODEL || defaultConfig.model,
    baseUrl: process.env.OLLAMA_BASE_URL || defaultConfig.baseUrl,
    apiKey: process.env.OPENAI_API_KEY
  };

  switch (llmConfig.provider) {
    case 'openai':
      if (!llmConfig.apiKey) {
        throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
      }
      return new ChatOpenAI({
        modelName: llmConfig.model || 'gpt-3.5-turbo',
        openAIApiKey: llmConfig.apiKey,
        temperature: 0.1,
      });

    case 'ollama':
    default:
      return new Ollama({
        baseUrl: llmConfig.baseUrl,
        model: llmConfig.model || 'gemma2:2b',
      });
  }
}
