import { DialogManager } from '../core/dialog-manager.js';

// Increase Jest timeout for all tests to 30 seconds since LLM calls can be slow
jest.setTimeout(30000);

// Mock the Ollama module
jest.mock('@langchain/ollama', () => {
  return {
    Ollama: jest.fn().mockImplementation(() => {
      return {
        invoke: jest.fn().mockImplementation(async (prompt: string) => {
          // Mock responses based on prompt content
          if (prompt.includes('intent classification')) {
            if (prompt.toLowerCase().includes('flight')) {
              return JSON.stringify({ intent: "Flight" });
            } else if (prompt.toLowerCase().includes('hotel')) {
              return JSON.stringify({ intent: "Hotel" });
            } else {
              return JSON.stringify({ intent: "Other" });
            }
          } 
          
          // Entity extraction responses
          if (prompt.includes('entity extraction')) {
            if (prompt.toLowerCase().includes('flight')) {
              return JSON.stringify({
                fromCity: "New York",
                toCity: "Los Angeles",
                departureDate: "2024-12-15",
                returnDate: "2024-12-20",
                numPassengers: 1
              });
            } else if (prompt.toLowerCase().includes('hotel')) {
              return JSON.stringify({
                location: "Paris",
                checkIn: "2024-12-15",
                checkOut: "2024-12-20",
                guests: 2,
                rooms: 1
              });
            }
          }
          
          // Default response
          return JSON.stringify({ message: "This is a mock response" });
        })
      };
    })
  };
});

describe('DialogManager', () => {
  let dialogManager: DialogManager;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    dialogManager = new DialogManager();
  });

  describe('Intent Classification', () => {
    test('should classify flight intent correctly', async () => {
      const response = await dialogManager.processMessage(
        testUserId, 
        'I need a flight from New York to Los Angeles'
      );
      
      expect(response.type).toBe('follow_up');
      expect(response.content).toContain('depart');
    });

    test('should classify hotel intent correctly', async () => {
      const response = await dialogManager.processMessage(
        testUserId, 
        'Book me a hotel in Paris'
      );
      
      expect(response.type).toBe('follow_up');
      expect(response.content).toContain('check');
    });

    test('should handle fallback for unrelated queries', async () => {
      const response = await dialogManager.processMessage(
        testUserId, 
        'What is the weather like today?'
      );
      
      expect(response.type).toBe('message');
      expect(response.content).toContain('travel');
    });
  });

  describe('Slot Extraction', () => {
    test('should extract flight slots progressively', async () => {
      // First message - partial information
      await dialogManager.processMessage(
        testUserId, 
        'I want to fly from NYC to LA'
      );
      
      // Second message - add departure date
      const response = await dialogManager.processMessage(
        testUserId, 
        'I want to leave on December 25th'
      );
      
      // Should proceed to search since we have enough information
      expect(response.type).toBe('search_results');
      expect(response.data).toBeDefined();
    });

    test('should proceed to search when all slots are filled', async () => {
      // Provide complete flight information
      const response = await dialogManager.processMessage(
        testUserId, 
        'Find flights from New York to Los Angeles on December 25th for 2 passengers'
      );
      
      expect(response.type).toBe('search_results');
      expect(response.content).toContain('flights');
    });
  });

  describe('Session Management', () => {
    test('should maintain session state across messages', async () => {
      // First message
      await dialogManager.processMessage(testUserId, 'I need a flight');
      
      // Get session state
      const session = dialogManager.getSessionManager().getSession(testUserId);
      
      expect(session.userId).toBe(testUserId);
      expect(session.intent).toBe('Flight');
      expect(session.conversationHistory).toHaveLength(2); // User + Assistant
    });

    test('should handle new search requests', async () => {
      // Complete a search
      await dialogManager.processMessage(
        testUserId, 
        'Find flights from NYC to LA on Dec 25 for 1 passenger'
      );
      
      // Start new search
      const response = await dialogManager.processMessage(
        testUserId, 
        'I want to start a new search'
      );
      
      expect(response.content).toContain('new search');
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Test with empty message - system should handle gracefully
      const response = await dialogManager.processMessage('test-user', '');
      
      // System should return a message response, not crash
      expect(response.type).toBe('message');
      expect(response.content).toBeDefined();
    });
  });
});
