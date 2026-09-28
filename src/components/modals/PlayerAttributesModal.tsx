import React from 'react';
import { AttributesModal } from './AttributesModal';
import { PlayerData, PlayerAttributes } from '@/types/game';

interface PlayerAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerData;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

/**
 * Re-export AttributesModal for backward compatibility.
 * Consolidates duplicate modals into a single canonical producer talents modal.
 */
export const PlayerAttributesModal: React.FC<PlayerAttributesModalProps> = (props) => {
  return <AttributesModal {...props} />;
};
