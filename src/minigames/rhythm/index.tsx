import React from 'react';
import { GameEngine } from 'react-game-engine';
import { MoveFinger, UpdateNotes, CheckHits } from './systems';
import { Notes, Target, Score } from './renderers';

interface RhythmMinigameProps {
  onFinish: (score: number) => void;
}

const RhythmMinigame: React.FC<RhythmMinigameProps> = ({ onFinish }) => {
  const entities = {
    finger: { x: 50, y: 400, renderer: <div /> },
    notes: [{ x: 100, y: 0 }, { x: 200, y: -100 }],
    target: { x: 50, y: 100, renderer: <Target x={50} y={100} /> },
    score: { value: 0, renderer: <Score value={0} /> },
  };

  return (
    <GameEngine
      style={{ width: 800, height: 600, backgroundColor: 'black' }}
      systems={[MoveFinger, UpdateNotes, CheckHits(onFinish)]}
      entities={entities}
    >
      <Notes notes={entities.notes} />
    </GameEngine>
  );
};

export default RhythmMinigame;
