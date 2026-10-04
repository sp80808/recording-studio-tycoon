import React from 'react';
import type { GameState } from '@/types/game';
import { ProducerSprite } from '@/components/ProducerSprite';
import type { NpcAnimationState } from '@/features/sprites/npcAnimation';

export interface ProducerBadgeProps {
  producerCustomization?: GameState['producerCustomization'];
  selectedEra?: GameState['selectedEra'];
  animationState?: NpcAnimationState;
  scale?: number;
  className?: string;
}

/**
 * Archived Producer Badge / Card component.
 * Originally rendered in the bottom corner of StudioRoom (#126).
 * Archived for repurposing elsewhere (e.g., career hub, credits, studio profile, HUD).
 */
export const ProducerBadge: React.FC<ProducerBadgeProps> = ({
  producerCustomization,
  selectedEra,
  animationState = 'idle',
  scale = 2,
  className = '',
}) => {
  return (
    <div
      className={`pointer-events-none select-none flex flex-col items-center rounded border border-[var(--rst-line-strong)] bg-black/40 px-2 pb-1.5 pt-1 backdrop-blur-[2px] ${className}`}
      data-testid="producer-badge"
    >
      <ProducerSprite
        producerCustomization={producerCustomization}
        selectedEra={selectedEra}
        animationState={animationState}
        scale={scale}
      />
      <span className="mt-0.5 max-w-[96px] truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--rst-brass-300)]">
        {producerCustomization?.moniker ?? 'Producer'}
      </span>
    </div>
  );
};

export default ProducerBadge;
