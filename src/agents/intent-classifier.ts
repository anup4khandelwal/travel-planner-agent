import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { Intent, IntentSchema } from '../types/schemas.js';
import { createLLM } from '../config/llm-config.js';

export class IntentClassifier {
  private llm: BaseLanguageModel;

  constructor(llm?: BaseLanguageModel) {
    this.llm = llm || createLLM();
  }

  /**
   * Classify user intent from natural language query
   */
  async classifyIntent(message: string): Promise<Intent> {
    const prompt = `
You are an intent classifier for a travel booking system. Classify the user's message into one of these categories:
- "Flight" - User wants to book flights only
- "Hotel" - User wants to book hotels only  
- "Both" - User wants to book both flights and hotels
- "Other" - User's message is not related to travel booking

User message: "${message}"

Respond with only one word: Flight, Hotel, Both, or Other.
    `.trim();

    try {
      const response = await this.llm.invoke(prompt);
      const intent = (typeof response === 'string' ? response : response.content).toString().trim() as Intent;
      
      // Validate the response
      const result = IntentSchema.safeParse(intent);
      if (result.success) {
        return result.data;
      } else {
        console.warn('Invalid intent classification, defaulting to Other:', intent);
        return 'Other';
      }
    } catch (error) {
      console.error('Error classifying intent:', error);
      return 'Other';
    }
  }

  /**
   * Get confidence score for classification (mock implementation)
   */
  async getClassificationConfidence(message: string, intent: Intent): Promise<number> {
    // In a real implementation, this would use the LLM to provide confidence scores
    // For now, return a mock confidence based on keyword matching
    const messageLower = message.toLowerCase();
    
    switch (intent) {
      case 'Flight':
        return (messageLower.includes('flight') || messageLower.includes('fly') || messageLower.includes('plane')) ? 0.9 : 0.6;
      case 'Hotel':
        return (messageLower.includes('hotel') || messageLower.includes('accommodation') || messageLower.includes('stay')) ? 0.9 : 0.6;
      case 'Both':
        return (messageLower.includes('trip') || messageLower.includes('vacation') || messageLower.includes('travel')) ? 0.8 : 0.5;
      default:
        return 0.3;
    }
  }
}
