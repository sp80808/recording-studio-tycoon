import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Band } from '@/types/bands';

interface RecordTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: Band;
  onCreateOriginalTrack: (bandId: string, trackTitle: string, genre: string) => void;
}

// Placeholder genres - replace with actual game data later
const availableGenres = [
  'Rock',
  'Pop',
  'Electronic',
  'Hip Hop',
  'R&B',
  'Country',
  'Jazz',
  'Blues',
];

export const RecordTrackModal: React.FC<RecordTrackModalProps> = ({
  isOpen,
  onClose,
  band,
  onCreateOriginalTrack,
}) => {
  const [trackTitle, setTrackTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const handleCreateTrack = () => {
    if (trackTitle.trim() && selectedGenre) {
      onCreateOriginalTrack(band.id, trackTitle.trim(), selectedGenre);
      setTrackTitle('');
      setSelectedGenre('');
      onClose();
    } else {
      // TODO: Add some user feedback for missing fields
      console.warn('Track title and genre are required.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Record New Track for {band.bandName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trackTitle" className="text-right text-gray-300">
              Track Title
            </Label>
            <Input
              id="trackTitle"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              className="col-span-3 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="text-right text-gray-300">
              Genre
            </Label>
            <Select onValueChange={setSelectedGenre} value={selectedGenre}>
              <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                {availableGenres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* TODO: Add customizable details fields here */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={handleCreateTrack} className="bg-green-600 hover:bg-green-700">
            Start Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
