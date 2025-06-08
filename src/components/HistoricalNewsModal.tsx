import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HistoricalEvent } from '@/utils/historicalEvents';

interface HistoricalNewsModalProps {
  event: HistoricalEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'technology': return 'bg-blue-600';
    case 'cultural': return 'bg-purple-600';
    case 'business': return 'bg-green-600';
    case 'legal': return 'bg-red-600';
    case 'social': return 'bg-orange-600';
    default: return 'bg-gray-600';
  }
};

const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'technology': return '⚡';
    case 'cultural': return '🎭';
    case 'business': return '💼';
    case 'legal': return '⚖️';
    case 'social': return '👥';
    default: return '📰';
  }
};

export const HistoricalNewsModal: React.FC<HistoricalNewsModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  if (!event) return null;

  const hasImpact = event.impact.genrePopularityChanges || 
                   event.impact.equipmentDemandChanges || 
                   event.impact.marketChanges;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
            <span>Breaking News - {event.year}</span>
            <Badge className={`${getEventTypeColor(event.type)} text-white ml-auto`}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Title */}
          <h3 className="text-2xl font-bold text-yellow-400">
            {event.title}
          </h3>

          {/* Event Description */}
          <p className="text-gray-300 leading-relaxed">
            {event.description}
          </p>

          {/* Educational Info */}
          {event.educationalInfo && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-2">📚 Industry Context:</h4>
              <p className="text-gray-300 text-sm">
                {event.educationalInfo}
              </p>
            </div>
          )}

          {/* Impact Analysis */}
          {hasImpact && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-3">📈 Industry Impact:</h4>
              
              <div className="space-y-3">
                {/* Genre Popularity Changes */}
                {event.impact.genrePopularityChanges && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Genre Trends:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.impact.genrePopularityChanges).map(([genre, change]) => (
                        <Badge 
                          key={genre}
                          className={`${change > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}
                        >
                          {genre} {change > 0 ? '↗' : '↘'} {Math.abs(change)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Demand Changes */}
                {event.impact.equipmentDemandChanges && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Equipment Demand:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.impact.equipmentDemandChanges).map(([equipment, multiplier]) => (
                        <Badge 
                          key={equipment}
                          className={`${multiplier > 1 ? 'bg-blue-600' : 'bg-orange-600'} text-white`}
                        >
                          {equipment.replace('_', ' ')} {multiplier > 1 ? '↗' : '↘'} {(multiplier * 100).toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Changes */}
                {event.impact.marketChanges && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Market Effects:</h5>
                    <div className="flex flex-wrap gap-2">
                      {event.impact.marketChanges.payoutMultiplier && (
                        <Badge className={`${event.impact.marketChanges.payoutMultiplier > 1 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                          Project Revenue {event.impact.marketChanges.payoutMultiplier > 1 ? '↗' : '↘'} 
                          {((event.impact.marketChanges.payoutMultiplier - 1) * 100).toFixed(0)}%
                        </Badge>
                      )}
                      {event.impact.marketChanges.reputationMultiplier && (
                        <Badge className={`${event.impact.marketChanges.reputationMultiplier > 1 ? 'bg-purple-600' : 'bg-gray-600'} text-white`}>
                          Reputation Gain {event.impact.marketChanges.reputationMultiplier > 1 ? '↗' : '↘'} 
                          {((event.impact.marketChanges.reputationMultiplier - 1) * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Continue Building Your Legacy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
