import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { EraAvailableEquipment } from '@/data/eraEquipment';

interface HarmonicDistortionChartProps {
  harmonicsData: { harmonic: string; level: number }[];
  isVintage: boolean | undefined;
}

export const HarmonicDistortionChart: React.FC<HarmonicDistortionChartProps> = ({ harmonicsData, isVintage }) => {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Harmonic Distortion
      </h3>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={harmonicsData}>
          <XAxis 
            dataKey="harmonic" 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis 
            domain={[0, 1]} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            label={{ value: '%', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
          />
          <Line 
            type="monotone" 
            dataKey="level" 
            stroke={isVintage ? "#f59e0b" : "#06b6d4"} 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-1">
        {isVintage ? 'Vintage warmth & character' : 'Clean & transparent'}
      </p>
    </Card>
  );
};
