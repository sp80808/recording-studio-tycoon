import React from 'react';

interface RewardsToastProps {
  money: number;
  experience: number;
  fanGain: number;
  specialEvents: string[];
}

export const RewardsToast: React.FC<RewardsToastProps> = ({
  money,
  experience,
  fanGain,
  specialEvents
}) => {
  return (
    <div className="space-y-2">
      <p>Money: +${money.toLocaleString()}</p>
      <p>Experience: +{experience}</p>
      <p>Fans: +{fanGain}</p>
      {specialEvents.length > 0 && (
        <div>
          <p className="font-semibold">Special Events:</p>
          <ul className="list-disc list-inside">
            {specialEvents.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 