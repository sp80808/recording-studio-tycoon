import React from 'react';
import { Card } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface EquipmentSpecsDisplayProps {
  specs: { label: string; value: string }[];
}

export const EquipmentSpecsDisplay: React.FC<EquipmentSpecsDisplayProps> = ({ specs }) => {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Technical Specifications
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {specs.map((spec, index) => (
          <div key={index} className="flex justify-between py-1">
            <span className="text-gray-400">{spec.label}:</span>
            <span className="text-white font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
