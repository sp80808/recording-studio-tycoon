/**
 * @fileoverview Tape Splicing Minigame - Analog Era (1960s-1970s)
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-08
 * @modified 2025-06-08
 * 
 * Era-specific minigame simulating analog tape editing with precision timing.
 * Players must cut and splice tape at exact points to remove unwanted sections.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Scissors, Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';

interface TapeSegment {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
}

interface TapeSplicingGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

export const TapeSplicingGame: React.FC<TapeSplicingGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [segments, setSegments] = React.useState<TapeSegment[]>([]);
  const [selectedSegments, setSelectedSegments] = React.useState<string[]>([]);
  const [targetArrangement, setTargetArrangement] = React.useState<string[]>([]);
  const [accuracy, setAccuracy] = React.useState(0);

  // Generate initial tape segments based on difficulty
  React.useEffect(() => {
    const numSegments = 3 + difficulty;
    const newSegments: TapeSegment[] = Array.from({ length: numSegments }, (_, i) => ({
      id: `segment-${i}`,
      content: `Part ${i + 1}`,
      startTime: i * 2,
      endTime: (i + 1) * 2
    }));

    // Shuffle segments for the target arrangement
    const shuffled = [...newSegments].sort(() => Math.random() - 0.5);
    setSegments(newSegments);
    setTargetArrangement(shuffled.map(s => s.id));
  }, [difficulty]);

  const handleSegmentClick = (segmentId: string) => {
    setSelectedSegments(prev => {
      const newSelection = [...prev, segmentId];
      
      // Check if we have all segments selected
      if (newSelection.length === segments.length) {
        const correctOrder = newSelection.every((id, index) => id === targetArrangement[index]);
        const score = correctOrder ? 100 : Math.max(0, 100 - (difficulty * 10));
        onComplete(score);
      }
      
      return newSelection;
    });
  };

  return (
    <BaseMinigame
      type="tape_splicing"
      difficulty={difficulty}
      onComplete={onComplete}
      onFail={onFail}
      onClose={onClose}
    >
      <div className="space-y-8">
        {/* Target Arrangement Display */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white mb-2">Target Arrangement:</h3>
          <div className="flex gap-2 flex-wrap">
            {targetArrangement.map((segmentId, index) => (
              <div
                key={segmentId}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >
                {segments.find(s => s.id === segmentId)?.content}
              </div>
            ))}
          </div>
        </div>

        {/* Tape Segments */}
        <div className="grid grid-cols-2 gap-4">
          {segments.map((segment) => (
            <motion.button
              key={segment.id}
              className={`p-4 rounded-lg ${
                selectedSegments.includes(segment.id)
                  ? 'bg-primary/50 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => !selectedSegments.includes(segment.id) && handleSegmentClick(segment.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={selectedSegments.includes(segment.id)}
            >
              <div className="text-white font-medium">{segment.content}</div>
              <div className="text-sm text-gray-400">
                {segment.startTime}s - {segment.endTime}s
              </div>
            </motion.button>
          ))}
        </div>

        {/* Selected Segments */}
        {selectedSegments.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white mb-2">Your Arrangement:</h3>
            <div className="flex gap-2 flex-wrap">
              {selectedSegments.map((segmentId) => (
                <div
                  key={segmentId}
                  className="px-3 py-1 bg-primary text-white rounded"
                >
                  {segments.find(s => s.id === segmentId)?.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseMinigame>
  );
};
