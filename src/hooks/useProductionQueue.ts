import { useFeatureFlag } from '../stores/featureFlagStore'
import { useProductionQueueStore } from '../stores/rootStore'

export const useProductionQueue = (roomId: string) => {
  const enabled = useFeatureFlag('advanced-production-queue')
  if (!enabled) return { enabled: false, tasks: [] }
  const tasks = useProductionQueueStore((s: any) => s.queuesByRoom[roomId] || [])
  return { enabled: true, tasks }
}
