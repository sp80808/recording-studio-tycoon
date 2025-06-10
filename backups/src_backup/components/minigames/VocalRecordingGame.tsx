import { useState, useEffect, useRef } from 'react'
import { MiniGameProps } from '../../types/miniGame'

// Optional sound functionality
const useSound = () => ({
  playSound: (sound: string) => {
    console.log('Playing sound:', sound)
  }
})

export const VocalRecordingGame = ({ onComplete, difficulty }: MiniGameProps) => {
  const [progress, setProgress] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [targetPitch, setTargetPitch] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const { playSound } = useSound?.() || { playSound: () => {} }

  useEffect(() => {
    // Initialize audio context
    // Type declaration for webkitAudioContext fallback
    interface WindowWithAudioContext extends Window {
      webkitAudioContext?: typeof AudioContext
    }
    const audioCtx = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext
    if (!audioCtx) {
      throw new Error('AudioContext is not supported in this browser')
    }
    audioContextRef.current = new audioCtx()
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 2048

    // Set random target pitch
    setTargetPitch(220 + Math.random() * 440 * difficulty)
    
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [difficulty])

  useEffect(() => {
    if (progress >= 100) {
      playSound('recording-complete')
      onComplete(progress)
    }
  }, [progress, onComplete])

  const startRecording = () => {
    setIsRecording(true)
    playSound('recording-start')
    
    // Simulate pitch detection
    const interval = setInterval(() => {
      if (!isRecording) {
        clearInterval(interval)
        return
      }

      // Simulate pitch and volume changes
      const newPitch = targetPitch + (Math.random() * 100 - 50)
      const newVolume = 50 + Math.random() * 50
      
      setPitch(newPitch)
      setVolume(newVolume)

      // Calculate accuracy
      const pitchAccuracy = 100 - Math.abs(newPitch - targetPitch) / targetPitch * 100
      const volumeAccuracy = newVolume > 30 ? 100 : newVolume / 30 * 100
      const totalAccuracy = (pitchAccuracy * 0.7) + (volumeAccuracy * 0.3)
      
      setProgress(Math.min(totalAccuracy, 100))
    }, 200)

    return () => clearInterval(interval)
  }

  const stopRecording = () => {
    setIsRecording(false)
    playSound('recording-stop')
  }

  return (
    <div className="vocal-recording">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="pitch-display">
        <div className="target-line" style={{ bottom: `${targetPitch / 10}px` }} />
        <div 
          className="current-pitch" 
          style={{ 
            bottom: `${pitch / 10}px`,
            height: `${volume}px`,
            opacity: volume / 100
          }}
        />
      </div>

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
      </div>

      <div className="instructions">
        Match your voice to the target pitch line (gray)
      </div>
    </div>
  )
}
