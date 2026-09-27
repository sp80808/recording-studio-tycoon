import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createProductionQueueSlice, ProductionQueueSlice } from './productionQueueSlice'
import { createQuickAssignSlice, QuickAssignSlice } from './quickAssignSlice'

type RootState = ProductionQueueSlice & QuickAssignSlice & {}

// Compose slices by calling each slice factory with the (set, get, api) arguments
export const useRootStore = create<RootState>()(
  devtools((set, get, api) => ({ ...createProductionQueueSlice(set, get, api), ...createQuickAssignSlice(set, get, api) }))
)

export const useProductionQueueStore = (selector: any) => useRootStore(selector)
export const useQuickAssignStore = (selector: any) => useRootStore(selector)
