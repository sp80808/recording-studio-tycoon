import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Payload {
  score: number;
  gameType: string;
}

interface Props {
  payload: Payload;
  onComplete: () => void;
}

export function MinigameOutcomeCutscene({ payload, onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        clearTimeout(timer);
        onComplete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onComplete]);

  let rank = 'C';
  let rankColor = 'text-gray-400';
  let message = 'Session Complete';
  let borderColor = 'border-gray-500';

  if (payload.score >= 850) {
    rank = 'S';
    rankColor = 'text-yellow-400';
    message = 'Master Take!';
    borderColor = 'border-yellow-500';
  } else if (payload.score >= 700) {
    rank = 'A';
    rankColor = 'text-green-400';
    message = 'Great Take!';
    borderColor = 'border-green-500';
  } else if (payload.score <= 300) {
    rank = 'D';
    rankColor = 'text-red-500';
    message = 'Botched Take...';
    borderColor = 'border-red-600';
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none backdrop-blur-sm bg-black/40"
      >
        <div className={`bg-slate-900 border-2 ${borderColor} rounded-xl p-10 text-center text-white pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center min-w-[300px]`}>
          <h2 className={`text-4xl font-bold ${rankColor} mb-2 drop-shadow-md uppercase tracking-wider`}>{message}</h2>
          <div className="flex items-end gap-4 my-6">
            <div className={`text-7xl font-black ${rankColor} drop-shadow-lg`}>{rank}</div>
            <div className="text-xl text-gray-300 pb-2 font-mono">Rank</div>
          </div>
          <p className="text-gray-300 text-lg mb-8 font-mono">Score: {payload.score}</p>
          <button 
            onClick={onComplete}
            className="w-full bg-white/10 hover:bg-white/20 transition-colors px-6 py-3 rounded text-sm font-medium uppercase tracking-widest outline-none focus:ring-2 focus:ring-white/30"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
