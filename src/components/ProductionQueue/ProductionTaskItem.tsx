import React from 'react'
import { ProductionTask } from '../../types/productionQueue'

export const ProductionTaskItem: React.FC<{ task: ProductionTask; onPause: () => void; onRemove: () => void }> = ({ task, onPause, onRemove }) => {
  return (
    <div className="p-2 border rounded flex justify-between items-center" role="listitem">
      <div>
        <div className="font-semibold">{task.name || task.type}</div>
        <div className="text-sm text-stone-600">{task.progress}% • {task.estimatedDuration}s</div>
      </div>
      <div className="flex gap-2">
        <button onClick={onPause} className="px-2 py-1 bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 text-amber-100 rounded">{task.status === 'paused' ? 'Resume' : 'Pause'}</button>
        <button onClick={onRemove} className="px-2 py-1 bg-red-400/[0.14] ring-1 ring-inset ring-red-400/45 text-red-100 rounded">Remove</button>
      </div>
    </div>
  )
}

export default ProductionTaskItem
