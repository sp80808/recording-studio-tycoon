import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Payload {
  title: string;
  loreBrief: string;
}

interface Props {
  payload: Payload;
  onComplete: () => void;
}

export function CinematicStoryCutscene({ payload, onComplete }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        onComplete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none backdrop-blur-md bg-black/80"
      >
        <div className="max-w-2xl text-center text-white pointer-events-auto p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
          
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-5xl font-light text-amber-500 mb-6 font-serif tracking-wide"
          >
            {payload.title}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-300 leading-relaxed font-sans mb-12"
          >
            {payload.loreBrief}
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            onClick={onComplete}
            className="border border-white/20 hover:border-white/50 text-gray-400 hover:text-white transition-colors px-8 py-3 rounded-sm uppercase tracking-[0.2em] text-sm"
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
