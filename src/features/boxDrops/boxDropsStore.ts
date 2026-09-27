import { create } from 'zustand'
import { generateBoxLoot, EquipmentItem, Era } from './lootGenerator'

type BoxDropsState = {
  lastDrop: EquipmentItem[] | null
  triggerDrop: (era: Era, count?: number) => void
  clearDrop: () => void
}

export const useBoxDropsStore = create<BoxDropsState>((set) => ({
  lastDrop: null,
  triggerDrop: (era: Era, count = 1) => {
    const items = generateBoxLoot(era, count)
    set({ lastDrop: items })
  },
  clearDrop: () => set({ lastDrop: null }),
}))
