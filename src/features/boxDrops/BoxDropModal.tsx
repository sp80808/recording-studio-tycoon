import React from 'react'
import { EquipmentItem } from './lootGenerator'

type Props = {
  items: EquipmentItem[]
  onClose: () => void
}

export const BoxDropModal: React.FC<Props> = ({ items, onClose }) => {
  if (!items || items.length === 0) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">You found some gear!</h3>
        <ul className="space-y-2 mb-4">
          {items.map((it) => (
            <li key={it.id} className="border p-2 rounded">
              <div className="font-semibold">{it.name} <span className="text-sm text-gray-500">({it.rarity})</span></div>
              <div className="text-sm text-gray-600">Era: {it.era} • Condition: {it.condition}%</div>
              <div className="text-sm text-gray-700">Value: ${it.baseValue}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-sky-600 text-white rounded">Close</button>
        </div>
      </div>
    </div>
  )
}

export default BoxDropModal
