import React from 'react';
import { Armchair } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  STUDIO_FURNISHINGS, PRODUCER_COSMETICS, getAnchorsForTier, getCustomization, isItemUnlocked, listLockedItems, getProvenance,
  equipFurnishing, unequipAnchor, equipProducerCosmetic, unequipProducerSlot,
  type StudioCustomizationState, type ProducerCosmeticSlot,
} from '@/rpg/studioCustomization';

interface StudioCustomizationPanelProps {
  customization?: StudioCustomizationState;
  premisesTier?: number;
  onChange: (next: StudioCustomizationState) => void;
}

const SLOTS: ProducerCosmeticSlot[] = ['accessory', 'shirt', 'pants', 'shoes'];

/** Compact Career panel (#258): equip owned furnishings and producer cosmetics; locked items show a spoiler-free hint. */
export function StudioCustomizationPanel({ customization, premisesTier, onChange }: StudioCustomizationPanelProps) {
  const { t } = useTranslation();
  const c = getCustomization({ studioCustomization: customization });
  const anchors = getAnchorsForTier(premisesTier);
  const locked = listLockedItems(c);
  const none = t('customise_empty');
  const selectClass = 'min-w-0 max-w-[60%] rounded border border-stone-700 bg-stone-950 px-1.5 py-1 text-stone-100';
  return (
    <section className="rst-surface m-1 mt-3 p-3 text-xs" aria-label={t('customise_title')} data-testid="customisation-panel">
      <header className="flex items-center gap-1.5">
        <Armchair size={15} aria-hidden="true" />
        <h3 className="text-sm font-semibold text-stone-100">{t('customise_title')}</h3>
      </header>
      <p className="mt-1 text-stone-400">{t('customise_intro')}</p>

      <h4 className="mt-3 font-semibold text-stone-200">{t('customise_room')}</h4>
      <ul className="mt-1 space-y-1.5">
        {anchors.map(anchor => {
          const options = STUDIO_FURNISHINGS.filter(f => (f.compatibleAnchors as readonly string[]).includes(anchor) && isItemUnlocked(c, f.id));
          if (options.length === 0) return null;
          const current = c.equippedByAnchor[anchor] ?? '';
          const why = current ? getProvenance(c, current) : null;
          return (
            <li key={anchor} data-testid="customise-anchor">
              <label className="flex items-center justify-between gap-2">
                <span className="text-stone-300">{t(`customise_anchor_${anchor}`)}</span>
                <select
                  className={selectClass}
                  value={current}
                  onChange={e => onChange(e.target.value ? equipFurnishing(c, anchors, anchor, e.target.value) : unequipAnchor(c, anchor))}
                >
                  <option value="">{none}</option>
                  {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              {why && <p className="text-stone-500">{why}</p>}
            </li>
          );
        })}
      </ul>

      <h4 className="mt-3 font-semibold text-stone-200">{t('customise_producer')}</h4>
      <ul className="mt-1 space-y-1.5">
        {SLOTS.map(slot => {
          const options = PRODUCER_COSMETICS.filter(p => p.slot === slot && isItemUnlocked(c, p.id));
          if (options.length === 0) return null;
          const current = c.equippedProducer[slot] ?? '';
          const why = current ? getProvenance(c, current) : null;
          return (
            <li key={slot} data-testid="customise-slot">
              <label className="flex items-center justify-between gap-2">
                <span className="text-stone-300">{t(`customise_slot_${slot}`)}</span>
                <select
                  className={selectClass}
                  value={current}
                  onChange={e => onChange(e.target.value ? equipProducerCosmetic(c, e.target.value) : unequipProducerSlot(c, slot))}
                >
                  <option value="">{none}</option>
                  {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              {why && <p className="text-stone-500">{why}</p>}
            </li>
          );
        })}
      </ul>

      {locked.length > 0 && (
        <>
          <h4 className="mt-3 font-semibold text-stone-200">{t('customise_locked')}</h4>
          <ul className="mt-1 space-y-1">
            {locked.map(item => (
              <li key={item.id} className="flex justify-between gap-2 text-stone-500" data-testid="customise-locked">
                <span>{t('customise_locked_item')}</span>
                <span>{item.hint}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default StudioCustomizationPanel;
