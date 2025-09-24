import React from 'react'
import { useBoxDropsStore } from '../features/boxDrops/boxDropsStore'

export const DevMenu: React.FC = () => {
  const trigger = useBoxDropsStore((s: any) => s.triggerDrop)
  return (
    <div className="fixed bottom-4 right-4 p-2 bg-white border rounded shadow">
      <button
        onClick={() => trigger('1970s', 2)}
        className="px-3 py-2 bg-sky-600 text-white rounded"
      >
        DEV: Spawn Box Drop
      </button>
    </div>
  )
}

export default DevMenu
