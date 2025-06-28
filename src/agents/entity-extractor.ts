import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { Intent, FlightSlots, HotelSlots, CombinedSlots, FlightSlotsSchema, HotelSlotsSchema, CombinedSlotsSchema } from '../types/schemas.js';
import { createLLM } from '../config/llm-config.js';

export class EntityExtractor {
  private llm: BaseLanguageModel;

  constructor(llm?: BaseLanguageModel) {
    this.llm = llm || createLLM();
  }

  /**
   * Extract entities based on intent and user message
   */
  async extractEntities(userMessage: string, intent: Intent, existingSlots?: any): Promise<any> {
    switch (intent) {
      case 'Flight':
        return this.extractFlightEntities(userMessage, existingSlots);
      case 'Hotel':
        return this.extractHotelEntities(userMessage, existingSlots);
      case 'Both':
        return this.extractCombinedEntities(userMessage, existingSlots);
      default:
        return {};
    }
  }

  /**
   * Extract flight-specific entities
   */
  private async extractFlightEntities(userMessage: string, existingSlots?: Partial<FlightSlots>): Promise<Partial<FlightSlots>> {
    const prompt = `
Extract flight booking information from the user's message. Return a JSON object with the following fields (only include fields that are mentioned):

- fromCity: Origin city/airport
- toCity: Destination city/airport  
- departureDate: Departure date (YYYY-MM-DD format)
- returnDate: Return date (YYYY-MM-DD format, only for round trips)
- passengerCount: Number of passengers (default 1)

User message: "${userMessage}"

Existing information: ${JSON.stringify(existingSlots || {})}

Return only valid JSON without any explanation:`;

    try {
      const response = await this.llm.invoke(prompt);
      const responseText = (typeof response === 'string' ? response : response.content).toString();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Merge with existing slots
        const mergedSlots = { ...existingSlots, ...extractedData };
        
        // Validate using Zod schema (partial validation)
        const result = FlightSlotsSchema.partial().safeParse(mergedSlots);
        
        if (result.success) {
          return result.data;
        }
      }
      
      return existingSlots || {};
    } catch (error) {
      console.error('Error extracting flight entities:', error);
      return existingSlots || {};
    }
  }

  /**
   * Extract hotel-specific entities
   */
  private async extractHotelEntities(userMessage: string, existingSlots?: Partial<HotelSlots>): Promise<Partial<HotelSlots>> {
    const prompt = `
Extract hotel booking information from the user's message. Return a JSON object with the following fields (only include fields that are mentioned):

- location: Hotel location/city
- checkIn: Check-in date (YYYY-MM-DD format)
- checkOut: Check-out date (YYYY-MM-DD format)
- guestCount: Number of guests (default 1)

User message: "${userMessage}"

Existing information: ${JSON.stringify(existingSlots || {})}

Return only valid JSON without any explanation:`;

    try {
      const response = await this.llm.invoke(prompt);
      const responseText = (typeof response === 'string' ? response : response.content).toString();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Merge with existing slots
        const mergedSlots = { ...existingSlots, ...extractedData };
        
        // Validate using Zod schema (partial validation)
        const result = HotelSlotsSchema.partial().safeParse(mergedSlots);
        
        if (result.success) {
          return result.data;
        }
      }
      
      return existingSlots || {};
    } catch (error) {
      console.error('Error extracting hotel entities:', error);
      return existingSlots || {};
    }
  }

  /**
   * Extract combined entities for both flights and hotels
   */
  private async extractCombinedEntities(userMessage: string, existingSlots?: Partial<CombinedSlots>): Promise<Partial<CombinedSlots>> {
    const prompt = `
Extract travel booking information from the user's message for both flights and hotels. Return a JSON object with the following fields (only include fields that are mentioned or can be reasonably inferred):

Flight fields:
- fromCity: Origin city/airport (if not mentioned, leave empty)
- toCity: Destination city/airport (look for phrases like "to Tokyo", "trip to Paris", etc.)
- departureDate: Departure date (YYYY-MM-DD format)
- returnDate: Return date (YYYY-MM-DD format)
- passengerCount: Number of passengers (default 1 if not specified)

Hotel fields:
- location: Hotel location/city (often same as toCity for trip planning)
- checkIn: Check-in date (YYYY-MM-DD format, often same as departureDate)
- checkOut: Check-out date (YYYY-MM-DD format, often same as returnDate)
- guestCount: Number of guests (often same as passengerCount, default 1)

Examples:
- "Plan a trip to Tokyo" → {"toCity": "Tokyo", "location": "Tokyo", "passengerCount": 1, "guestCount": 1}
- "Book flight and hotel to Paris for 2 people" → {"toCity": "Paris", "location": "Paris", "passengerCount": 2, "guestCount": 2}
- "Trip to London from NYC next week" → {"fromCity": "New York", "toCity": "London", "location": "London", "passengerCount": 1, "guestCount": 1}
- "From San Francisco, departing December 15th" → {"fromCity": "San Francisco", "departureDate": "2024-12-15"}

User message: "${userMessage}"

Existing information: ${JSON.stringify(existingSlots || {})}

Return only valid JSON without any explanation:`;

    try {
      const response = await this.llm.invoke(prompt);
      const responseText = (typeof response === 'string' ? response : response.content).toString();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Merge with existing slots
        const mergedSlots = { ...existingSlots, ...extractedData };
        
        // Auto-fill logical defaults for combined bookings
        if (mergedSlots.toCity && !mergedSlots.location) {
          mergedSlots.location = mergedSlots.toCity;
        }
        if (mergedSlots.departureDate && !mergedSlots.checkIn) {
          mergedSlots.checkIn = mergedSlots.departureDate;
        }
        if (mergedSlots.returnDate && !mergedSlots.checkOut) {
          mergedSlots.checkOut = mergedSlots.returnDate;
        }
        if (mergedSlots.passengerCount && !mergedSlots.guestCount) {
          mergedSlots.guestCount = mergedSlots.passengerCount;
        }
        
        // Validate using Zod schema (partial validation)
        const result = CombinedSlotsSchema.partial().safeParse(mergedSlots);
        
        if (result.success) {
          return result.data;
        }
      }
      
      return existingSlots || {};
    } catch (error) {
      console.error('Error extracting combined entities:', error);
      return existingSlots || {};
    }
  }
}
