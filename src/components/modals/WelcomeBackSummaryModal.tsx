import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { SimulationSummary } from '@/simulation/simulationClock';

interface WelcomeBackSummaryModalProps {
  summary: SimulationSummary | null;
  onClose: () => void;
}

const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(1, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const WelcomeBackSummaryModal: React.FC<WelcomeBackSummaryModalProps> = ({
  summary,
  onClose
}) => {
  if (!summary) return null;

  return (
    <Dialog open={!!summary} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-950 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>While you were away</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Studio time credited</div>
            <div className="text-lg font-semibold mt-1">
              {formatDuration(summary.creditedMs)}
            </div>
            {summary.wasCapped && (
              <div className="text-xs text-amber-300 mt-1">
                Offline progress reached the current safety cap.
              </div>
            )}
          </div>

          {summary.workUnitsAdded > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Session progress</span>
              <span className="font-medium">+{summary.workUnitsAdded.toFixed(1)} work</span>
            </div>
          )}

          {summary.stagesCompleted.length > 0 && (
            <div>
              <div className="text-gray-400 mb-1">Stages completed</div>
              <div className="space-y-1">
                {summary.stagesCompleted.map((stage, index) => (
                  <div key={`${stage}-${index}`} className="text-green-300">
                    ✓ {stage}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.projectsReadyForReview.length > 0 && (
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
              <div className="font-medium text-purple-200">Session ready for delivery</div>
              {summary.projectsReadyForReview.map(project => (
                <div key={project.projectId} className="text-sm text-gray-300 mt-1">
                  {project.title}
                </div>
              ))}
            </div>
          )}

          {summary.staffEnergySpent > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Staff energy used</span>
              <span className="text-gray-400">{summary.staffEnergySpent.toFixed(0)}</span>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
          Back to the studio
        </Button>
      </DialogContent>
    </Dialog>
  );
};
