import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Volume2 } from 'lucide-react';

interface FrequencyResponseChartProps {
  frequencyData: { frequency: number; response: number }[];
}

export const FrequencyResponseChart: React.FC<FrequencyResponseChartProps> = ({ frequencyData }) => {
  return (
    <Card className="p-4 bg-stone-800/50 border-stone-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Volume2 className="h-4 w-4" />
        Frequency Response
      </h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={frequencyData}>
          <XAxis 
            dataKey="frequency" 
            scale="log" 
            domain={[20, 20000]}
            tick={{ fontSize: 10, fill: '#aaa6a1' }}
          />
          <YAxis 
            domain={[-6, 6]} 
            tick={{ fontSize: 10, fill: '#aaa6a1' }}
            label={{ value: 'dB', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#aaa6a1' } }}
          />
          <Line 
            type="monotone" 
            dataKey="response" 
            stroke="#d49f45" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-stone-500 mt-1">Flat response = accurate reproduction</p>
    </Card>
  );
};
