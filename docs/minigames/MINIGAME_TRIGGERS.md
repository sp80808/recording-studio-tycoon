# Minigame Triggers and Pacing Guide

## Era-Specific Minigame Triggers

### 1. Analog Era (1950s-1960s)
#### Core Recording Minigames
- **Tape Splicing**
  - Trigger: During editing stages with tape equipment
  - Equipment Required: `tape_machine`, `splicing_block`
  - Focus Threshold: `soundCapture` >= 30
  - Priority: 8

- **Four-Track Recording**
  - Trigger: During multi-track recording stages
  - Equipment Required: `four_track_recorder`
  - Focus Threshold: `performance` >= 40
  - Priority: 9

- **Microphone Placement**
  - Trigger: During initial recording setup
  - Equipment Required: Any `microphone`
  - Focus Threshold: `soundCapture` >= 25
  - Priority: 7

- **Analog Console**
  - Trigger: During mixing stages
  - Equipment Required: `analog_console`
  - Focus Threshold: `layering` >= 35
  - Priority: 8

### 2. Digital Era (1970s-1980s)
#### Mixing & Production Minigames
- **Digital Mixing**
  - Trigger: During mixing stages with digital equipment
  - Equipment Required: `digital_console` or `daw`
  - Focus Threshold: `layering` >= 40
  - Priority: 8

- **MIDI Programming**
  - Trigger: During sequencing stages
  - Equipment Required: `midi_controller`
  - Focus Threshold: `creativity` >= 35
  - Priority: 7

- **Sample Editing**
  - Trigger: During production stages
  - Equipment Required: `sampler`
  - Focus Threshold: `creativity` >= 30
  - Priority: 6

### 3. Internet Era (1990s-2000s)
#### Mastering & Processing Minigames
- **Effect Chain**
  - Trigger: During production stages
  - Equipment Required: `effects_rack`
  - Focus Threshold: `creativity` >= 40
  - Priority: 8

- **Mastering Chain**
  - Trigger: During mastering stages
  - Equipment Required: `mastering_equipment`
  - Focus Threshold: `technical` >= 45
  - Priority: 9

- **Acoustic Tuning**
  - Trigger: During studio setup
  - Equipment Required: `acoustic_treatment`
  - Focus Threshold: `technical` >= 35
  - Priority: 7

### 4. Modern Era (2000s-2010s)
#### Creative & Technical Minigames
- **Hybrid Mixing**
  - Trigger: During mixing stages with both analog and digital equipment
  - Equipment Required: `analog_console` AND `daw`
  - Focus Threshold: `layering` >= 45
  - Priority: 9

- **Digital Distribution**
  - Trigger: During release preparation
  - Equipment Required: `internet_connection`
  - Focus Threshold: `business` >= 40
  - Priority: 8

- **Social Media Promotion**
  - Trigger: During marketing stages
  - Equipment Required: `social_media_accounts`
  - Focus Threshold: `business` >= 35
  - Priority: 7

### 5. Streaming Era (2020s+)
#### Modern Era Minigames
- **AI Mastering**
  - Trigger: During mastering stages
  - Equipment Required: `ai_mastering_software`
  - Focus Threshold: `technical` >= 40
  - Priority: 8

- **Streaming Optimization**
  - Trigger: During release preparation
  - Equipment Required: `streaming_platform_accounts`
  - Focus Threshold: `business` >= 45
  - Priority: 9

## Pacing Guidelines

### 1. Early Game (First 2-3 Projects)
- Focus on core recording minigames
- Introduce one new minigame type per project
- Start with simpler versions of each minigame
- Higher success thresholds for progression

### 2. Mid Game (4-8 Projects)
- Introduce mixing and production minigames
- Mix of analog and digital challenges
- Balanced difficulty progression
- Introduce equipment-specific triggers

### 3. Late Game (9+ Projects)
- Full range of minigames available
- Complex combinations of challenges
- Equipment and skill-based triggers
- Higher rewards for mastery

## Trigger Frequency Guidelines

### Per Project
- 2-3 minigames for small projects
- 3-4 minigames for medium projects
- 4-5 minigames for large projects

### Cooldown Periods
- Same minigame type: 2 projects minimum
- Similar minigame category: 1 project minimum
- No cooldown for different categories

## Equipment-Based Triggers

### Required Equipment Combinations
- Analog Era: Basic recording equipment
- Digital Era: Digital workstations and controllers
- Internet Era: Online distribution tools
- Modern Era: Streaming and social media tools

### Equipment Quality Impact
- Higher quality equipment reduces difficulty
- Vintage equipment provides unique challenges
- Modern equipment enables advanced features

## Skill-Based Triggers

### Focus Allocation Impact
- Higher focus in relevant areas increases trigger chance
- Minimum thresholds prevent overwhelming new players
- Skill progression unlocks advanced minigame features

### Genre-Specific Triggers
- Rock: Emphasis on recording and mixing
- Electronic: Focus on synthesis and sequencing
- Pop: Balance of recording and production
- Hip-Hop: Beat making and sampling focus

## Implementation Notes

### Trigger Priority System
1. Era-appropriate minigames
2. Equipment-available minigames
3. Skill-appropriate minigames
4. Project-stage relevant minigames

### Difficulty Scaling
- Base difficulty on player level
- Adjust for equipment quality
- Consider project complexity
- Factor in genre requirements

### Reward Balancing
- XP rewards scale with difficulty
- Quality bonuses reflect minigame success
- Time bonuses for efficient completion
- Special rewards for perfect scores 