import { useCallback } from 'react';
import { GameState, Tour, TourStop, TourVenue, Band } from '@/types/game';
import { PerformanceRating } from '@/types/performance';
import { useBandPerformance } from './useBandPerformance';
import { useBandReputation } from './useBandReputation';
import { useBandRewards } from './useBandRewards';
import { toast } from '@/components/ui/use-toast';
import { TourStopToast } from '@/components/TourStopToast';
import { TourCompletionToast } from '@/components/TourCompletionToast';

interface UseTourManagementProps {
  gameState: GameState;
  setGameState: (updater: GameState | ((prevState: GameState) => GameState)) => void;
}

export const useTourManagement = ({ gameState, setGameState }: UseTourManagementProps) => {
  const { calculateBandPerformance } = useBandPerformance();
  const { updateBandReputation, calculateReputationGain } = useBandReputation({
    gameState,
    setGameState,
  });
  // Assuming calculateRewards from useBandRewards takes (performance: PerformanceRating, attendance: number, bandId: string)
  const { calculateRewards } = useBandRewards({
    gameState,
    setGameState,
  });

  const calculateVenueSuitability = useCallback(
    (venue: TourVenue, bandReputation: number, genre: string) => {
      if (bandReputation < venue.reputationRequirement) {
        return { suitable: false, reason: 'Insufficient reputation', multiplier: 0 };
      }
      const genrePreference = venue.genrePreferences.find((pref: { genre: string; multiplier: number }) => pref.genre === genre);
      const genreMultiplier = genrePreference?.multiplier || 0.5;
      return { suitable: true, reason: 'Venue suitable', multiplier: genreMultiplier };
    },
    []
  );

  const calculateExpectedAttendance = useCallback(
    (venue: TourVenue, bandReputation: number, genre: string, ticketPrice: number) => {
      const { suitable, multiplier } = calculateVenueSuitability(venue, bandReputation, genre);
      if (!suitable) return 0;

      const baseAttendance = Math.floor(venue.capacity * (bandReputation / 100));
      const genreAdjustedAttendance = Math.floor(baseAttendance * multiplier);
      const priceSensitivityFactor = venue.baseTicketPrice > 0 ? (ticketPrice - venue.baseTicketPrice) / venue.baseTicketPrice : 0;
      const priceMultiplier = Math.max(0.5, 1 - priceSensitivityFactor);
      return Math.floor(genreAdjustedAttendance * priceMultiplier);
    },
    [calculateVenueSuitability]
  );

  const processTourStop = useCallback((tourId: string, stopId: string): TourStop | undefined => {
    const currentTour = gameState.tours.find((t: Tour) => t.id === tourId);
    const currentBand = gameState.bands.find((b: Band) => b.id === currentTour?.bandId);
    const currentStop = currentTour?.stops.find((s: TourStop) => s.id === stopId);

    if (!currentTour || !currentBand || !currentStop) {
      toast({ title: "Error", description: "Tour, band, or stop not found.", variant: "destructive" });
      return undefined;
    }

    const performanceRating = calculateBandPerformance(currentBand);
    const attendanceMultiplier = performanceRating.overall / 100;
    const actualAttendance = Math.floor(currentStop.expectedAttendance * attendanceMultiplier);
    const revenue = actualAttendance * currentStop.ticketPrice;
    
    const stopReputationGain = calculateReputationGain(performanceRating, currentBand);

    const updatedStopData: TourStop = {
      ...currentStop,
      status: 'completed',
      performanceRating,
      actualAttendance,
      revenue,
      reputationGain: stopReputationGain,
    };

    updateBandReputation(currentBand.id, performanceRating);
    calculateRewards(performanceRating, actualAttendance, currentBand.id);

    setGameState((prev: GameState) => {
      const updatedTours = prev.tours.map((t: Tour) =>
        t.id === tourId
          ? { ...t, stops: t.stops.map((s: TourStop) => (s.id === stopId ? updatedStopData : s)) }
          : t
      );
      return {
        ...prev,
        money: prev.money + revenue - currentStop.expenses,
        tours: updatedTours,
      };
    });

    const venue = gameState.venues.find((v: TourVenue) => v.id === currentStop.venueId);
    if (venue) {
      toast({
        title: "Tour Stop Completed!",
        description: (
          <TourStopToast
            venueName={venue.name}
            attendance={actualAttendance}
            revenue={revenue}
            reputationGain={stopReputationGain}
          />
        ),
      });
    }
    return updatedStopData;
  }, [gameState, setGameState, calculateBandPerformance, updateBandReputation, calculateRewards, calculateReputationGain]);

  const startTour = useCallback((tourId: string) => {
    const tourToStart = gameState.tours.find((t: Tour) => t.id === tourId);
    if (!tourToStart) return;

    setGameState((prev: GameState) => ({
      ...prev,
      tours: prev.tours.map((t: Tour) =>
        t.id === tourId ? { ...t, status: 'active' } : t
      ),
    }));
    
    toast({ title: "Tour Started!", description: `${tourToStart.name} has begun!` });
  }, [gameState.tours, setGameState]);

  const completeTour = useCallback((tourId: string) => {
    const tourToComplete = gameState.tours.find((t: Tour) => t.id === tourId);
    if (!tourToComplete) return;

    const completedStops = tourToComplete.stops.filter((stop: TourStop) => stop.status === 'completed');
    const totalRevenue = completedStops.reduce((sum: number, stop: TourStop) => sum + (stop.revenue || 0), 0);
    const totalExpenses = completedStops.reduce((sum: number, stop: TourStop) => sum + stop.expenses, 0);
    const totalReputationImpact = completedStops.reduce((sum: number, stop: TourStop) => sum + (stop.reputationGain || 0), 0);

    const updatedTourData: Tour = {
      ...tourToComplete,
      status: 'completed',
      totalRevenue,
      totalExpenses,
      reputationImpact: totalReputationImpact,
    };

    setGameState((prev: GameState) => ({
      ...prev,
      tours: prev.tours.map((t: Tour) => (t.id === tourId ? updatedTourData : t)),
    }));

    toast({
      title: "Tour Completed!",
      description: (
        <TourCompletionToast
          tourName={updatedTourData.name}
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
          totalReputation={totalReputationImpact}
        />
      ),
    });
  }, [gameState.tours, setGameState]);

  return {
    calculateVenueSuitability,
    calculateExpectedAttendance,
    processTourStop,
    startTour,
    completeTour,
  };
};
