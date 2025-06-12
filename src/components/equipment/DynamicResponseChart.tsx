import React from 'react';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

interface DynamicResponseChartProps {
  dynamicData: { time: number; input: number; output: number }[];
}

export const DynamicResponseChart: React.FC<DynamicResponseChartProps> = ({ dynamicData }) => {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4" />
        Dynamic Response
      </h3>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={dynamicData}>
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis 
            domain={[-40, 0]} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            label={{ value: 'dB', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
          />
          <Area
            type="monotone"
            dataKey="input"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="output"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>🔴 Input</span>
        <span>🟢 Output</span>
      </div>
    </Card>
  );
};
