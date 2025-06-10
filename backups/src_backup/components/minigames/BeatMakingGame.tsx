import { useEffect, useState } from 'react'
import { MiniGameProps } from '../../types/miniGame'

// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const BeatMakingGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [activePads, setActivePads] = useState<number[]>([])
  const { playSound } = useSound?.() || { playSound: () => {} }

  const pads = [1, 2, 3, 4, 5, 6, 7, 8]

  useEffect(() => {
    const interval = setInterval(() => {
      const randomPad = Math.floor(Math.random() * pads.length) + 1
      setActivePads([randomPad])
      playSound(`beat-${randomPad}`)
      
      if (progress >= 100) {
        clearInterval(interval)
        onComplete(progress)
      }
    }, 1000 - (difficulty * 100))

    return () => clearInterval(interval)
  }, [progress, difficulty])

  const handlePadPress = (pad: number) => {
    if (activePads.includes(pad)) {
      setProgress(prev => Math.min(prev + 15, 100))
      playSound(`beat-hit-${pad}`)
    } else {
      setProgress(prev => Math.max(prev - 5, 0))
      playSound('beat-miss')
    }
  }

  return (
    <div className="beat-maker">
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="beat-pads">
        {pads.map(pad => (
          <button
            key={pad}
            className={`pad ${activePads.includes(pad) ? 'active' : ''}`}
            onClick={() => handlePadPress(pad)}
          />
        ))}
      </div>
    </div>
  )
}
