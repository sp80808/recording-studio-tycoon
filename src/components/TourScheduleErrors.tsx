import React from 'react';

interface TourScheduleErrorsProps {
  errors: string[];
}

export const TourScheduleErrors: React.FC<TourScheduleErrorsProps> = ({ errors }) => {
  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <p key={index} className="text-red-500">{error}</p>
      ))}
    </div>
  );
}; 