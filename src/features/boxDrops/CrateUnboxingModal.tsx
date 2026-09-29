import React, { useState, useCallback } from 'react';
import { EquipmentItem, Rarity } from './lootGenerator';
import { toast } from '@/hooks/use-toast';
import {
  FlightCaseReveal,
  type PremiumDisplayItem,
  type PremiumCaseReward,
  type CaseSource,
  RARITY_CONFIG,
} from './FlightCaseReveal';

export type { PremiumDisplayItem, PremiumCaseReward, CaseSource };
export { RARITY_CONFIG };

export interface CrateUnboxingModalProps {
  items: EquipmentItem[];
  onClose: () => void;
  onClaim?: (item: EquipmentItem, action: 'equip' | 'stash' | 'sell') => void;
  /** Premium mode: disclosed cosmetics from a verified purchase. */
  premium?: PremiumCaseReward;
  source?: CaseSource;
  /** Stencil/title override for the flight-case shell (e.g. product title). */
  titleOverride?: string;
}

/**
 * CrateUnboxingModal
 * Game-facing unboxing modal for RST.
 * Delegates the tactile unboxing choreography and reveal sequence to `FlightCaseReveal`.
 * Rewards are authoritatively settled before this modal mounts.
 */
export const CrateUnboxingModal: React.FC<CrateUnboxingModalProps> = ({
  items,
  onClose,
  onClaim,
  premium,
  source = 'earned',
  titleOverride,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isPremium = !!premium;
  const currentItem = isPremium ? undefined : items[currentIndex];

  const handleAction = useCallback(
    (action: 'equip' | 'stash' | 'sell' | 'claim', outcome: EquipmentItem | PremiumCaseReward) => {
      if (!isPremium && currentItem) {
        if (onClaim) {
          onClaim(currentItem, action as 'equip' | 'stash' | 'sell');
        } else {
          const messages = {
            equip: `🎛️ Equipped ${currentItem.name} directly to studio rack!`,
            stash: `📦 Stashed ${currentItem.name} in studio inventory.`,
            sell: `💰 Sold ${currentItem.name} for $${currentItem.baseValue}!`,
            claim: `📦 Claimed ${currentItem.name}.`,
          };
          toast({
            title: 'Hardware Secured',
            description: messages[action] || messages.claim,
            className: 'bg-slate-900 border-slate-700 text-white',
          });
        }

        // If multi-item drop, advance to the next item
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          return;
        }
      }

      onClose();
    },
    [isPremium, currentItem, onClaim, currentIndex, items.length, onClose]
  );

  if (!currentItem && !isPremium) return null;
  if (isPremium && (!premium || premium.items.length === 0)) return null;

  const activeOutcome = isPremium ? premium! : currentItem!;

  return (
    <FlightCaseReveal
      key={isPremium ? 'premium-case' : `item-${currentIndex}-${currentItem?.id}`}
      outcome={activeOutcome}
      source={source}
      titleOverride={titleOverride}
      itemIndex={currentIndex}
      totalItems={items.length}
      onAction={handleAction}
      onClose={onClose}
    />
  );
};

export default CrateUnboxingModal;
