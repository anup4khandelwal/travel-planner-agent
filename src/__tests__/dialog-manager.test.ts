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
          if (prompt.includes('Respond with only one word: Flight, Hotel, Both, or Other')) {

            // Intent classification - return simple word response
            // Check for empty/error messages first
            if (prompt.toLowerCase().includes('invalid') || prompt.toLowerCase().includes('error') || prompt.includes('User message: ""')) {
              // For error handling tests and empty messages, return Other to trigger fallback

              return "Other";
            } else if (prompt.toLowerCase().includes('hotel') && prompt.toLowerCase().includes('paris')) {
              return "Hotel";
            } else if (prompt.toLowerCase().includes('weather')) {
              return "Other";
            } else if (prompt.toLowerCase().includes('new search') || prompt.toLowerCase().includes('different search')) {
              return "Flight"; // New search requests are typically travel-related
            } else if (prompt.toLowerCase().includes('flight') || prompt.toLowerCase().includes('new york') || prompt.toLowerCase().includes('los angeles')) {
              return "Flight";
            } else if (prompt.toLowerCase().includes('complete flight')) {
              return "Flight";
            } else {

              return "Flight"; // Default for most travel queries
            }
          } 
          
          // Entity extraction responses - return JSON
          if (prompt.includes('entity extraction') || prompt.includes('Extract the following information') || prompt.includes('Extract flight booking information')) {
            // Check for complete flight information (all required fields)
            if (prompt.toLowerCase().includes('december 25th') || prompt.toLowerCase().includes('dec 25') ||
                prompt.toLowerCase().includes('2 passengers') ||
                (prompt.toLowerCase().includes('new york') && prompt.toLowerCase().includes('los angeles') && prompt.toLowerCase().includes('december')) ||
                (prompt.toLowerCase().includes('nyc') && prompt.toLowerCase().includes('la') && prompt.toLowerCase().includes('dec 25'))) {
              return JSON.stringify({
                fromCity: "New York",
                toCity: "Los Angeles", 
                departureDate: "2024-12-25",
                passengerCount: 2
              });
            } else if (prompt.toLowerCase().includes('december 25th') || prompt.toLowerCase().includes('leave on december') || 
                      (prompt.includes('Existing information:') && prompt.toLowerCase().includes('december'))) {
              // Adding departure date to existing slots - should have all required fields now
              const result = JSON.stringify({
                departureDate: "2024-12-25"
              });

              return result;
            } else if (prompt.toLowerCase().includes('flight') || prompt.toLowerCase().includes('nyc') || prompt.toLowerCase().includes('new york') || prompt.toLowerCase().includes('los angeles')) {
              // Partial flight information - missing departure date
              if (prompt.includes('Existing information:') && prompt.includes('{}')) {
                // First extraction - no existing slots
                const result = JSON.stringify({
                  fromCity: "New York",
                  toCity: "Los Angeles",
                  passengerCount: 1
                });

                return result;
              } else {
                // Subsequent extraction - return only new info
                const result = JSON.stringify({});

                return result;
              }
            } else if (prompt.toLowerCase().includes('hotel') || prompt.toLowerCase().includes('paris')) {
              return JSON.stringify({
                location: "Paris",
                checkIn: "2024-12-15",
                checkOut: "2024-12-20",
                guestCount: 2,
                roomCount: 1
              });
            } else {
              return JSON.stringify({});
            }
          }
          
          // Default response for other prompts
          return "Flight";
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
