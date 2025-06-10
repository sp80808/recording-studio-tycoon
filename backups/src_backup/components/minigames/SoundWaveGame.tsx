import { useState, useEffect, useRef } from 'react'
import { MiniGameProps } from '../../types/miniGame'

// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const SoundWaveGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  const [targetWave, setTargetWave] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { playSound } = useSound?.() || { playSound: () => {} }

  useEffect(() => {
    // Generate random target wave based on difficulty
    const wavePoints = 20 + difficulty * 5
    const newTarget = Array(wavePoints)
      .fill(0)
      .map((_, i) => Math.sin(i / 3) * 50 + 50 + (Math.random() * 20 - 10))
    setTargetWave(newTarget)
    setWaveform(Array(wavePoints).fill(50))
  }, [difficulty])

  useEffect(() => {
    if (progress >= 100) {
      playSound('wave-complete')
      onComplete(progress)
    }
  }, [progress, onComplete])

  useEffect(() => {
    // Draw waveform
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw target wave (light gray)
    ctx.beginPath()
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 2
    targetWave.forEach((y, x) => {
      const px = (x / targetWave.length) * canvas.width
      if (x === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    })
    ctx.stroke()

    // Draw current wave (blue)
    ctx.beginPath()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    waveform.forEach((y, x) => {
      const px = (x / waveform.length) * canvas.width
      if (x === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    })
    ctx.stroke()

    // Calculate accuracy
    const accuracy = waveform.reduce((acc, val, i) => {
      return acc + (100 - Math.abs(val - targetWave[i]))
    }, 0) / waveform.length
    
    setProgress(accuracy)
  }, [waveform, targetWave])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pointIndex = Math.floor((x / canvas.width) * waveform.length)
    
    if (pointIndex >= 0 && pointIndex < waveform.length) {
      playSound('wave-adjust')
      const newWaveform = [...waveform]
      newWaveform[pointIndex] = y
      setWaveform(newWaveform)
    }
  }

  return (
    <div className="soundwave-game">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        onClick={handleCanvasClick}
        className="wave-canvas"
      />

      <div className="instructions">
        Click on the wave to shape it to match the target (gray line)
      </div>
    </div>
  )
}
