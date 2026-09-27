import React from 'react'
import { ProductionTask } from '../../types/productionQueue'

export const ProductionTaskItem: React.FC<{ task: ProductionTask; onPause: () => void; onRemove: () => void }> = ({ task, onPause, onRemove }) => {
  return (
    <div className="p-2 border rounded flex justify-between items-center" role="listitem">
      <div>
        <div className="font-semibold">{task.name || task.type}</div>
        <div className="text-sm text-gray-600">{task.progress}% • {task.estimatedDuration}s</div>
      </div>
      <div className="flex gap-2">
        <button onClick={onPause} className="px-2 py-1 bg-yellow-500 text-white rounded">{task.status === 'paused' ? 'Resume' : 'Pause'}</button>
        <button onClick={onRemove} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
      </div>
    </div>
  )
}

export default ProductionTaskItem
