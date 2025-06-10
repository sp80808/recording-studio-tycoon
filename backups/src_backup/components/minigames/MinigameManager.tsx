import { BeatMakingGame } from './BeatMakingGame'
import { MasteringGame } from './MasteringGame'
import { MixingBoardGame } from './MixingBoardGame'
import { RhythmTimingGame } from './RhythmTimingGame'
import { RoutingRackMinigame } from './RoutingRackMinigame'
import { SoundWaveGame } from './SoundWaveGame'
import { VocalRecordingGame } from './VocalRecordingGame'
import { MiniGameType } from '../../types/miniGame'

export const MinigameManager = ({
  minigameType,
  onComplete,
  difficulty,
}: {
  minigameType: MiniGameType
  onComplete: (score: number) => void
  difficulty: number
}) => {
  switch (minigameType) {
    case 'beatMaking':
      return <BeatMakingGame onComplete={onComplete} difficulty={difficulty} />
    case 'mastering':
      return <MasteringGame onComplete={onComplete} difficulty={difficulty} />
    case 'mixing':
      return <MixingBoardGame onComplete={onComplete} difficulty={difficulty} />
    case 'rhythm':
      return <RhythmTimingGame onComplete={onComplete} difficulty={difficulty} />
    case 'routing':
      return <RoutingRackMinigame 
        onComplete={onComplete} 
        onCancel={() => onComplete(0)} 
        difficulty={difficulty} 
      />
    case 'soundWave':
      return <SoundWaveGame onComplete={onComplete} difficulty={difficulty} />
    case 'vocal':
      return <VocalRecordingGame onComplete={onComplete} difficulty={difficulty} />
    default:
      return null
  }
}
