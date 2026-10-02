import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Dices } from 'lucide-react';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';
import {
  ACCESSORY_LABELS,
  APPEARANCE_LABELS,
  BUILD_LABELS,
  PRODUCER_ACCESSORIES,
  PRODUCER_BUILDS,
  PRODUCER_CLOTHES_COLOURS,
  PRODUCER_HAIR_COLOURS,
  PRODUCER_HAIR_SHAPES,
  PRODUCER_PANTS,
  PRODUCER_SHIRTS,
  PRODUCER_SHOES,
  PRODUCER_SKIN_TONES,
  type ProducerAccessory,
  type ProducerAppearance,
  type ProducerClothesColourId,
} from '@/features/sprites/producerAppearance';
import { CLOTHING_PALETTES, HAIR_HEX, SKIN_PALETTES } from '@/features/sprites/npcAppearanceData';

/** Cycle one step through a fixed option list, wrapping around. */
const cycle = <T extends string>(list: readonly T[], current: T, delta: number): T =>
  list[(list.indexOf(current) + delta + list.length) % list.length];

const pretty = (v: string) => APPEARANCE_LABELS[v] ?? v.replace(/_/g, ' ');

/** One changeable element: label, prev/next arrows (44px targets), current value, optional colour chip. */
function ArrowRow({ label, value, swatch, onPrev, onNext }: {
  label: string;
  value: string;
  swatch?: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
  };
  return (
    <div className="creator-row" role="group" aria-label={`${label}: ${value}`} onKeyDown={onKey} data-testid={`creator-row-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="creator-row-label">{label}</span>
      <button type="button" className="creator-arrow" aria-label={`Previous ${label}`} onClick={onPrev}>
        <ArrowLeft size={16} aria-hidden="true" />
      </button>
      <span className="creator-row-value">
        {swatch && <span aria-hidden="true" className="creator-row-chip" style={{ background: swatch }} />}
        <span className="truncate capitalize">{value}</span>
      </span>
      <button type="button" className="creator-arrow" aria-label={`Next ${label}`} onClick={onNext}>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="creator-group">
      <legend className="creator-group-title">{title}</legend>
      {children}
    </fieldset>
  );
}

const swatchRing = (on: boolean) =>
  on ? 'border-[var(--rst-brass-300)] ring-2 ring-[var(--rst-brass-300)]/40' : 'border-white/15';

/** Smaller sprite on phones so the preview can stay pinned above the controls. */
function useSpriteScale(): number {
  const query = '(min-width: 768px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide ? 4 : 2;
}

interface ProducerCreatorProps {
  moniker: string;
  onMoniker: (name: string) => void;
  look: ProducerAppearance;
  npc: ModularNpcDefinition;
  /** Applies a change (the parent plays the click sound). */
  onPatch: (patch: Partial<ProducerAppearance>) => void;
  onRandomise: () => void;
}

/** Name, live preview and an arrow row for every changeable element of the producer. */
export function ProducerCreator({ moniker, onMoniker, look, npc, onPatch, onRandomise }: ProducerCreatorProps) {
  const scale = useSpriteScale();
  const clothesIds = PRODUCER_CLOTHES_COLOURS.map((c) => c.id as string);
  const clothes = PRODUCER_CLOTHES_COLOURS.find((c) => c.id === look.clothesColour) ?? PRODUCER_CLOTHES_COLOURS[0];
  const skin = look.skinTone ?? 'tan';
  const shirt = look.shirt ?? 'band_tee';
  const pants = look.pants ?? 'denim_jeans';
  const shoes = look.shoes ?? 'vintage_sneakers';
  const build = look.build ?? 'average';

  return (
    <section className="creator-shell" aria-label="Producer customisation" data-testid="producer-creator">
      <div className="creator-stage">
        <div className="creator-preview" data-testid="producer-preview">
          <ModularSpriteRenderer npc={npc} animationState="idle" scale={scale} showBadge={false} />
        </div>
        <div className="creator-identity">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[var(--rst-brass-200)]">
            Producer name
            <input
              value={moniker}
              onChange={(e) => onMoniker(e.target.value.slice(0, 24))}
              maxLength={24}
              enterKeyHint="done"
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              className="rst-input mt-2 w-full"
              placeholder="The Architect"
            />
          </label>
          <button type="button" className="rst-btn rst-btn-ghost w-full !min-h-11 !text-xs" onClick={onRandomise} data-testid="producer-randomise">
            <Dices size={14} aria-hidden="true" />
            Surprise me
          </button>
        </div>
      </div>

      <div className="creator-controls">
        <Group title="Body">
          <ArrowRow label="Build" value={BUILD_LABELS[build]}
            onPrev={() => onPatch({ build: cycle(PRODUCER_BUILDS, build, -1) })}
            onNext={() => onPatch({ build: cycle(PRODUCER_BUILDS, build, 1) })} />
          <ArrowRow label="Skin" value={pretty(skin)} swatch={SKIN_PALETTES[skin].base}
            onPrev={() => onPatch({ skinTone: cycle(PRODUCER_SKIN_TONES, skin, -1) })}
            onNext={() => onPatch({ skinTone: cycle(PRODUCER_SKIN_TONES, skin, 1) })} />
        </Group>

        <Group title="Hair">
          <ArrowRow label="Style" value={pretty(look.hair)}
            onPrev={() => onPatch({ hair: cycle(PRODUCER_HAIR_SHAPES, look.hair, -1) })}
            onNext={() => onPatch({ hair: cycle(PRODUCER_HAIR_SHAPES, look.hair, 1) })} />
          <ArrowRow label="Hair tone" value={pretty(look.hairColour)} swatch={HAIR_HEX[look.hairColour]}
            onPrev={() => onPatch({ hairColour: cycle(PRODUCER_HAIR_COLOURS, look.hairColour, -1) })}
            onNext={() => onPatch({ hairColour: cycle(PRODUCER_HAIR_COLOURS, look.hairColour, 1) })} />
          <div className="creator-swatches" role="radiogroup" aria-label="Hair tone swatches">
            {PRODUCER_HAIR_COLOURS.map((colour) => (
              <button key={colour} type="button" role="radio" aria-checked={look.hairColour === colour} aria-label={pretty(colour)} title={pretty(colour)}
                onClick={() => onPatch({ hairColour: colour })}
                className={`creator-swatch h-8 w-8 rounded-full border-2 ${swatchRing(look.hairColour === colour)}`}
                style={{ background: HAIR_HEX[colour] }} />
            ))}
          </div>
        </Group>

        <Group title="Outfit">
          <ArrowRow label="Top" value={pretty(shirt)}
            onPrev={() => onPatch({ shirt: cycle(PRODUCER_SHIRTS, shirt, -1) })}
            onNext={() => onPatch({ shirt: cycle(PRODUCER_SHIRTS, shirt, 1) })} />
          <ArrowRow label="Trousers" value={pretty(pants)}
            onPrev={() => onPatch({ pants: cycle(PRODUCER_PANTS, pants, -1) })}
            onNext={() => onPatch({ pants: cycle(PRODUCER_PANTS, pants, 1) })} />
          <ArrowRow label="Shoes" value={pretty(shoes)}
            onPrev={() => onPatch({ shoes: cycle(PRODUCER_SHOES, shoes, -1) })}
            onNext={() => onPatch({ shoes: cycle(PRODUCER_SHOES, shoes, 1) })} />
          <ArrowRow label="Colour" value={clothes.label} swatch={CLOTHING_PALETTES[clothes.palette].primary}
            onPrev={() => onPatch({ clothesColour: cycle(clothesIds, clothes.id as string, -1) as ProducerClothesColourId })}
            onNext={() => onPatch({ clothesColour: cycle(clothesIds, clothes.id as string, 1) as ProducerClothesColourId })} />
          <div className="creator-swatches" role="radiogroup" aria-label="Clothes colour swatches">
            {PRODUCER_CLOTHES_COLOURS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={look.clothesColour === c.id} aria-label={c.label} title={c.label}
                onClick={() => onPatch({ clothesColour: c.id as ProducerClothesColourId })}
                className={`creator-swatch h-8 w-8 rounded-md border-2 ${swatchRing(look.clothesColour === c.id)}`}
                style={{ background: `linear-gradient(135deg, ${CLOTHING_PALETTES[c.palette].primary} 60%, ${CLOTHING_PALETTES[c.palette].secondary} 60%)` }} />
            ))}
          </div>
        </Group>

        <Group title="Finishing touch">
          <ArrowRow label="Accessory" value={ACCESSORY_LABELS[look.accessory as ProducerAccessory]}
            onPrev={() => onPatch({ accessory: cycle(PRODUCER_ACCESSORIES, look.accessory, -1) })}
            onNext={() => onPatch({ accessory: cycle(PRODUCER_ACCESSORIES, look.accessory, 1) })} />
        </Group>
      </div>
    </section>
  );
}
