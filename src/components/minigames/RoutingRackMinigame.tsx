import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EffectUnit {
  id: string;
  type: 'input' | 'output' | 'effect';
  name: string;
  connections: string[];
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  active: boolean;
}

interface RoutingRackMinigameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export const RoutingRackMinigame: React.FC<RoutingRackMinigameProps> = ({
  difficulty,
  onComplete,
  onCancel
}) => {
  const [effectUnits, setEffectUnits] = useState<EffectUnit[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Initialize effect units based on difficulty
    const units: EffectUnit[] = [
      { id: 'input', type: 'input', name: 'Input', connections: [], position: { x: 50, y: 50 } },
      { id: 'output', type: 'output', name: 'Output', connections: [], position: { x: 750, y: 50 } }
    ];

    // Add effect units based on difficulty
    const effectTypes = ['EQ', 'Compressor', 'Reverb', 'Delay', 'Chorus'];
    for (let i = 0; i < Math.min(difficulty + 2, effectTypes.length); i++) {
      units.push({
        id: `effect_${i}`,
        type: 'effect',
        name: effectTypes[i],
        connections: [],
        position: {
          x: 200 + (i * 150),
          y: 50 + (Math.random() * 100)
        }
      });
    }

    setEffectUnits(units);
  }, [difficulty]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      onComplete(score);
    }
  }, [timeLeft, score, onComplete]);

  const handleUnitClick = (unitId: string) => {
    if (selectedUnit === null) {
      setSelectedUnit(unitId);
    } else if (selectedUnit !== unitId) {
      // Create new connection
      const newConnection: Connection = {
        id: `${selectedUnit}-${unitId}`,
        from: selectedUnit,
        to: unitId,
        active: false
      };

      // Check if connection is valid
      const fromUnit = effectUnits.find(u => u.id === selectedUnit);
      const toUnit = effectUnits.find(u => u.id === unitId);

      if (fromUnit && toUnit) {
        const isValid = (
          (fromUnit.type === 'input' && toUnit.type === 'effect') ||
          (fromUnit.type === 'effect' && toUnit.type === 'effect') ||
          (fromUnit.type === 'effect' && toUnit.type === 'output')
        );

        if (isValid) {
          newConnection.active = true;
          setScore(prev => prev + 10);
        }
      }

      setConnections(prev => [...prev, newConnection]);
      setSelectedUnit(null);
    } else {
      setSelectedUnit(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg w-[800px] h-[600px] relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Routing Rack Minigame</h2>
          <div className="flex items-center space-x-4">
            <span className="text-white">Score: {score}</span>
            <span className="text-white">Time: {timeLeft}s</span>
          </div>
        </div>

        {/* Rack Area */}
        <div className="relative w-full h-[500px] bg-gray-800 rounded">
          {/* Effect Units */}
          {effectUnits.map(unit => (
            <motion.div
              key={unit.id}
              className={`absolute w-24 h-24 rounded-lg flex items-center justify-center cursor-pointer
                         ${selectedUnit === unit.id ? 'ring-2 ring-blue-500' : ''}
                         ${unit.type === 'input' ? 'bg-green-600' : 
                           unit.type === 'output' ? 'bg-red-600' : 'bg-blue-600'}`}
              style={{ left: unit.position.x, top: unit.position.y }}
              onClick={() => handleUnitClick(unit.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-medium">{unit.name}</span>
            </motion.div>
          ))}

          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full">
            {connections.map(conn => {
              const fromUnit = effectUnits.find(u => u.id === conn.from);
              const toUnit = effectUnits.find(u => u.id === conn.to);
              
              if (!fromUnit || !toUnit) return null;

              return (
                <motion.path
                  key={conn.id}
                  d={`M ${fromUnit.position.x + 48} ${fromUnit.position.y + 48} 
                      L ${toUnit.position.x} ${toUnit.position.y + 48}`}
                  stroke={conn.active ? '#10B981' : '#EF4444'}
                  strokeWidth={2}
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
          </svg>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}; 