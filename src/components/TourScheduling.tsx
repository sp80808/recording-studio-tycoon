import React, { useState } from 'react';
import { Tour, TourStop } from '@/types/game';
import { useTourScheduling } from '@/hooks/useTourScheduling';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface TourSchedulingProps {
  bandId: string;
  onTourScheduled?: (tour: Tour) => void;
}

export const TourScheduling: React.FC<TourSchedulingProps> = ({ bandId, onTourScheduled }) => {
  const { gameState, setGameState } = useGameState();
  const { validateTourSchedule, scheduleTour, getAvailableVenues, suggestTourSchedule } = useTourScheduling({
    gameState,
    setGameState
  });

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [numberOfStops, setNumberOfStops] = useState<number>(3);
  const [suggestedTour, setSuggestedTour] = useState<Tour | null>(null);

  const handleSuggestSchedule = () => {
    if (!startDate || !endDate) return;

    const tour = suggestTourSchedule(bandId, startDate, endDate, numberOfStops);
    if (tour) {
      setSuggestedTour(tour);
    }
  };

  const handleScheduleTour = () => {
    if (!suggestedTour) return;

    const success = scheduleTour(suggestedTour);
    if (success && onTourScheduled) {
      onTourScheduled(suggestedTour);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Number of Stops</Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={numberOfStops}
          onChange={(e) => setNumberOfStops(parseInt(e.target.value))}
        />
      </div>

      <div className="flex space-x-4">
        <Button onClick={handleSuggestSchedule}>
          Suggest Schedule
        </Button>
        {suggestedTour && (
          <Button onClick={handleScheduleTour}>
            Schedule Tour
          </Button>
        )}
      </div>

      {suggestedTour && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Suggested Tour Schedule</h3>
          <div className="space-y-2">
            {suggestedTour.stops.map((stop: TourStop) => {
              const venue = gameState.venues.find(v => v.id === stop.venueId);
              return (
                <div key={stop.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{venue?.name}</p>
                  <p className="text-sm text-gray-500">
                    {format(stop.date, 'PPP')}
                  </p>
                  <p className="text-sm">
                    Expected Attendance: {stop.expectedAttendance.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Ticket Price: ${stop.ticketPrice.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="font-medium">Total Expenses: ${suggestedTour.totalExpenses.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 