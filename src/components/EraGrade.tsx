import React from 'react';
import { ERA_DEFINITIONS, visualEraId } from '@/utils/eraProgression';

interface EraGradeProps {
  eraId: string;
}

/**
 * Cinematic color grade driven by the current era (bead goj.3).
 * Pointer-events-none overlay: a subtle persistent tint from the era palette
 * plus a one-shot flash whenever the era changes (key remount replays it).
 */
export const EraGrade: React.FC<EraGradeProps> = ({ eraId }) => {
  const era = ERA_DEFINITIONS.find(e => e.id === visualEraId(eraId)) ?? ERA_DEFINITIONS[0];

  return (
    <div
      key={era.id}
      className="animate-era-grade pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background: [
          `linear-gradient(135deg, ${era.colors.primary}2e 0%, transparent 55%)`,
          `linear-gradient(315deg, ${era.colors.secondary}26 0%, transparent 50%)`,
          'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42) 100%)',
        ].join(', '),
      }}
    />
  );
};
