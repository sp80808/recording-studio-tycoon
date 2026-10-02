import { useFeatureFlag } from '../stores/featureFlagStore'
import { useProductionQueueStore } from '../stores/rootStore'

const EMPTY_TASKS: any[] = []

export const useProductionQueue = (roomId: string) => {
  const enabled = useFeatureFlag('advanced-production-queue')
  // Hooks must run unconditionally; the flag only decides what we expose.
  const queued = useProductionQueueStore((s: any) => s.queuesByRoom[roomId]) as any[] | undefined
  if (!enabled) return { enabled: false, tasks: EMPTY_TASKS }
  return { enabled: true, tasks: queued ?? EMPTY_TASKS }
}
