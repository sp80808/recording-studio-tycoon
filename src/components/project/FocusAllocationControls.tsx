
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { FocusAllocation } from '@/types/game';

interface FocusAllocationControlsProps {
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
}

export const FocusAllocationControls: React.FC<FocusAllocationControlsProps> = ({
  focusAllocation,
  setFocusAllocation
}) => {
  return (
    <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <h4 className="text-white font-semibold">Focus Allocation</h4>
      
      <div className="hover-scale">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-300">🎭 Performance ({focusAllocation.performance}%)</label>
        </div>
        <Slider
          value={[focusAllocation.performance]}
          onValueChange={(value) => setFocusAllocation({...focusAllocation, performance: value[0]})}
          max={100}
          step={5}
          className="w-full transition-all duration-200"
        />
      </div>

      <div className="hover-scale">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-300">🎤 Sound Capture ({focusAllocation.soundCapture}%)</label>
        </div>
        <Slider
          value={[focusAllocation.soundCapture]}
          onValueChange={(value) => setFocusAllocation({...focusAllocation, soundCapture: value[0]})}
          max={100}
          step={5}
          className="w-full transition-all duration-200"
        />
      </div>

      <div className="hover-scale">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-300">🎚️ Layering ({focusAllocation.layering}%)</label>
        </div>
        <Slider
          value={[focusAllocation.layering]}
          onValueChange={(value) => setFocusAllocation({...focusAllocation, layering: value[0]})}
          max={100}
          step={5}
          className="w-full transition-all duration-200"
        />
      </div>
    </div>
  );
};
