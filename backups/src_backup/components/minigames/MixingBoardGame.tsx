import { useState, useEffect } from 'react'
import { MiniGameProps } from '../../types/miniGame'

// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const MixingBoardGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [faders, setFaders] = useState([0, 0, 0, 0, 0, 0])
  const [targetLevels, setTargetLevels] = useState([0, 0, 0, 0, 0, 0])
  const { playSound } = useSound?.() || { playSound: () => {} }

  useEffect(() => {
    // Generate random target levels based on difficulty
    const newTargets = faders.map(() => Math.round(Math.random() * 100))
    setTargetLevels(newTargets)
  }, [difficulty])

  useEffect(() => {
    if (progress >= 100) {
      playSound('mix-complete')
      onComplete(progress)
    }
  }, [progress, onComplete])

  const handleFaderChange = (index: number, value: number) => {
    const newFaders = [...faders]
    newFaders[index] = value
    setFaders(newFaders)

    // Calculate accuracy for this fader
    const accuracy = 100 - Math.abs(targetLevels[index] - value)
    setProgress(prev => {
      const newProgress = prev + (accuracy / faders.length / 2)
      return Math.min(newProgress, 100)
    })
  }

  return (
    <div className="mixing-board">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="faders">
        {faders.map((level, i) => (
          <div key={i} className="fader-channel">
            <label>Channel {i+1}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={level}
              onChange={(e) => handleFaderChange(i, Number(e.target.value))}
            />
            <div className="target-indicator" style={{ 
              bottom: `${targetLevels[i]}%` 
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}
