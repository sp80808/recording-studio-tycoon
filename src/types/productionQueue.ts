export type ProductionTaskType = 'recording' | 'mixing' | 'mastering'

export interface ProductionTask {
  id: string
  type: ProductionTaskType
  estimatedDuration: number // seconds
  requiredStaff: string[]
  requiredEquipment: string[]
  status: 'queued' | 'active' | 'paused' | 'completed'
  progress: number // 0-100
  cost: number
  name?: string
}

export interface ProductionQueueByRoom {
  [roomId: string]: ProductionTask[]
}
