import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChartEntry } from '@/types/charts';
import { GameState } from '@/types/game';
import { calculateContactCost, calculateContactSuccess } from '@/data/chartsData';
import { toast } from '@/hooks/use-toast';

interface ArtistContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartEntry: ChartEntry;
  gameState: GameState;
  onSubmit: (offer: number) => void;
}

export const ArtistContactModal: React.FC<ArtistContactModalProps> = ({
  isOpen,
  onClose,
  chartEntry,
  gameState,
  onSubmit
}) => {
  const [offerAmount, setOfferAmount] = useState(0);
  const [message, setMessage] = useState('');

  const artist = chartEntry.song.artist;
  const suggestedCost = calculateContactCost(
    chartEntry.position,
    artist.popularity,
    gameState.playerData.reputation || 0
  );

  const successProbability = calculateContactSuccess(
    chartEntry.position,
    artist.popularity,
    gameState.playerData.reputation || 0,
    offerAmount || suggestedCost
  );

  const handleSubmit = () => {
    if (offerAmount <= 0) {
      return;
    }
    
    if (artist.availability.status !== 'available' && !artist.availability.availableFrom) {
      toast({
        title: "🎤 Artist Unavailable",
        description: `${artist.name} is currently ${artist.availability.status} and not accepting new projects.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(offerAmount);
  };

  const setQuickOffer = (multiplier: number) => {
    setOfferAmount(Math.floor(suggestedCost * multiplier));
  };

  // Initialize offer to suggested amount when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setOfferAmount(suggestedCost);
      setMessage(`Hi ${artist.name}! We'd love to work with you on your next project. Our studio has great facilities and we think we could create something amazing together.`);
    }
  }, [isOpen, suggestedCost, artist.name]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-600">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            🎤 Contact Artist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Artist Info */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">{artist.name}</h3>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                #{chartEntry.position}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-300 mb-2">
              "{chartEntry.song.title}"
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="capitalize">{artist.genre}</span>
              <span>Popularity: {artist.popularity}%</span>
              <span>{chartEntry.weeksOnChart} weeks charting</span>
            </div>
            
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`font-medium ${
                artist.availability.status === 'available' ? 'text-green-400' :
                artist.availability.status === 'busy' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {artist.availability.status.toUpperCase()}
              </span>
              {artist.availability.availableFrom && (
                <span className="text-gray-400">
                  (Available in {artist.availability.availableFrom} days)
                </span>
              )}
              <span className="text-blue-400">
                Avg. Response: {artist.availability.responseTime} days
              </span>
            </div>
          </div>

          {/* Offer Amount */}
          <div>
            <Label htmlFor="offer" className="text-white">
              Collaboration Offer ($)
            </Label>
            <div className="mt-1 space-y-2">
              <Input
                id="offer"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(parseInt(e.target.value) || 0)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter offer amount..."
              />
              
              {/* Quick Offer Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickOffer(0.8)}
                  className="text-xs"
                >
                  Low (${Math.floor(suggestedCost * 0.8).toLocaleString()})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickOffer(1.0)}
                  className="text-xs"
                >
                  Fair (${suggestedCost.toLocaleString()})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickOffer(1.3)}
                  className="text-xs"
                >
                  High (${Math.floor(suggestedCost * 1.3).toLocaleString()})
                </Button>
              </div>
            </div>
          </div>

          {/* Success Probability */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Success Probability:</span>
              <span className={`font-bold ${
                successProbability > 0.7 ? 'text-green-400' :
                successProbability > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(successProbability * 100)}%
              </span>
            </div>
            
            <div className="mt-1 text-xs text-gray-500">
              Based on chart position, your reputation, and offer amount
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-white">
              Message (Optional)
            </Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
              rows={3}
              placeholder="Add a personal message..."
            />
          </div>

          {/* Budget Check */}
          {offerAmount > gameState.money && (
            <div className="p-2 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
              ⚠️ Insufficient funds! You have ${gameState.money.toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={offerAmount <= 0 || offerAmount > gameState.money}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Send Request
            </Button>
          </div>

          {/* Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>💡 <strong>Tips:</strong></div>
            <div>• Higher chart positions require bigger offers</div>
            <div>• Build reputation to get better response rates</div>
            <div>• Artists may counter-offer if your bid is too low</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
