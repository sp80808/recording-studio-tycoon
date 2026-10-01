import React, { useMemo } from 'react';
import type { GameState } from '@/types/game';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import type { NpcAnimationState } from '@/features/sprites/npcAnimation';
import { producerNpcFor } from '@/utils/producerCustomization';

interface ProducerSpriteProps {
  /** Only the slice the sprite depends on, so unrelated state ticks never rebuild it. */
  producerCustomization: GameState['producerCustomization'];
  selectedEra: GameState['selectedEra'];
  animationState?: NpcAnimationState;
  scale?: number;
  showBadge?: boolean;
  className?: string;
}

/** The player's producer, drawn by the shared modular sprite renderer from saved customization. */
export const ProducerSprite: React.FC<ProducerSpriteProps> = ({
  producerCustomization,
  selectedEra,
  animationState = 'idle',
  scale = 2,
  showBadge = false,
  className = '',
}) => {
  const npc = useMemo(
    () => producerNpcFor({ producerCustomization, selectedEra }),
    [producerCustomization, selectedEra],
  );
  return (
    <div className={className} data-testid="producer-sprite" role="img" aria-label={`${npc.name}, your producer`}>
      <ModularSpriteRenderer npc={npc} animationState={animationState} scale={scale} showBadge={showBadge} />
    </div>
  );
};
