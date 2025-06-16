import { useCallback } from 'react';
import { GameState, Tour, TourStop, TourVenue } from '@/types/game';
import { useTourManagement } from './useTourManagement';
import { toast } from '@/components/ui/use-toast';
import { TourScheduleErrors } from '@/components/TourScheduleErrors';

interface UseTourSchedulingProps {
  gameState: GameState;
  setGameState: (updater: GameState | ((prevState: GameState) => GameState)) => void;
}

export const useTourScheduling = ({ gameState, setGameState }: UseTourSchedulingProps) => {
  const { calculateVenueSuitability, calculateExpectedAttendance } = useTourManagement({
    gameState,
    setGameState
  });

  const validateTourSchedule = useCallback((tour: Tour) => {
    const errors: string[] = [];

    // Check if tour has at least one stop
    if (tour.stops.length === 0) {
      errors.push('Tour must have at least one stop');
    }

    // Check for date conflicts
    const sortedStops = [...tour.stops].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < sortedStops.length; i++) {
      const currentStop = sortedStops[i];
      const previousStop = sortedStops[i - 1];
      
      // Check for overlapping dates
      if (currentStop.date.getTime() <= previousStop.date.getTime()) {
        errors.push(`Stop at ${currentStop.venueId} overlaps with previous stop`);
      }

      // Check for minimum travel time (2 days between stops)
      const daysBetween = Math.floor(
        (currentStop.date.getTime() - previousStop.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysBetween < 2) {
        errors.push(`Insufficient travel time between stops (minimum 2 days required)`);
      }
    }

    // Check venue availability
    const venueBookings = new Map<string, Date[]>();
    tour.stops.forEach((stop: TourStop) => {
      const bookings = venueBookings.get(stop.venueId) || [];
      bookings.push(stop.date);
      venueBookings.set(stop.venueId, bookings);
    });

    venueBookings.forEach((dates, venueId) => {
      if (dates.length > 1) {
        errors.push(`Venue ${venueId} is booked multiple times`);
      }
    });

    return errors;
  }, []);

  const scheduleTour = useCallback((tour: Tour) => {
    const errors = validateTourSchedule(tour);
    if (errors.length > 0) {
      toast({
        title: "Tour Schedule Invalid",
        description: <TourScheduleErrors errors={errors} />,
        variant: "destructive"
      });
      return false;
    }

    // Calculate tour expenses
    const totalExpenses = tour.stops.reduce((sum: number, stop: TourStop) => {
      const venue = gameState.venues.find((v: TourVenue) => v.id === stop.venueId);
      if (!venue) return sum;
      
      // Base expenses: venue rental + travel costs
      const venueRental = venue.rentalCost;
      const travelCost = 1000; // Base travel cost between stops
      
      return sum + venueRental + travelCost;
    }, 0);

    // Update tour with calculated expenses
    const updatedTour: Tour = {
      ...tour,
      totalExpenses,
      status: 'scheduled'
    };

    setGameState(prevState => ({
      ...prevState,
      tours: [...prevState.tours, updatedTour]
    }));

    toast({
      title: "Tour Scheduled",
      description: `${tour.name} has been scheduled successfully!`
    });

    return true;
  }, [gameState, setGameState, validateTourSchedule]);

  const getAvailableVenues = useCallback((bandId: string, startDate: Date, endDate: Date) => {
    const band = gameState.bands.find(b => b.id === bandId);
    if (!band) return [];

    return gameState.venues.filter(venue => {
      // Check if venue is already booked during the period
      const isBooked = gameState.tours.some((tour: Tour) =>
        tour.stops.some((stop: TourStop) =>
          stop.venueId === venue.id &&
          stop.date >= startDate &&
          stop.date <= endDate
        )
      );

      if (isBooked) return false;

      // Check venue suitability
      const { suitable } = calculateVenueSuitability(venue, band.reputation, band.genre);
      return suitable;
    });
  }, [gameState, calculateVenueSuitability]);

  const suggestTourSchedule = useCallback((
    bandId: string,
    startDate: Date,
    endDate: Date,
    numberOfStops: number
  ) => {
    const availableVenues = getAvailableVenues(bandId, startDate, endDate);
    if (availableVenues.length === 0) return null;

    const band = gameState.bands.find(b => b.id === bandId);
    if (!band) return null;

    // Sort venues by reputation requirement (ascending)
    const sortedVenues = [...availableVenues].sort(
      (a, b) => a.reputationRequirement - b.reputationRequirement
    );

    // Calculate days between stops
    const totalDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysBetweenStops = Math.floor(totalDays / (numberOfStops + 1));

    // Create tour stops
    const stops: TourStop[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + daysBetweenStops);

    for (let i = 0; i < numberOfStops; i++) {
      if (i >= sortedVenues.length) break;

      const venue = sortedVenues[i];
      const expectedAttendance = calculateExpectedAttendance(
        venue,
        band.reputation,
        band.genre,
        venue.baseTicketPrice
      );

      stops.push({
        id: `stop-${i + 1}`,
        venueId: venue.id,
        date: new Date(currentDate),
        expectedAttendance,
        ticketPrice: venue.baseTicketPrice,
        expenses: venue.rentalCost + 1000, // venue rental + travel cost
        status: 'scheduled'
      });

      currentDate.setDate(currentDate.getDate() + daysBetweenStops);
    }

    return {
      id: `tour-${Date.now()}`,
      bandId,
      name: `${band.name} Tour ${new Date().getFullYear()}`,
      stops,
      status: 'scheduled',
      totalExpenses: stops.reduce((sum, stop) => sum + stop.expenses, 0)
    };
  }, [gameState, getAvailableVenues, calculateExpectedAttendance]);

  return {
    validateTourSchedule,
    scheduleTour,
    getAvailableVenues,
    suggestTourSchedule
  };
}; 