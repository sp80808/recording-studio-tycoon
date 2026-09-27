import React from 'react'
import BoxDropModal from './BoxDropModal'
import { useBoxDropsStore } from './boxDropsStore'

export const BoxDropController: React.FC = () => {
  const lastDrop = useBoxDropsStore((s: any) => s.lastDrop)
  const clear = useBoxDropsStore((s: any) => s.clearDrop)
  if (!lastDrop) return null
  return <BoxDropModal items={lastDrop} onClose={clear} />
}

export default BoxDropController
