# Game Mechanics: Detailed Implementation Guide

## 1. Player Band Creation

### Band Attributes
- **Core Attributes**:
  - `bandName`: Custom name chosen by player
  - `genre`: Primary musical genre (Rock, Pop, Hip Hop, Electronic, Jazz, Classical)
  - `memberIds`: Array of staff member IDs
  - `fame`: 0-100 scale, affects chart performance and opportunities
  - `notoriety`: 0-100 scale, affects media attention and controversy
  - `reputation`: 0-100 scale, affects industry relationships
  - `experience`: Accumulated through performances and releases
  - `fans`: Total fan count, affects sales and chart performance

### Band Members vs Studio Staff
- **Distinction**:
  - Band members are selected from available studio staff
  - Staff can be either band members or studio employees
  - Band members can't be assigned to other bands simultaneously
  - Staff members maintain their individual stats while in bands

### Member Improvement System
- **Training System**:
  - Technical skills (0-100)
  - Creativity (0-100)
  - Stage presence (calculated from technical + creativity)
  - Genre-specific modifiers affect skill weights
- **Improvement Methods**:
  - Training sessions (costs time and money)
  - Live performances
  - Recording sessions
  - Tour experience

## 2. Song Creation Mechanics

### Project Stages
The existing `OriginalTrackProject` stages are enhanced with:

1. **Pre-production**:
   - Songwriting
   - Arrangement
   - Demo recording
2. **Production**:
   - Tracking
   - Overdubbing
   - Editing
3. **Post-production**:
   - Mixing
   - Mastering
   - Final review

### Quality Determination
- **Base Quality Factors**:
  - Band member skills
  - Studio equipment quality
  - Producer/engineer expertise
  - Time invested
- **Genre-specific Requirements**:
  - Technical proficiency weight
  - Creativity weight
  - Production quality weight

### Hype Generation
- **Pre-release Hype**:
  - Social media presence
  - Fan engagement
  - Industry buzz
  - Previous track performance
- **Release Strategy**:
  - Timing (avoiding major releases)
  - Marketing budget
  - Target audience
  - Platform selection

## 3. Song Release & Chart Integration

### Release Triggers
- **Release Conditions**:
  - Track completion (all stages finished)
  - Quality threshold met
  - Marketing preparation
  - Release date selection
- **Release Types**:
  - Independent release
  - Label partnership
  - Digital-only
  - Full album release

### Initial Buzz Simulation
- **Factors**:
  - Band's existing fanbase
  - Marketing campaign effectiveness
  - Social media presence
  - Industry relationships
  - Previous track performance
- **Buzz Generation**:
  - Pre-release teasers
  - Music video release
  - Live performances
  - Media coverage

### Chart Position Mechanics
- **Position Factors**:
  - Sales volume
  - Streaming numbers
  - Radio play
  - Social media engagement
  - Fan interaction
- **Update Frequency**:
  - Daily updates for major charts
  - Weekly updates for genre-specific charts
  - Real-time tracking for digital platforms

## 4. Parody Social Network

### Stats & Metrics
- **Band Stats**:
  - Follower count
  - Engagement rate
  - Post reach
  - Fan interaction
- **Content Stats**:
  - Likes/shares
  - Comments
  - Viral potential
  - Trend participation

### Visual Elements
- **Profile Customization**:
  - Band photos
  - Cover images
  - Theme colors
  - Custom emojis
- **Content Types**:
  - Studio updates
  - Behind-the-scenes
  - Fan interactions
  - Release announcements
  - Live performance clips

### Player Interaction
- **Actions**:
  - Post creation
  - Fan engagement
  - Industry networking
  - Trend participation
  - Event promotion
- **Influence on Game**:
  - Fan base growth
  - Chart performance
  - Industry relationships
  - Marketing effectiveness
  - Release success

### Integration with Game Mechanics
- **Direct Effects**:
  - Chart position influence
  - Fan base growth
  - Industry reputation
  - Marketing effectiveness
- **Indirect Effects**:
  - Band member morale
  - Label interest
  - Tour success
  - Merchandise sales 