import { useState, useEffect, useRef } from 'react'
import { MiniGameProps } from '../../types/miniGame'

// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const RhythmTimingGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [beats, setBeats] = useState<number[]>([])
  const [activeBeat, setActiveBeat] = useState(-1)
  const [hitTimes, setHitTimes] = useState<number[]>([])
  const timerRef = useRef<NodeJS.Timeout>()
  const { playSound } = useSound?.() || { playSound: () => {} }

  useEffect(() => {
    // Initialize beats based on difficulty
    const beatCount = 4 + difficulty * 2
    setBeats(Array(beatCount).fill(0).map((_, i) => i))
    
    // Start rhythm sequence
    const interval = 1000 - (difficulty * 150)
    let beatIndex = 0
    
    timerRef.current = setInterval(() => {
      setActiveBeat(beatIndex % beatCount)
      playSound('beat')
      beatIndex++
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [difficulty])

  useEffect(() => {
    if (hitTimes.length === beats.length) {
      // Calculate timing accuracy
      const accuracy = hitTimes.reduce((acc, time, i) => {
        const expectedTime = i * (1000 - (difficulty * 150))
        return acc + (100 - Math.abs(time - expectedTime) / 10)
      }, 0) / hitTimes.length
      
      setProgress(Math.min(accuracy, 100))
      onComplete(accuracy)
    }
  }, [hitTimes, beats.length, difficulty, onComplete])

  const handleTap = () => {
    if (activeBeat >= 0) {
      playSound('beat-hit')
      setHitTimes(prev => [...prev, Date.now()])
      setActiveBeat(-1)
    }
  }

  return (
    <div className="rhythm-game">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="beat-display">
        {beats.map((_, i) => (
          <div 
            key={i}
            className={`beat ${activeBeat === i ? 'active' : ''} ${hitTimes.includes(i) ? 'hit' : ''}`}
          />
        ))}
      </div>

      <button 
        className="tap-button"
        onClick={handleTap}
      >
        TAP
      </button>
    </div>
  )
}
