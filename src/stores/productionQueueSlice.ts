import { StateCreator } from 'zustand'
import { ProductionQueueByRoom, ProductionTask } from '../types/productionQueue'
import { useFeatureFlagStore } from './featureFlagStore'

export type ProductionQueueSlice = {
  queuesByRoom: ProductionQueueByRoom
  addToQueue: (roomId: string, task: ProductionTask) => void
  removeFromQueue: (roomId: string, taskId: string) => void
  reorderQueue: (roomId: string, newOrder: string[]) => void
  pauseTask: (roomId: string, taskId: string) => void
  resumeTask: (roomId: string, taskId: string) => void
}

export const createProductionQueueSlice: StateCreator<any, [], [], ProductionQueueSlice> = (set, get) => ({
  queuesByRoom: {},
  addToQueue: (roomId, task) => {
    if (!useFeatureFlagStore.getState().flags['advanced-production-queue']) return
    set((state: any) => ({
      queuesByRoom: {
        ...state.queuesByRoom,
        [roomId]: [...(state.queuesByRoom[roomId] || []), task],
      },
    }))
  },
  removeFromQueue: (roomId, taskId) => {
    if (!useFeatureFlagStore.getState().flags['advanced-production-queue']) return
    set((state: any) => ({
      queuesByRoom: {
        ...state.queuesByRoom,
        [roomId]: (state.queuesByRoom[roomId] || []).filter((t: ProductionTask) => t.id !== taskId),
      },
    }))
  },
  reorderQueue: (roomId, newOrder) => {
    if (!useFeatureFlagStore.getState().flags['advanced-production-queue']) return
    set((state: any) => {
      const existing = state.queuesByRoom[roomId] || []
      const map = new Map(existing.map((t: ProductionTask) => [t.id, t]))
      const reordered = newOrder.map((id) => map.get(id)).filter(Boolean)
      return { queuesByRoom: { ...state.queuesByRoom, [roomId]: reordered } }
    })
  },
  pauseTask: (roomId, taskId) => {
    if (!useFeatureFlagStore.getState().flags['advanced-production-queue']) return
    set((state: any) => ({
      queuesByRoom: {
        ...state.queuesByRoom,
        [roomId]: (state.queuesByRoom[roomId] || []).map((t: ProductionTask) =>
          t.id === taskId ? { ...t, status: 'paused' } : t
        ),
      },
    }))
  },
  resumeTask: (roomId, taskId) => {
    if (!useFeatureFlagStore.getState().flags['advanced-production-queue']) return
    set((state: any) => ({
      queuesByRoom: {
        ...state.queuesByRoom,
        [roomId]: (state.queuesByRoom[roomId] || []).map((t: ProductionTask) =>
          t.id === taskId ? { ...t, status: 'queued' } : t
        ),
      },
    }))
  },
})
