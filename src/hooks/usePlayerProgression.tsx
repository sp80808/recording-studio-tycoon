import { GameState, PlayerAttributes } from '@/types/game';
import { upgradePlayerAttribute } from '@/utils/playerUtils';

export const usePlayerProgression = (_gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => ({
  spendPerkPoint: (attribute: keyof PlayerAttributes) => {
    setGameState(prev => upgradePlayerAttribute(prev, attribute));
  },
});
