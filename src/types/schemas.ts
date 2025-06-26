import { z } from 'zod';

// Intent Classification Schema
export const IntentSchema = z.enum(['Flight', 'Hotel', 'Both', 'Other']);
export type Intent = z.infer<typeof IntentSchema>;

// Flight Slots Schema
export const FlightSlotsSchema = z.object({
  fromCity: z.string().min(1, 'Origin city is required'),
  toCity: z.string().min(1, 'Destination city is required'),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  passengerCount: z.number().min(1, 'At least 1 passenger required').default(1)
});
export type FlightSlots = z.infer<typeof FlightSlotsSchema>;

// Hotel Slots Schema
export const HotelSlotsSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guestCount: z.number().min(1, 'At least 1 guest required').default(1)
});
export type HotelSlots = z.infer<typeof HotelSlotsSchema>;

// Combined slots for "Both" intent
export const CombinedSlotsSchema = FlightSlotsSchema.merge(HotelSlotsSchema);
export type CombinedSlots = z.infer<typeof CombinedSlotsSchema>;

// Session State Schema
export const SessionStateSchema = z.object({
  userId: z.string(),
  intent: IntentSchema.optional(),
  flightSlots: FlightSlotsSchema.partial().optional(),
  hotelSlots: HotelSlotsSchema.partial().optional(),
  combinedSlots: CombinedSlotsSchema.partial().optional(),
  stage: z.enum(['intent_detection', 'slot_extraction', 'search', 'complete']).default('intent_detection'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date()
  })).default([])
});
export type SessionState = z.infer<typeof SessionStateSchema>;

// API Request/Response Schemas
export const ChatRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  message: z.string().min(1, 'Message cannot be empty')
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Search Result Schemas
export const FlightResultSchema = z.object({
  id: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
  from: z.string(),
  to: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  duration: z.string(),
  price: z.number(),
  currency: z.string().default('USD')
});
export type FlightResult = z.infer<typeof FlightResultSchema>;

export const HotelResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  rating: z.number().min(1).max(5),
  pricePerNight: z.number(),
  currency: z.string().default('USD'),
  amenities: z.array(z.string()),
  imageUrl: z.string().optional()
});
export type HotelResult = z.infer<typeof HotelResultSchema>;

// Agent Response Schema
export const AgentResponseSchema = z.object({
  type: z.enum(['message', 'search_results', 'follow_up', 'error']),
  content: z.string(),
  data: z.any().optional(),
  requiresFollowUp: z.boolean().default(false),
  followUpQuestion: z.string().optional()
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
