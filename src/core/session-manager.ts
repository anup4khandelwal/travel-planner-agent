import { SessionState, SessionStateSchema } from '../types/schemas.js';

export class SessionManager {
  private sessions: Map<string, SessionState> = new Map();

  /**
   * Get or create a session for a user
   */
  getSession(userId: string): SessionState {
    if (!this.sessions.has(userId)) {
      const newSession = SessionStateSchema.parse({
        userId,
        stage: 'intent_detection',
        conversationHistory: []
      });
      this.sessions.set(userId, newSession);
    }
    return this.sessions.get(userId)!;
  }

  /**
   * Update session state
   */
  updateSession(userId: string, updates: Partial<SessionState>): SessionState {
    const currentSession = this.getSession(userId);
    const updatedSession = SessionStateSchema.parse({
      ...currentSession,
      ...updates
    });
    this.sessions.set(userId, updatedSession);
    return updatedSession;
  }

  /**
   * Add message to conversation history
   */
  addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.getSession(userId);
    session.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
    this.sessions.set(userId, session);
  }

  /**
   * Clear session for a user
   */
  clearSession(userId: string): void {
    this.sessions.delete(userId);
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions(): number {
    return this.sessions.size;
  }

  /**
   * Check if slots are complete for the current intent
   */
  areSlotsComplete(session: SessionState): boolean {
    if (!session.intent) return false;

    switch (session.intent) {
      case 'Flight':
        return !!(
          session.flightSlots?.fromCity &&
          session.flightSlots?.toCity &&
          session.flightSlots?.departureDate &&
          session.flightSlots?.passengerCount
        );
      
      case 'Hotel':
        return !!(
          session.hotelSlots?.location &&
          session.hotelSlots?.checkIn &&
          session.hotelSlots?.checkOut &&
          session.hotelSlots?.guestCount
        );
      
      case 'Both':
        return !!(
          session.combinedSlots?.fromCity &&
          session.combinedSlots?.toCity &&
          session.combinedSlots?.departureDate &&
          session.combinedSlots?.passengerCount &&
          session.combinedSlots?.location &&
          session.combinedSlots?.checkIn &&
          session.combinedSlots?.checkOut &&
          session.combinedSlots?.guestCount
        );
      
      default:
        return false;
    }
  }

  /**
   * Get missing slots for follow-up questions
   */
  getMissingSlots(session: SessionState): string[] {
    if (!session.intent) return [];

    const missing: string[] = [];

    switch (session.intent) {
      case 'Flight':
        if (!session.flightSlots?.fromCity) missing.push('origin city');
        if (!session.flightSlots?.toCity) missing.push('destination city');
        if (!session.flightSlots?.departureDate) missing.push('departure date');
        if (!session.flightSlots?.passengerCount) missing.push('number of passengers');
        break;
      
      case 'Hotel':
        if (!session.hotelSlots?.location) missing.push('hotel location');
        if (!session.hotelSlots?.checkIn) missing.push('check-in date');
        if (!session.hotelSlots?.checkOut) missing.push('check-out date');
        if (!session.hotelSlots?.guestCount) missing.push('number of guests');
        break;
      
      case 'Both':
        if (!session.combinedSlots?.fromCity) missing.push('origin city');
        if (!session.combinedSlots?.toCity) missing.push('destination city');
        if (!session.combinedSlots?.departureDate) missing.push('departure date');
        if (!session.combinedSlots?.passengerCount) missing.push('number of passengers');
        if (!session.combinedSlots?.location) missing.push('hotel location');
        if (!session.combinedSlots?.checkIn) missing.push('check-in date');
        if (!session.combinedSlots?.checkOut) missing.push('check-out date');
        if (!session.combinedSlots?.guestCount) missing.push('number of guests');
        break;
    }

    return missing;
  }
}
