import create from 'zustand'
import { devtools } from 'zustand/middleware'
import { createProductionQueueSlice, ProductionQueueSlice } from './productionQueueSlice'
import { createQuickAssignSlice, QuickAssignSlice } from './quickAssignSlice'

type RootState = ProductionQueueSlice & QuickAssignSlice & {}

export const useRootStore = create<RootState>()(
  devtools((...a: any[]) => ({ ...createProductionQueueSlice(...a), ...createQuickAssignSlice(...a) }))
)

export const useProductionQueueStore = (selector: any) => useRootStore(selector)
export const useQuickAssignStore = (selector: any) => useRootStore(selector)
