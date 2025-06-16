import React from 'react';

interface TourCompletionToastProps {
  totalRevenue: number;
  totalExpenses: number;
  totalReputation: number;
}

export const TourCompletionToast: React.FC<TourCompletionToastProps> = ({
  totalRevenue,
  totalExpenses,
  totalReputation
}) => {
  return (
    <div className="space-y-2">
      <p>Total Revenue: ${totalRevenue.toLocaleString()}</p>
      <p>Total Expenses: ${totalExpenses.toLocaleString()}</p>
      <p>Net Profit: ${(totalRevenue - totalExpenses).toLocaleString()}</p>
      <p>Reputation Impact: +{totalReputation}</p>
    </div>
  );
}; 