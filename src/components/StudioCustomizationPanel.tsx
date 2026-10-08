import React, { useState } from 'react';
import { Armchair, Check, ChevronRight, Disc3, Footprints, Gem, LockKeyhole, Paintbrush, Shirt, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GameState } from '@/types/game';
import { ProducerSprite } from '@/components/ProducerSprite';
import {
  STUDIO_FURNISHINGS, PRODUCER_COSMETICS, getAnchorsForTier, getCustomization, isItemUnlocked, listLockedItems, getProvenance,
  equipFurnishing, unequipAnchor, equipProducerCosmetic, unequipProducerSlot, applyProducerCosmetics,
  type StudioCustomizationState, type ProducerCosmeticSlot,
} from '@/rpg/studioCustomization';

interface StudioCustomizationPanelProps {
  customization?: StudioCustomizationState;
  premisesTier?: number;
  producerCustomization?: GameState['producerCustomization'];
  selectedEra?: GameState['selectedEra'];
  onChange: (next: StudioCustomizationState) => void;
}

const SLOTS: ProducerCosmeticSlot[] = ['accessory', 'shirt', 'pants', 'shoes'];

/** A small, tactile dressing room and keepsake cabinet — not a form with nine selects. */
export function StudioCustomizationPanel({
  customization, premisesTier, producerCustomization, selectedEra, onChange,
}: StudioCustomizationPanelProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'room' | 'producer'>('room');
  const [roomAnchor, setRoomAnchor] = useState<string>('wall-art');
  const [producerSlot, setProducerSlot] = useState<ProducerCosmeticSlot>('accessory');
  const c = getCustomization({ studioCustomization: customization });
  const anchors = getAnchorsForTier(premisesTier);
  const activeAnchor = anchors.some(a => a === roomAnchor) ? roomAnchor : anchors[0];
  const availableRoom = STUDIO_FURNISHINGS.filter(f =>
    (f.compatibleAnchors as readonly string[]).includes(activeAnchor) && isItemUnlocked(c, f.id));
  const availableProducer = PRODUCER_COSMETICS.filter(p => p.slot === producerSlot && isItemUnlocked(c, p.id));
  const options = mode === 'room' ? availableRoom : availableProducer;
  const activeId = mode === 'room' ? c.equippedByAnchor[activeAnchor] : c.equippedProducer[producerSlot];
  const current = options.find(o => o.id === activeId);
  const locked = listLockedItems(c);
  const earnedCount = STUDIO_FURNISHINGS.filter(f => isItemUnlocked(c, f.id)).length
    + PRODUCER_COSMETICS.filter(p => isItemUnlocked(c, p.id)).length;
  const goals = [...new Set(locked.map(l => l.hint).filter(Boolean))];
  const previewProducer = producerCustomization?.appearance
    ? { ...producerCustomization, appearance: applyProducerCosmetics(producerCustomization.appearance, c) }
    : producerCustomization;

  const equip = (id: string) => {
    if (mode === 'room') onChange(id ? equipFurnishing(c, anchors, activeAnchor, id) : unequipAnchor(c, activeAnchor));
    else onChange(id ? equipProducerCosmetic(c, id) : unequipProducerSlot(c, producerSlot));
  };

  return (
    <section className="rst-surface m-1 mt-3 overflow-hidden text-xs" aria-label={t('customise_title')} data-testid="customisation-panel">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rst-line)] p-3">
        <div className="min-w-0">
          <p className="rst-kicker">YOUR STUDIO • YOUR STORY</p>
          <h3 className="mt-1 text-sm font-bold text-stone-100">{t('customise_title')}</h3>
        </div>
        <span className="rst-chip rst-chip-brass shrink-0"><Sparkles size={13} aria-hidden="true" /> {earnedCount} owned</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2" aria-label="Customise">
        <button type="button" aria-pressed={mode === 'room'} onClick={() => setMode('room')}
          className={`rst-btn !min-h-11 justify-center gap-2 !px-2 ${mode === 'room' ? 'rst-btn-primary' : ''}`}>
          <Armchair size={17} aria-hidden="true" /> {t('customise_room')}
        </button>
        <button type="button" aria-pressed={mode === 'producer'} onClick={() => setMode('producer')}
          className={`rst-btn !min-h-11 justify-center gap-2 !px-2 ${mode === 'producer' ? 'rst-btn-primary' : ''}`}>
          <UserRound size={17} aria-hidden="true" /> {t('customise_producer')}
        </button>
      </div>

      <div className="mx-2 mb-2 flex min-h-[92px] items-center gap-3 overflow-hidden rounded-lg border border-[var(--rst-brass-line)] bg-[radial-gradient(ellipse_at_top,rgba(230,184,102,0.12),rgba(14,12,11,0.75))] px-3 py-2">
        {mode === 'producer' && previewProducer && selectedEra != null ? (
          <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden" aria-label="Your producer preview">
            <ProducerSprite producerCustomization={previewProducer} selectedEra={selectedEra} animationState="idle" scale={1.3} />
          </div>
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-[var(--rst-brass-line)] bg-black/25 text-[var(--rst-brass-300)]">
            {mode === 'room' ? <Disc3 size={29} aria-hidden="true" /> : <UserRound size={29} aria-hidden="true" />}
          </div>
        )}
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="rst-kicker">{mode === 'room' ? t(`customise_anchor_${activeAnchor}`) : t(`customise_slot_${producerSlot}`)}</p>
          <p className="mt-1 text-sm font-bold text-stone-100">{current?.name ?? t('customise_empty')}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-stone-400">
            {activeId ? getProvenance(c, activeId) ?? 'Ready to display' : 'Pick an earned piece from your collection'}
          </p>
        </div>
      </div>

      <p className="rst-kicker px-3 pb-2">SELECT A {mode === 'room' ? 'ROOM SPOT' : 'LOOK SLOT'}</p>
      <div className="grid grid-cols-2 gap-1.5 px-2 pb-3 sm:grid-cols-3" data-testid="customise-slot-tray">
        {mode === 'room' ? anchors.map(anchor => {
          const id = c.equippedByAnchor[anchor];
          const item = STUDIO_FURNISHINGS.find(f => f.id === id);
          const isSelected = activeAnchor === anchor;
          return (
            <button key={anchor} type="button" data-testid="customise-anchor" aria-pressed={isSelected}
              onClick={() => setRoomAnchor(anchor)}
              className={`flex min-h-12 items-center gap-2 rounded-md border px-2 py-2 text-left motion-safe:transition-[background,transform,border-color] motion-safe:duration-150 active:scale-[0.98] ${isSelected ? 'border-[var(--rst-brass-300)] bg-amber-400/[0.13]' : 'border-stone-700/80 bg-black/20 hover:border-stone-500'}`}>
              <Paintbrush size={16} className="shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-stone-100">{t(`customise_anchor_${anchor}`)}</span>
                <span className="block truncate text-[10px] text-stone-400">{item?.name ?? t('customise_empty')}</span>
              </span>
            </button>
          );
        }) : SLOTS.map(slot => {
          const id = c.equippedProducer[slot];
          const item = PRODUCER_COSMETICS.find(p => p.id === id);
          const isSelected = producerSlot === slot;
          const Icon = slot === 'shirt' ? Shirt : slot === 'shoes' ? Footprints : slot === 'accessory' ? Gem : UserRound;
          return (
            <button key={slot} type="button" data-testid="customise-slot" aria-pressed={isSelected}
              onClick={() => setProducerSlot(slot)}
              className={`flex min-h-12 items-center gap-2 rounded-md border px-2 py-2 text-left motion-safe:transition-[background,transform,border-color] motion-safe:duration-150 active:scale-[0.98] ${isSelected ? 'border-[var(--rst-brass-300)] bg-amber-400/[0.13]' : 'border-stone-700/80 bg-black/20 hover:border-stone-500'}`}>
              <Icon size={16} className="shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-stone-100">{t(`customise_slot_${slot}`)}</span>
                <span className="block truncate text-[10px] text-stone-400">{item?.name ?? t('customise_empty')}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--rst-line)] bg-black/20 px-2 pb-3 pt-2">
        <p className="rst-kicker mb-2 px-1">EQUIP FROM YOUR COLLECTION</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" data-testid="customise-equipment-tray">
          <button type="button" aria-pressed={!activeId} onClick={() => equip('')}
            className={`flex min-h-14 items-center justify-between rounded-md border px-2.5 py-2 text-left motion-safe:transition-colors ${!activeId ? 'border-[var(--rst-brass-300)] bg-amber-400/[0.12]' : 'border-stone-700 bg-stone-900/50'}`}>
            <span className="text-stone-200">{t('customise_empty')}</span>
            {!activeId && <Check size={15} className="text-[var(--rst-brass-300)]" aria-hidden="true" />}
          </button>
          {options.map(item => (
            <button type="button" key={item.id} aria-pressed={activeId === item.id} onClick={() => equip(item.id)}
              className={`group flex min-h-14 items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left motion-safe:transition-[background,transform,border-color] motion-safe:duration-150 active:scale-[0.98] ${activeId === item.id ? 'border-[var(--rst-brass-300)] bg-amber-400/[0.12]' : 'border-stone-700 bg-stone-900/50 hover:border-stone-500'}`}>
              <span className="min-w-0 font-semibold text-stone-200">{item.name}</span>
              {activeId === item.id ? <Check size={15} className="shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" /> : <ChevronRight size={15} className="shrink-0 text-stone-600 group-hover:text-stone-200" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      {locked.length > 0 && (
        <details className="group border-t border-[var(--rst-line)] px-3 py-2 text-stone-300">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
            <LockKeyhole size={15} className="text-[var(--rst-brass-300)]" aria-hidden="true" />
            <span className="flex-1">{t('customise_locked')} · {locked.length}</span>
            <span className="text-[11px] text-stone-500">Discover how to earn more</span>
            <ChevronRight size={15} className="motion-safe:transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="flex flex-wrap gap-1.5 pb-2 pt-1" data-testid="customise-locked-goals">
            {goals.map(goal => (
              <span key={goal} className="rounded border border-stone-700 bg-stone-950 px-2 py-1.5 text-[11px] text-stone-400">
                {goal}
              </span>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export default StudioCustomizationPanel;
