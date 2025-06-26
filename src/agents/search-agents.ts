import { v4 as uuidv4 } from 'uuid';
import { FlightSlots, HotelSlots, FlightResult, HotelResult, FlightResultSchema, HotelResultSchema } from '../types/schemas.js';

export class MockSearchAgent {
  /**
   * Mock flight search with realistic data
   */
  async searchFlights(slots: FlightSlots): Promise<FlightResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue'];
    const results: FlightResult[] = [];

    // Generate 3-5 mock flight results
    const numResults = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numResults; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`;
      
      // Generate realistic times
      const departureHour = Math.floor(Math.random() * 24);
      const duration = Math.floor(Math.random() * 8) + 2; // 2-10 hours
      const arrivalHour = (departureHour + duration) % 24;
      
      const basePrice = Math.floor(Math.random() * 800) + 200; // $200-$1000
      const price = basePrice + (i * 50); // Vary prices
      
      const flight: FlightResult = {
        id: uuidv4(),
        airline,
        flightNumber,
        from: slots.fromCity,
        to: slots.toCity,
        departureTime: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        duration: `${duration}h ${Math.floor(Math.random() * 60)}m`,
        price,
        currency: 'USD'
      };

      // Validate the result
      const validatedFlight = FlightResultSchema.parse(flight);
      results.push(validatedFlight);
    }

    return results.sort((a, b) => a.price - b.price); // Sort by price
  }

  /**
   * Mock hotel search with realistic data
   */
  async searchHotels(slots: HotelSlots): Promise<HotelResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const hotelNames = [
      'Grand Plaza Hotel',
      'Luxury Suites',
      'City Center Inn',
      'Boutique Resort',
      'Business Hotel',
      'Comfort Lodge',
      'Premium Towers'
    ];

    const amenities = [
      ['Free WiFi', 'Pool', 'Gym', 'Restaurant'],
      ['Free WiFi', 'Spa', 'Room Service', 'Concierge'],
      ['Free WiFi', 'Business Center', 'Parking'],
      ['Free WiFi', 'Pool', 'Bar', 'Laundry'],
      ['Free WiFi', 'Gym', 'Restaurant', 'Airport Shuttle'],
      ['Free WiFi', 'Pool', 'Spa', 'Room Service', 'Valet Parking'],
      ['Free WiFi', 'Business Center', 'Restaurant', 'Gym']
    ];

    const results: HotelResult[] = [];
    const numResults = Math.floor(Math.random() * 4) + 4; // 4-7 results

    for (let i = 0; i < numResults; i++) {
      const name = hotelNames[Math.floor(Math.random() * hotelNames.length)];
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      const basePrice = Math.floor(Math.random() * 300) + 80; // $80-$380 per night
      const pricePerNight = basePrice + (rating * 20); // Higher rating = higher price
      
      const hotel: HotelResult = {
        id: uuidv4(),
        name,
        location: slots.location,
        rating,
        pricePerNight,
        currency: 'USD',
        amenities: amenities[Math.floor(Math.random() * amenities.length)],
        imageUrl: `https://picsum.photos/400/300?random=${i}`
      };

      // Validate the result
      const validatedHotel = HotelResultSchema.parse(hotel);
      results.push(validatedHotel);
    }

    return results.sort((a, b) => a.pricePerNight - b.pricePerNight); // Sort by price
  }

  /**
   * Format flight results for display
   */
  formatFlightResults(flights: FlightResult[]): string {
    if (flights.length === 0) {
      return "Sorry, no flights found for your search criteria.";
    }

    let formatted = `Found ${flights.length} flights:\n\n`;
    
    flights.forEach((flight, index) => {
      formatted += `${index + 1}. ${flight.airline} ${flight.flightNumber}\n`;
      formatted += `   ${flight.from} → ${flight.to}\n`;
      formatted += `   Departure: ${flight.departureTime} | Arrival: ${flight.arrivalTime}\n`;
      formatted += `   Duration: ${flight.duration} | Price: $${flight.price}\n\n`;
    });

    return formatted;
  }

  /**
   * Format hotel results for display
   */
  formatHotelResults(hotels: HotelResult[]): string {
    if (hotels.length === 0) {
      return "Sorry, no hotels found for your search criteria.";
    }

    let formatted = `Found ${hotels.length} hotels in ${hotels[0].location}:\n\n`;
    
    hotels.forEach((hotel, index) => {
      formatted += `${index + 1}. ${hotel.name}\n`;
      formatted += `   Rating: ${'⭐'.repeat(hotel.rating)} (${hotel.rating}/5)\n`;
      formatted += `   Price: $${hotel.pricePerNight}/night\n`;
      formatted += `   Amenities: ${hotel.amenities.join(', ')}\n\n`;
    });

    return formatted;
  }
}
