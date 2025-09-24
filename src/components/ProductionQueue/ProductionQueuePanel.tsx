import React from 'react'
import { useProductionQueue } from '../../hooks/useProductionQueue'
import ProductionTaskItem from './ProductionTaskItem'
import { useProductionQueueStore } from '../../stores/rootStore'

export const ProductionQueuePanel: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { enabled, tasks } = useProductionQueue(roomId)
  if (!enabled) return null
  const remove = useProductionQueueStore((s: any) => s.removeFromQueue)
  const pause = useProductionQueueStore((s: any) => s.pauseTask)
  return (
    <div className="p-3" role="region" aria-label="Production Queue">
      <h4 className="font-bold mb-2">Production Queue</h4>
      <div role="list" className="space-y-2">
        {tasks.map((t: any) => (
          <ProductionTaskItem key={t.id} task={t} onPause={() => pause(roomId, t.id)} onRemove={() => remove(roomId, t.id)} />
        ))}
        {tasks.length === 0 && <div className="text-sm text-gray-500">No queued tasks</div>}
      </div>
    </div>
  )
}

export default ProductionQueuePanel
