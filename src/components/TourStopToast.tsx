import React from 'react';

interface TourStopToastProps {
  venueName: string;
  attendance: number;
  revenue: number;
  reputationGain: number;
}

export const TourStopToast: React.FC<TourStopToastProps> = ({
  venueName,
  attendance,
  revenue,
  reputationGain
}) => {
  return (
    <div className="space-y-2">
      <p>Venue: {venueName}</p>
      <p>Attendance: {attendance}</p>
      <p>Revenue: ${revenue.toLocaleString()}</p>
      <p>Reputation: +{reputationGain}</p>
    </div>
  );
}; 