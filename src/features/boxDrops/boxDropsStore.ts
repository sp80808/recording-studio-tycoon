import { create } from 'zustand'
import { generateBoxLoot, EquipmentItem, Era } from './lootGenerator'

export type BoxDropClaim = (item: EquipmentItem, action: 'equip' | 'stash' | 'sell') => void

type BoxDropsState = {
  lastDrop: EquipmentItem[] | null
  /** Optional settlement handler for pre-rolled drops (flight case depot). */
  onClaim: BoxDropClaim | null
  triggerDrop: (era: Era, count?: number) => void
  /** Show an already-settled roll (e.g. from openFlightCase) and route claims to the caller. */
  showItems: (items: EquipmentItem[], onClaim?: BoxDropClaim) => void
  clearDrop: () => void
}

export const useBoxDropsStore = create<BoxDropsState>((set) => ({
  lastDrop: null,
  onClaim: null,
  triggerDrop: (era: Era, count = 1) => {
    const items = generateBoxLoot(era, count)
    set({ lastDrop: items, onClaim: null })
  },
  showItems: (items, onClaim) => set({ lastDrop: items, onClaim: onClaim ?? null }),
  clearDrop: () => set({ lastDrop: null, onClaim: null }),
}))
