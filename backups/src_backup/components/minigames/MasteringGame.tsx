import { useState, useEffect } from 'react'
import { MiniGameProps } from '../../types/miniGame'
// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const MasteringGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [targetSettings, setTargetSettings] = useState({
    eq: [0, 0, 0],
    compression: 0,
    limiter: 0
  })
  const [currentSettings, setCurrentSettings] = useState({
    eq: [0, 0, 0],
    compression: 0,
    limiter: 0
  })
  const { playSound } = useSound?.() || { playSound: () => {} }

  useEffect(() => {
    // Generate random target settings based on difficulty
    const newTarget = {
      eq: [
        Math.round(Math.random() * 10 - 5),
        Math.round(Math.random() * 10 - 5),
        Math.round(Math.random() * 10 - 5)
      ],
      compression: Math.round(Math.random() * 10),
      limiter: Math.round(Math.random() * 5)
    }
    setTargetSettings(newTarget)
  }, [difficulty])

  useEffect(() => {
    if (progress >= 100) {
      playSound('mastering-complete')
      onComplete(progress)
    }
  }, [progress, onComplete])

  const handleSettingChange = (type: 'eq' | 'compression' | 'limiter', index: number, value: number) => {
    const newSettings = {...currentSettings}
    if (type === 'eq') {
      const newEq = [...currentSettings.eq]
      newEq[index] = value
      newSettings.eq = newEq
    } else {
      newSettings[type] = value
    }
    setCurrentSettings(newSettings)

    // Calculate progress
    let accuracy = 0
    if (type === 'eq') {
      accuracy = 100 - Math.abs(targetSettings.eq[index] - value) * 5
    } else {
      accuracy = 100 - Math.abs(targetSettings[type] - value) * 5
    }
    setProgress(prev => Math.min(prev + accuracy/10, 100))
  }

  return (
    <div className="mastering-game">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="controls">
        <h3>EQ Settings</h3>
        {['Low', 'Mid', 'High'].map((band, i) => (
          <div key={band} className="eq-band">
            <label>{band}</label>
            <input
              type="range"
              min="-5"
              max="5"
              value={currentSettings.eq[i]}
              onChange={(e) => handleSettingChange('eq', i, Number(e.target.value))}
            />
            <span>{currentSettings.eq[i]} dB</span>
          </div>
        ))}

        <h3>Compression</h3>
        <input
          type="range"
          min="0"
          max="10"
          value={currentSettings.compression}
          onChange={(e) => handleSettingChange('compression', 0, Number(e.target.value))}
        />
        <span>{currentSettings.compression}</span>

        <h3>Limiter</h3>
        <input
          type="range"
          min="0"
          max="5"
          value={currentSettings.limiter}
          onChange={(e) => handleSettingChange('limiter', 0, Number(e.target.value))}
        />
        <span>{currentSettings.limiter} dB</span>
      </div>
    </div>
  )
}
