# Track Release, Promotion, Review, and Hype System Plan

## Inspiration
This system will be inspired by Game Dev Story's game release and promotion system, but adapted for the music industry.

## Core Features

### 1. Track Release
- **Release Options**: Different release options will be available, such as:
    - **Independent Release**: Release the track independently, with lower upfront costs but potentially lower reach.
    - **Record Label Release**: Partner with a record label for wider distribution and promotion, but with a percentage of royalties going to the label.
- **Release Date**: Choose a release date for the track. The release date can impact the track's performance based on market trends and competitor releases.
- **Track Metadata**: Set track metadata, such as genre, subgenre, mood, and keywords. This metadata will be used for marketing and promotion.

### 2. Promotion
- **Promotion Campaigns**: Different promotion campaigns will be available, each with its own cost and reach:
    - **Social Media Campaign**: Promote the track on social media platforms.
    - **Radio Campaign**: Promote the track on radio stations.
    - **Music Video**: Create a music video for the track.
    - **Influencer Marketing**: Partner with music influencers to promote the track.
    - **Concerts/Live Performances**: Promote the track through live performances.
- **Promotion Budget**: Allocate a budget for each promotion campaign. The higher the budget, the wider the reach.
- **Target Audience**: Define the target audience for each promotion campaign. This will help to optimize the campaign's effectiveness.

### 3. Reviews
- **Review System**: The track will be reviewed by music critics and fans.
- **Review Scores**: The track will receive review scores from different sources.
- **Review Impact**: Review scores will impact the track's sales and popularity.

### 4. Hype Generation
- **Hype System**: Generate hype for the track before its release.
- **Hype Events**: Different hype events will be available, such as:
    - **Teaser Release**: Release a short teaser of the track.
    - **Behind-the-Scenes Video**: Release a behind-the-scenes video of the track's production.
    - **Pre-Release Concert**: Perform the track live before its release.
- **Hype Impact**: Hype will impact the track's initial sales and popularity.

## Implementation Details

### Data Structures
- **TrackRelease**:
    - `releaseOption`: Enum (Independent, RecordLabel)
    - `releaseDate`: Date
    - `metadata`: TrackMetadata
- **TrackMetadata**:
    - `genre`: string
    - `subgenre`: string
    - `mood`: string
    - `keywords`: string[]
- **PromotionCampaign**:
    - `type`: Enum (SocialMedia, Radio, MusicVideo, InfluencerMarketing, Concerts)
    - `budget`: number
    - `targetAudience`: string
- **Review**:
    - `source`: string
    - `score`: number
- **HypeEvent**:
    - `type`: Enum (TeaserRelease, BehindTheScenes, PreReleaseConcert)
    - `impact`: number

### UI Elements
- **Track Release Modal**: A modal for selecting release options, release date, and track metadata.
- **Promotion Campaign Panel**: A panel for selecting promotion campaigns, setting budgets, and defining target audiences.
- **Review Display**: A display for showing review scores and comments.
- **Hype Meter**: A meter for showing the current level of hype for the track.

### Game Logic
- **Release Logic**: Implement the logic for releasing the track, including calculating royalties and distributing the track to different platforms.
- **Promotion Logic**: Implement the logic for running promotion campaigns, including calculating reach and impact.
- **Review Logic**: Implement the logic for generating reviews, including calculating review scores and comments.
- **Hype Logic**: Implement the logic for generating hype, including calculating hype level and impact.

## Next Steps
1. Create the data structures for the new system.
2. Create the UI elements for the new system.
3. Implement the game logic for the new system.
