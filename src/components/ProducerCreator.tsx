import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, Undo2, UserRound } from 'lucide-react';
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

import './producer-creator.css';

const cycle = <T extends string>(list: readonly T[], current: T, delta: number): T =>
  list[(list.indexOf(current) + delta + list.length) % list.length];
const pretty = (v: string) => APPEARANCE_LABELS[v] ?? v.replace(/_/g, ' ');
type Part = 'hair' | 'accessory' | 'shirt' | 'pants' | 'shoes' | 'body';

interface ProducerCreatorProps {
  moniker: string;
  onMoniker: (name: string) => void;
  look: ProducerAppearance;
  npc: ModularNpcDefinition;
  onPatch: (patch: Partial<ProducerAppearance>) => void;
  onRandomise: () => void;
}

/** Part-aligned controls keep the producer at the centre of every edit. */
export function ProducerCreator({ moniker, onMoniker, look, npc, onPatch, onRandomise }: ProducerCreatorProps) {
  const [active, setActive] = useState<Part>('hair');
  const [previous, setPrevious] = useState<{ look: ProducerAppearance; name?: string } | null>(null);
  const skin = look.skinTone ?? 'tan';
  const build = look.build ?? 'average';
  const clothes = PRODUCER_CLOTHES_COLOURS.find((c) => c.id === look.clothesColour) ?? PRODUCER_CLOTHES_COLOURS[0];
  const parts = [
    { id: 'hair' as const, label: 'Hair', value: look.hair, options: PRODUCER_HAIR_SHAPES },
    { id: 'accessory' as const, label: 'Extras', value: look.accessory, options: PRODUCER_ACCESSORIES },
    { id: 'shirt' as const, label: 'Top', value: look.shirt ?? 'band_tee', options: PRODUCER_SHIRTS },
    { id: 'pants' as const, label: 'Trousers', value: look.pants ?? 'denim_jeans', options: PRODUCER_PANTS },
    { id: 'shoes' as const, label: 'Shoes', value: look.shoes ?? 'vintage_sneakers', options: PRODUCER_SHOES },
  ];
  const selected = parts.find((part) => part.id === active);
  const labelFor = (id: Part, value: string) => id === 'accessory' ? ACCESSORY_LABELS[value as ProducerAccessory] : pretty(value);
  const patch = (change: Partial<ProducerAppearance>) => {
    setPrevious({ look: { ...look } });
    onPatch(change);
  };
  const changePart = (part: typeof parts[number], direction: number) => {
    setActive(part.id);
    patch({ [part.id]: cycle<string>(part.options, part.value, direction) });
  };
  const outfit = active === 'shirt';

  return (
    <section className="producer-dressing" aria-label="Producer customisation" data-testid="producer-creator">
      <label className="dressing-name">
        Producer name
        <input value={moniker} onChange={(e) => onMoniker(e.target.value.slice(0, 24))}
          maxLength={24} enterKeyHint="done" autoComplete="off" autoCapitalize="words" spellCheck={false}
          className="rst-input" placeholder="The Architect" />
      </label>
      <div className="dressing-tools">
        <button type="button" aria-pressed={active === 'body'} onClick={() => setActive('body')}><UserRound size={16} aria-hidden="true" /> Body & skin</button>
        <button type="button" disabled={!previous} aria-label="Undo last appearance change" onClick={() => {
          if (!previous) return;
          onPatch(previous.look);
          if (previous.name !== undefined) onMoniker(previous.name);
          setPrevious(null);
        }}><Undo2 size={16} aria-hidden="true" /><span>Undo</span></button>
        <button type="button" data-testid="producer-randomise" onClick={() => {
          setPrevious({ look: { ...look }, name: moniker }); onRandomise();
        }}><Dices size={16} aria-hidden="true" /> Surprise me</button>
      </div>
      <div className="dressing-stage" data-active-part={active}>
        <div className="dressing-preview" data-testid="producer-preview" role="img" aria-label={`Preview of ${moniker || 'your producer'}`}>
          <ModularSpriteRenderer npc={npc} animationState="idle" scale={7} showBadge={false} />
        </div>
        {parts.map((part) => (
          <div key={part.id} className={`dressing-part dressing-part--${part.id}`} data-active={active === part.id}
            role="group" aria-label={`${part.label}: ${labelFor(part.id, part.value)}`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault(); e.stopPropagation(); changePart(part, e.key === 'ArrowRight' ? 1 : -1);
              }
            }}>
            <button type="button" className="dressing-arrow" aria-label={`Previous ${part.label}`} onClick={() => changePart(part, -1)}><ChevronLeft size={22} aria-hidden="true" /></button>
            <button type="button" className="dressing-part-label" aria-pressed={active === part.id} onClick={() => setActive(part.id)}>{part.label}</button>
            <span className="dressing-guide" aria-hidden="true" />
            <button type="button" className="dressing-arrow" aria-label={`Next ${part.label}`} onClick={() => changePart(part, 1)}><ChevronRight size={22} aria-hidden="true" /></button>
          </div>
        ))}
      </div>
      <div className="dressing-detail" aria-label="Selected part details">
        <div className="dressing-detail-heading" aria-live="polite" aria-atomic="true">
          <span>{selected?.label ?? 'Body & skin'}</span>
          <strong>{selected ? labelFor(selected.id, selected.value) : BUILD_LABELS[build]}</strong>
          {selected && <small>{selected.options.findIndex((value) => value === selected.value) + 1} / {selected.options.length}</small>}
        </div>
        {active === 'body' && <div className="dressing-builds" role="group" aria-label="Build">
          {PRODUCER_BUILDS.map((value) => <button key={value} type="button" aria-pressed={build === value} onClick={() => patch({ build: value })}>{BUILD_LABELS[value]}</button>)}
        </div>}
        {(active === 'hair' || active === 'body' || outfit) && <>
          <p className="dressing-colour-label">{active === 'hair' ? `Hair colour · ${pretty(look.hairColour)}` : active === 'body' ? `Skin tone · ${pretty(skin)}` : `Top colour · ${clothes.label}`}</p>
          <div className="dressing-swatches" role="group" aria-label={active === 'hair' ? 'Hair colour' : active === 'body' ? 'Skin tone' : 'Top colour'}>
            {active === 'hair' ? PRODUCER_HAIR_COLOURS.map((value) => (
              <button key={value} type="button" aria-pressed={look.hairColour === value} aria-label={pretty(value)} title={pretty(value)}
                onClick={() => patch({ hairColour: value })} style={{ '--swatch': HAIR_HEX[value] } as React.CSSProperties} />
            )) : active === 'body' ? PRODUCER_SKIN_TONES.map((value) => (
              <button key={value} type="button" aria-pressed={skin === value} aria-label={pretty(value)} title={pretty(value)}
                onClick={() => patch({ skinTone: value })} style={{ '--swatch': SKIN_PALETTES[value].base } as React.CSSProperties} />
            )) : PRODUCER_CLOTHES_COLOURS.map((value) => (
              <button key={value.id} type="button" aria-pressed={look.clothesColour === value.id} aria-label={value.label} title={value.label}
                onClick={() => patch({ clothesColour: value.id as ProducerClothesColourId })}
                style={{ '--swatch': `linear-gradient(135deg, ${CLOTHING_PALETTES[value.palette].primary} 60%, ${CLOTHING_PALETTES[value.palette].secondary} 60%)` } as React.CSSProperties} />
            ))}
          </div>
        </>}
        {(active === 'pants' || active === 'shoes') && <p className="dressing-hint">Use the arrows to find your fit. Each style has its own finish.</p>}
        {active === 'accessory' && <p className="dressing-hint">A little signature. Use the arrows to try on hats, headphones and jewellery.</p>}
      </div>
      <p className="dressing-help">Tap a part name to fine-tune. Use its arrows to try something new.</p>
    </section>
  );
}
