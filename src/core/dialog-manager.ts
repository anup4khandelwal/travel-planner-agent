import { SessionManager } from './session-manager.js';
import { IntentClassifier } from '../agents/intent-classifier.js';
import { EntityExtractor } from '../agents/entity-extractor.js';
import { MockSearchAgent } from '../agents/search-agents.js';
import { FallbackAgent } from '../agents/fallback-agent.js';
import { AgentResponse, SessionState } from '../types/schemas.js';

export class DialogManager {
  private sessionManager: SessionManager;
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private searchAgent: MockSearchAgent;
  private fallbackAgent: FallbackAgent;

  constructor() {
    this.sessionManager = new SessionManager();
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.searchAgent = new MockSearchAgent();
    this.fallbackAgent = new FallbackAgent();
  }

  /**
   * Process user message and return appropriate response
   */
  async processMessage(userId: string, message: string): Promise<AgentResponse> {
    try {
      // Add user message to conversation history
      this.sessionManager.addMessage(userId, 'user', message);
      
      // Get current session
      let session = this.sessionManager.getSession(userId);

      // Process based on current stage
      switch (session.stage) {
        case 'intent_detection':
          return await this.handleIntentDetection(userId, message, session);
        
        case 'slot_extraction':
          return await this.handleSlotExtraction(userId, message, session);
        
        case 'search':
          return await this.handleSearch(userId, message, session);
        
        default:
          return await this.handleIntentDetection(userId, message, session);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        requiresFollowUp: false
      };
    }
  }

  /**
   * Handle intent detection stage
   */
  private async handleIntentDetection(userId: string, message: string, session: SessionState): Promise<AgentResponse> {
    // Classify intent
    const intent = await this.intentClassifier.classifyIntent(message);
    
    if (intent === 'Other') {
      return await this.fallbackAgent.handleEdgeCase(message);
    }

    // Update session with detected intent
    session = this.sessionManager.updateSession(userId, {
      intent,
      stage: 'slot_extraction'
    });

    // Extract initial entities
    const extractedSlots = await this.entityExtractor.extractEntities(message, intent);
    
    // Update session with extracted slots
    switch (intent) {
      case 'Flight':
        session = this.sessionManager.updateSession(userId, { flightSlots: extractedSlots });
        break;
      case 'Hotel':
        session = this.sessionManager.updateSession(userId, { hotelSlots: extractedSlots });
        break;
      case 'Both':
        session = this.sessionManager.updateSession(userId, { combinedSlots: extractedSlots });
        break;
    }

    // Check if we have all required slots
    if (this.sessionManager.areSlotsComplete(session)) {
      return await this.proceedToSearch(userId, session);
    } else {
      return await this.requestMissingSlots(userId, session);
    }
  }

  /**
   * Handle slot extraction stage
   */
  private async handleSlotExtraction(userId: string, message: string, session: SessionState): Promise<AgentResponse> {
    if (!session.intent) {
      // Restart intent detection
      return await this.handleIntentDetection(userId, message, session);
    }

    // Extract entities from the new message
    const currentSlots = this.getCurrentSlots(session);
    const extractedSlots = await this.entityExtractor.extractEntities(message, session.intent, currentSlots);
    
    // Update session with new slots
    switch (session.intent) {
      case 'Flight':
        session = this.sessionManager.updateSession(userId, { flightSlots: extractedSlots });
        break;
      case 'Hotel':
        session = this.sessionManager.updateSession(userId, { hotelSlots: extractedSlots });
        break;
      case 'Both':
        session = this.sessionManager.updateSession(userId, { combinedSlots: extractedSlots });
        break;
    }

    // Check if we have all required slots now
    if (this.sessionManager.areSlotsComplete(session)) {
      return await this.proceedToSearch(userId, session);
    } else {
      return await this.requestMissingSlots(userId, session);
    }
  }

  /**
   * Handle search stage
   */
  private async handleSearch(userId: string, message: string, session: SessionState): Promise<AgentResponse> {
    // User might want to modify search or start new search
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('new search') || lowerMessage.includes('different') || lowerMessage.includes('change')) {
      // Reset session for new search
      this.sessionManager.updateSession(userId, {
        intent: undefined,
        flightSlots: undefined,
        hotelSlots: undefined,
        combinedSlots: undefined,
        stage: 'intent_detection'
      });
      
      return {
        type: 'message',
        content: 'Sure! Let\'s start a new search. What would you like to book?',
        requiresFollowUp: false
      };
    }

    // Otherwise, treat as new intent detection
    return await this.handleIntentDetection(userId, message, session);
  }

  /**
   * Proceed to search with complete slots
   */
  private async proceedToSearch(userId: string, session: SessionState): Promise<AgentResponse> {
    this.sessionManager.updateSession(userId, { stage: 'search' });

    if (!session.intent) {
      throw new Error('Intent is required for search');
    }

    try {
      switch (session.intent) {
        case 'Flight':
          if (session.flightSlots) {
            const flights = await this.searchAgent.searchFlights(session.flightSlots as any);
            const formattedResults = this.searchAgent.formatFlightResults(flights);
            
            this.sessionManager.addMessage(userId, 'assistant', formattedResults);
            
            return {
              type: 'search_results',
              content: formattedResults,
              data: flights,
              requiresFollowUp: false
            };
          }
          break;

        case 'Hotel':
          if (session.hotelSlots) {
            const hotels = await this.searchAgent.searchHotels(session.hotelSlots as any);
            const formattedResults = this.searchAgent.formatHotelResults(hotels);
            
            this.sessionManager.addMessage(userId, 'assistant', formattedResults);
            
            return {
              type: 'search_results',
              content: formattedResults,
              data: hotels,
              requiresFollowUp: false
            };
          }
          break;

        case 'Both':
          if (session.combinedSlots) {
            const [flights, hotels] = await Promise.all([
              this.searchAgent.searchFlights(session.combinedSlots as any),
              this.searchAgent.searchHotels(session.combinedSlots as any)
            ]);
            
            const flightResults = this.searchAgent.formatFlightResults(flights);
            const hotelResults = this.searchAgent.formatHotelResults(hotels);
            const combinedResults = `${flightResults}\n---\n\n${hotelResults}`;
            
            this.sessionManager.addMessage(userId, 'assistant', combinedResults);
            
            return {
              type: 'search_results',
              content: combinedResults,
              data: { flights, hotels },
              requiresFollowUp: false
            };
          }
          break;
      }

      throw new Error('Invalid search configuration');
    } catch (error) {
      console.error('Search error:', error);
      return {
        type: 'error',
        content: 'Sorry, I encountered an error while searching. Please try again.',
        requiresFollowUp: false
      };
    }
  }

  /**
   * Request missing slots from user
   */
  private async requestMissingSlots(userId: string, session: SessionState): Promise<AgentResponse> {
    const missingSlots = this.sessionManager.getMissingSlots(session);
    
    if (missingSlots.length === 0) {
      return await this.proceedToSearch(userId, session);
    }

    // Ensure we're in slot extraction stage
    this.sessionManager.updateSession(userId, { stage: 'slot_extraction' });

    const followUpQuestion = this.generateFollowUpQuestion(missingSlots, session.intent!);
    
    this.sessionManager.addMessage(userId, 'assistant', followUpQuestion);
    
    return {
      type: 'follow_up',
      content: followUpQuestion,
      requiresFollowUp: true,
      followUpQuestion
    };
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestion(missingSlots: string[], intent: string): string {
    // For single missing slot, ask directly
    if (missingSlots.length === 1) {
      const slot = missingSlots[0];
      switch (slot) {
        case 'origin city':
          return 'Where would you like to fly from?';
        case 'destination city':
          return 'Where would you like to fly to?';
        case 'departure date':
          return 'When would you like to depart?';
        case 'number of passengers':
          return 'How many passengers will be traveling?';
        case 'hotel location':
          return 'Which city would you like to stay in?';
        case 'check-in date':
          return 'When would you like to check in?';
        case 'check-out date':
          return 'When would you like to check out?';
        case 'number of guests':
          return 'How many guests will be staying?';
        default:
          return `Could you please provide the ${slot}?`;
      }
    }

    // For multiple missing slots, prioritize and ask for the most important ones first
    const priorityOrder = [
      'origin city',
      'departure date', 
      'number of passengers',
      'check-in date',
      'check-out date',
      'number of guests'
    ];

    // Find the first 1-2 priority slots that are missing
    const priorityMissing = priorityOrder.filter(slot => missingSlots.includes(slot));
    
    if (priorityMissing.length > 0) {
      if (priorityMissing.length === 1) {
        return this.generateFollowUpQuestion([priorityMissing[0]], intent);
      } else {
        // Ask for 2 most important missing slots
        const first = priorityMissing[0];
        const second = priorityMissing[1];
        
        if (first === 'origin city' && second === 'departure date') {
          return 'Where would you like to fly from and when would you like to depart?';
        } else if (first === 'departure date' && second === 'number of passengers') {
          return 'When would you like to depart and how many passengers will be traveling?';
        } else if (first === 'check-in date' && second === 'check-out date') {
          return 'When would you like to check in and check out?';
        } else {
          return `I need to know: ${first.replace('_', ' ')} and ${second.replace('_', ' ')}. Could you provide these details?`;
        }
      }
    }

    // Fallback for other combinations
    return `I need a few more details: ${missingSlots.slice(0, 3).join(', ')}. Could you provide this information?`;
  }

  /**
   * Get current slots based on intent
   */
  private getCurrentSlots(session: SessionState): any {
    switch (session.intent) {
      case 'Flight':
        return session.flightSlots;
      case 'Hotel':
        return session.hotelSlots;
      case 'Both':
        return session.combinedSlots;
      default:
        return {};
    }
  }

  /**
   * Get session manager instance
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }
}
