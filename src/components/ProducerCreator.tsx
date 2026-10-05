import React, { useState } from 'react';
import { Dices, Undo2 } from 'lucide-react';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';
import { appearanceUi } from '@/features/sprites/appearanceFields';
import { sanitizeProducerAppearance, type ProducerAppearance, type ResolvedProducerAppearance } from '@/features/sprites/producerAppearance';
import useMediaQuery from '@/hooks/useMediaQuery';
import { AppearanceEditor } from './AppearanceEditor';

import './producer-creator.css';

interface ProducerCreatorProps {
  moniker: string;
  onMoniker: (name: string) => void;
  look: ProducerAppearance;
  npc: ModularNpcDefinition;
  /** Called with the complete next appearance (from a field edit, Undo or Surprise me). */
  onLookChange: (next: ProducerAppearance) => void;
  onRandomise: () => void;
}

/** Sprite pixel scale per layout: phones keep the preview pinned and compact, roomy desktops go large. */
export const previewScale = (compact: boolean, roomy: boolean): number => (compact ? 5 : roomy ? 10 : 7);

/** Large live preview beside the descriptor-driven editor (pinned above it on phones). */
export function ProducerCreator({ moniker, onMoniker, look, npc, onLookChange, onRandomise }: ProducerCreatorProps) {
  const compact = useMediaQuery('(max-width: 767px)');
  const roomy = useMediaQuery('(min-width: 768px) and (min-height: 760px)');
  const [previous, setPrevious] = useState<{ look: ProducerAppearance; name?: string } | null>(null);
  const change = (next: ResolvedProducerAppearance) => {
    setPrevious({ look: { ...look } });
    onLookChange(next);
  };

  return (
    <section className="producer-creator" aria-label={appearanceUi('appearance.ui.editor')} data-testid="producer-creator">
      <div className="producer-creator-preview" data-testid="producer-preview" role="img" data-appearance={JSON.stringify(sanitizeProducerAppearance(look))}
        aria-label={appearanceUi('appearance.ui.preview', { name: moniker || appearanceUi('appearance.ui.preview_fallback') })}>
        <ModularSpriteRenderer npc={npc} animationState="idle" scale={previewScale(compact, roomy)} showBadge={false} />
      </div>
      <div className="producer-creator-panel">
        <div className="producer-creator-head">
          <label className="producer-creator-name">
            {appearanceUi('appearance.ui.name')}
            <input value={moniker} onChange={(e) => onMoniker(e.target.value.slice(0, 24))}
              maxLength={24} enterKeyHint="done" autoComplete="off" autoCapitalize="words" spellCheck={false}
              className="rst-input" placeholder={appearanceUi('appearance.ui.name_placeholder')} />
          </label>
          <div className="producer-creator-tools">
            <button type="button" data-testid="producer-randomise" onClick={() => {
              setPrevious({ look: { ...look }, name: moniker });
              onRandomise();
            }}><Dices size={16} aria-hidden="true" /> {appearanceUi('appearance.ui.surprise')}</button>
            <button type="button" disabled={!previous} aria-label={appearanceUi('appearance.ui.undo_aria')} onClick={() => {
              if (!previous) return;
              onLookChange(previous.look);
              if (previous.name !== undefined) onMoniker(previous.name);
              setPrevious(null);
            }}><Undo2 size={16} aria-hidden="true" /> {appearanceUi('appearance.ui.undo')}</button>
          </div>
        </div>
        <AppearanceEditor appearance={look} onChange={change} wide />
      </div>
    </section>
  );
}
