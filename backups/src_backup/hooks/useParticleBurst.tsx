import React from 'react';

interface ParticleConfig {
  count?: number;
  colors?: string[];
  spread?: number;
  duration?: number;
  size?: number;
}

export const useParticleBurst = (
  targetRef: React.RefObject<HTMLElement>,
  trigger: boolean,
  config: ParticleConfig = {}
) => {
  return null;
};
