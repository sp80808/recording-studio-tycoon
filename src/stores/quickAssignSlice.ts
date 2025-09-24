import { StateCreator } from 'zustand'

export type QuickAssignPreset = {
  id: string
  name: string
  staffIds: string[]
  equipmentIds: string[]
  roomId?: string
}

export type QuickAssignSlice = {
  presets: QuickAssignPreset[]
  savePreset: (p: QuickAssignPreset) => void
  deletePreset: (id: string) => void
  applyPreset: (id: string) => void
}

export const createQuickAssignSlice: StateCreator<any, [], [], QuickAssignSlice> = (set, get) => ({
  presets: [],
  savePreset: (p) => set((s: any) => ({ presets: [...s.presets.filter((x: any) => x.id !== p.id), p] })),
  deletePreset: (id) => set((s: any) => ({ presets: s.presets.filter((x: any) => x.id !== id) })),
  applyPreset: (id) => {
    // Integrations with Staff/Room stores should be done by consumer using this slice's data
    const preset = get().presets.find((p: QuickAssignPreset) => p.id === id)
    if (!preset) return
    // Side-effects (assigning staff) are intentionally left to the integration layer
    console.log('applyPreset', preset)
  },
})
