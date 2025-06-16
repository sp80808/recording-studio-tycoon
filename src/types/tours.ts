import { PerformanceRating } from './performance'; // For TourStop - Added comment to force re-evaluation

export interface TourVenue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  baseTicketPrice: number;
  reputationRequirement: number;
  genrePreferences: Array<{
    genre: string;
    multiplier: number;
  }>;
  rentalCost: number;
}

export interface TourStop {
  id: string;
  venueId: string; // Links to TourVenue
  date: number; // Using number for game day consistency
  expectedAttendance: number;
  ticketPrice: number;
  expenses: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  performanceRating?: PerformanceRating;
  actualAttendance?: number;
  revenue?: number;
  reputationGain?: number;
  // Any other stop-specific details can be added here
}

export interface Tour {
  id: string;
  bandId: string;
  name: string;
  startDate: number; // Using number for game day
  endDate: number;   // Using number for game day
  stops: TourStop[]; // Changed from venues/reviews to stops
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  totalRevenue: number;
  totalExpenses: number; // Renamed from expenses to totalExpenses for clarity
  reputationImpact: number; // Overall reputation impact of the tour
  // Removed attendance, reviews from here as they are per-stop or derived
  genreMatch?: number; // Optional: how well tour matches band's genre
}

// TourReview might be used for a different system or post-tour summary
export interface TourReview {
  venueId: string; // Or stopId if reviews are per-stop
  rating: number; // e.g., 1-5 stars from critics or fans for that stop/venue
  attendance: number; // Could be redundant if TourStop has actualAttendance
  revenue: number;    // Could be redundant
  expenses: number;   // Could be redundant
  notes: string;      // Qualitative feedback
}
