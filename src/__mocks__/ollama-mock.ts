/**
 * Mock for Ollama LLM service in test environment
 * This provides predictable responses for tests without requiring an actual Ollama server
 */

// Mock response for intent classification
const MOCK_INTENT_RESPONSES: Record<string, string> = {
  flight: JSON.stringify({ intent: "Flight" }),
  hotel: JSON.stringify({ intent: "Hotel" }),
  both: JSON.stringify({ intent: "Both" }),
  default: JSON.stringify({ intent: "Other" })
};

// Mock response for entity extraction
const MOCK_ENTITY_RESPONSES: Record<string, string> = {
  flight: JSON.stringify({
    fromCity: "New York",
    toCity: "Los Angeles",
    departureDate: "2024-12-15",
    returnDate: "2024-12-20",
    numPassengers: 1
  }),
  hotel: JSON.stringify({
    location: "Paris",
    checkIn: "2024-12-15",
    checkOut: "2024-12-20",
    guests: 2,
    rooms: 1
  }),
  default: JSON.stringify({})
};

// Export the mock module
export const ollamaMock = {
  invoke: async (prompt: string): Promise<string> => {
    // Sleep to simulate network delay (but much faster than real LLM)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Determine response based on prompt content
    if (prompt.includes('intent classification')) {
      if (prompt.toLowerCase().includes('flight')) {
        return MOCK_INTENT_RESPONSES.flight;
      } else if (prompt.toLowerCase().includes('hotel')) {
        return MOCK_INTENT_RESPONSES.hotel;
      } else if (prompt.toLowerCase().includes('both')) {
        return MOCK_INTENT_RESPONSES.both;
      }
      return MOCK_INTENT_RESPONSES.default;
    } 
    
    // Entity extraction responses
    if (prompt.includes('entity extraction')) {
      if (prompt.toLowerCase().includes('flight')) {
        return MOCK_ENTITY_RESPONSES.flight;
      } else if (prompt.toLowerCase().includes('hotel')) {
        return MOCK_ENTITY_RESPONSES.hotel;
      }
      return MOCK_ENTITY_RESPONSES.default;
    }
    
    // Default response
    return JSON.stringify({ message: "This is a mock response" });
  }
};

// Mock the Ollama module
jest.mock('@langchain/ollama', () => {
  return {
    Ollama: jest.fn().mockImplementation(() => {
      return {
        invoke: ollamaMock.invoke
      };
    })
  };
});
