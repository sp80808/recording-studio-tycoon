# Recording Studio Tycoon - Design Notes

## Staff Development System

### Attributes
Each staff member has granular attributes (1-100 scale):

**Creativity Attributes:**
- Songwriting: Composition quality and catchiness
- Arrangement: Musical element cohesion  
- Ear: Audio nuance perception

**Technical Attributes:**
- Sound Design: Sound creation/manipulation
- Tech Knowledge: Equipment/software mastery
- Mixing: Audio track balancing
- Mastering: Final mix preparation

### Genre Attribute Weightings
Each genre emphasizes different attributes:
- Pop: High Songwriting, Arrangement
- Electronic: High Sound Design, Tech Knowledge  
- Rock: High Ear, Mixing
- Jazz: High Arrangement, Ear

### Practice Minigames
1. **Fader Drills**
   - Type: Timing-based
   - Reward: +1-3 Mixing, +1-2 Ear
   - Cost: 30 minutes staff time

2. **Patch Bay Puzzle**
   - Type: Connection puzzle  
   - Reward: +1-3 Tech Knowledge, +1-2 Arrangement
   - Cost: 45 minutes staff time

3. **Waveform Matching - Phase Allignment**
   - Type: Pattern recognition
   - Reward: +1-3 Ear, +1-2 Sound Design
   - Cost: 30 minutes staff time
   - Description: Match audio waveforms to match the phases of the waves - Simple interactive diagram

4. **EQ Frequency Hunt**
   - Type: Simulated Audio identification
   - Reward: +1-3 Mixing, +1-2 Tech Knowledge
   - Cost: 45 minutes staff time
   - Description: Identify and adjust problematic frequencies in a mix with an interactive diagram (Lets not actually create any sound here just an interactive eq)


5. **Chord Progression Builder**
   - Type: Music theory puzzle
   - Reward: +1-3 Songwriting, +1-2 Arrangement
   - Cost: 45 minutes staff time
   - Description: Create pleasing chord progressions within genre constraints Make a simplified original version of this to keep the game universal.

6. **Drum Pattern Creator**
   - Type: Rhythm sequencing
   - Reward: +1-3 Arrangement, +1-2 Sound Design
   - Cost: 30 minutes staff time
   - Description: Build drum patterns that match different musical styles with a step sequencer type system


7. **Vocal Harmony Trainer**
   - Type: Pitch matching
   - Reward: +1-3 Ear, +1-2 Songwriting
   - Cost: 45 minutes staff time
   - Description: Practice creating and identifying vocal harmonies

### Training Courses
| Name                      | Cost  | Duration | Effect                     | Prerequisites |
|---------------------------|-------|----------|----------------------------|---------------|
| DIY Mic Modding           | $600  | 1 day    | +5 Tech Knowledge          | -             |
| Improv Jamming            | $550  | 1 day    | +5 Songwriting             | -             |  
| Analog Tape Tricks        | $800  | 2 days   | +8 Tech Knowledge, +3 Mixing | Tech Knowledge ≥ 30 |
| Advanced Vocal Production | $1000 | 3 days   | +7 Ear, +5 Mixing          | Ear ≥ 40      |
| Electronic Soundscapes    | $950  | 2 days   | +10 Sound Design           | Sound Design ≥ 25 |

## Equipment System

### Progression
Unlocks based on:
- Studio level
- Staff skill thresholds
- Completed projects

### Example Equipment
1. **Basic USB Interface**
   - Starter gear
   - Effects: +5% Technical

2. **Channel Strip**
   - Unlock: 5 projects completed
   - Effects: +10% Technical, +5% Creativity

3. **Vintage Tube Preamp**
   - Unlock: Any staff Tech ≥ 50
   - Effects: +15% Technical

## Implementation Notes
- Attributes stored in `Staff` type (src/types/game.ts)
- Minigames will use existing modal system
- Equipment unlocks tracked in player progression
