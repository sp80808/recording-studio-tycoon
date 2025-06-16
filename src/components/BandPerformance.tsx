import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Band } from '@/types/bands';
import { useBandPerformance } from '@/hooks/useBandPerformance';

interface BandPerformanceProps {
  band: Band;
}

export const BandPerformance: React.FC<BandPerformanceProps> = ({ band }) => {
  const { calculateBandPerformance, getPerformanceFeedback } = useBandPerformance();
  const performance = calculateBandPerformance(band);
  const feedback = getPerformanceFeedback(performance);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall</span>
              <span className="text-sm font-medium">{performance.overall}%</span>
            </div>
            <Progress value={performance.overall} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Technical</span>
              <span className="text-sm font-medium">{performance.technical}%</span>
            </div>
            <Progress value={performance.technical} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Creativity</span>
              <span className="text-sm font-medium">{performance.creativity}%</span>
            </div>
            <Progress value={performance.creativity} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Stage Presence</span>
              <span className="text-sm font-medium">{performance.stagePresence}%</span>
            </div>
            <Progress value={performance.stagePresence} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Genre Match</span>
              <span className="text-sm font-medium">{performance.genreMatch}%</span>
            </div>
            <Progress value={performance.genreMatch} className="h-2" />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Performance Feedback</h4>
          <ul className="space-y-1">
            {feedback.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 