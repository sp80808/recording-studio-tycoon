import React from 'react'
import CrateUnboxingModal from './CrateUnboxingModal'
import { useBoxDropsStore } from './boxDropsStore'

export const BoxDropController: React.FC = () => {
  const lastDrop = useBoxDropsStore((s: any) => s.lastDrop)
  const clear = useBoxDropsStore((s: any) => s.clearDrop)
  if (!lastDrop) return null
  return <CrateUnboxingModal items={lastDrop} onClose={clear} />
}

export default BoxDropController
