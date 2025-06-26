import { AgentResponse } from '../types/schemas';

export class FallbackAgent {
  /**
   * Handle queries that don't match travel-related intents
   */
  async handleFallback(userMessage: string): Promise<AgentResponse> {
    const fallbackResponses = [
      "I'm sorry, but I can only help you with flight and hotel bookings. Could you please ask me about travel-related queries?",
      "I specialize in helping you find flights and hotels. Is there anything travel-related I can assist you with?",
      "I'm a travel booking assistant. I can help you search for flights, hotels, or plan complete trips. What would you like to book?",
      "Sorry, I can't answer that. I'm here to help you with travel planning - flights, hotels, and vacation packages. How can I help with your travel needs?",
      "I'm designed to help with travel bookings only. Would you like to search for flights or hotels instead?"
    ];

    // Select a random fallback response
    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return {
      type: 'message',
      content: response,
      requiresFollowUp: false
    };
  }

  /**
   * Provide helpful suggestions when user asks unrelated questions
   */
  async provideTravelSuggestions(): Promise<AgentResponse> {
    const suggestions = `
Here are some things I can help you with:

✈️ **Flight Bookings**
- "Find flights from New York to Los Angeles"
- "I need a round trip to Paris next month"

🏨 **Hotel Reservations**
- "Book a hotel in Tokyo for 3 nights"
- "Find accommodation in London for my business trip"

🌍 **Complete Trip Planning**
- "Plan a vacation to Miami with flights and hotel"
- "I need travel arrangements for a week in Barcelona"

What would you like to book today?`;

    return {
      type: 'message',
      content: suggestions,
      requiresFollowUp: false
    };
  }

  /**
   * Handle edge cases and provide contextual help
   */
  async handleEdgeCase(userMessage: string, context?: string): Promise<AgentResponse> {
    const message = userMessage.toLowerCase();

    // Handle greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return {
        type: 'message',
        content: "Hello! I'm your travel booking assistant. I can help you find flights, hotels, or plan complete trips. What are you looking to book today?",
        requiresFollowUp: false
      };
    }

    // Handle thanks
    if (message.includes('thank') || message.includes('thanks')) {
      return {
        type: 'message',
        content: "You're welcome! Is there anything else I can help you with for your travel plans?",
        requiresFollowUp: false
      };
    }

    // Handle help requests
    if (message.includes('help') || message.includes('what can you do')) {
      return this.provideTravelSuggestions();
    }

    // Handle goodbye
    if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
      return {
        type: 'message',
        content: "Goodbye! Feel free to come back anytime you need help with travel bookings. Have a great day!",
        requiresFollowUp: false
      };
    }

    // Default fallback
    return this.handleFallback(userMessage);
  }
}
