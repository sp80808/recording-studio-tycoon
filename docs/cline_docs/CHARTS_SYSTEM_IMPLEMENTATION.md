# Charts & Industry Trends System - Implementation Guide

## Overview
The Charts & Industry Trends system adds a dynamic, living music industry to the game, allowing players to track popular artists, contact them for collaborations, and understand market trends to make strategic decisions.

## Core Components

### 1. Music Charts System

#### Chart Structure
```typescript
interface MusicChart {
  id: string;
  name: string; // "Billboard Hot 100", "Alternative Charts", etc.
  genre: string[];
  entries: ChartEntry[];
  lastUpdated: number;
  updateFrequency: number; // days
}

interface ChartEntry {
  position: number;
  previousPosition: number;
  artist: ChartArtist;
  song: string;
  weeksOnChart: number;
  peakPosition: number;
  trend: 'up' | 'down' | 'stable' | 'new';
  contactable: boolean;
  collaborationCost: number;
  reputationRequired: number;
}

interface ChartArtist {
  id: string;
  name: string;
  genre: string[];
  popularity: number;
  contactInfo: ContactInfo;
  availableProjects: Project[];
  lastContacted: number;
  relationship: number; // 0-100
}
```

#### Chart Categories
- **Mainstream Charts**: Billboard Hot 100, Top 40
- **Genre-Specific**: Rock, Hip-Hop, Country, Electronic, etc.
- **Regional Charts**: Local markets, international
- **Emerging Artists**: Up-and-coming talents
- **Vintage Charts**: Historical hit tracking

### 2. Artist Contact System

#### Contact Mechanics
```typescript
interface ContactAttempt {
  artistId: string;
  projectType: 'collaboration' | 'feature' | 'production' | 'remix';
  offer: {
    fee: number;
    royaltyShare: number;
    creditPosition: string;
    additionalBenefits: string[];
  };
  playerReputation: number;
  success: boolean;
  response: ContactResponse;
}

interface ContactResponse {
  type: 'accept' | 'counter' | 'decline' | 'unavailable';
  message: string;
  counterOffer?: ContactAttempt['offer'];
  availabilityDate?: number;
  requirements?: string[];
}
```

#### Contact Success Factors
- **Player Reputation**: Higher reputation = better response rates
- **Offer Attractiveness**: Money, royalties, creative control
- **Artist Availability**: Busy artists harder to book
- **Relationship History**: Previous collaborations matter
- **Market Timing**: Trending artists more expensive

### 3. Trend Analysis System

#### Trend Tracking
```typescript
interface MusicTrend {
  id: string;
  name: string;
  type: 'genre' | 'instrument' | 'production' | 'cultural';
  popularity: number; // 0-100
  momentum: number; // -10 to +10 (rising/falling speed)
  peakExpected: number; // predicted peak popularity
  regions: string[]; // where it's popular
  demographics: {
    ageGroup: string;
    income: string;
    lifestyle: string[];
  };
  relatedTrends: string[];
  historicalData: TrendDataPoint[];
}

interface TrendDataPoint {
  date: number;
  popularity: number;
  events: string[]; // What caused changes
}
```

#### Trend Categories
- **Musical Genres**: Rise and fall of different styles
- **Production Techniques**: Auto-tune, vinyl revival, etc.
- **Instruments**: Guitar comeback, synthesizer trends
- **Cultural Movements**: Social causes, lifestyle changes
- **Technology**: Streaming, AI music, NFTs

### 4. Market Intelligence

#### Industry Insights
```typescript
interface MarketInsight {
  type: 'opportunity' | 'warning' | 'prediction' | 'analysis';
  title: string;
  description: string;
  actionable: boolean;
  actions: InsightAction[];
  confidence: number; // 0-100
  timeRelevant: number; // days until expires
  source: 'charts' | 'social' | 'industry' | 'ai';
}

interface InsightAction {
  type: 'contact_artist' | 'change_focus' | 'invest_equipment' | 'modify_project';
  description: string;
  cost: number;
  expectedBenefit: string;
  riskLevel: 'low' | 'medium' | 'high';
}
```

## Implementation Strategy

### Phase 1: Basic Charts (Week 1-2)
1. **Static Chart System**
   - Create initial chart data
   - Display charts in Bands tab
   - Basic artist information

2. **Simple Contact System**
   - Contact form for chart artists
   - Basic success/failure logic
   - Simple cost calculation

3. **UI Integration**
   - Charts panel in Bands tab
   - Artist detail modal
   - Contact results feedback

### Phase 2: Dynamic Charts (Week 3-4)
1. **Chart Updates**
   - Weekly chart position changes
   - New entries and departures
   - Trend indicators

2. **Enhanced Contact System**
   - Reputation-based success rates
   - Counter-offers and negotiations
   - Relationship tracking

3. **Basic Trends**
   - Genre popularity tracking
   - Simple trend indicators
   - Market timing effects

### Phase 3: Advanced Features (Week 5-6)
1. **Market Intelligence**
   - Trend predictions
   - Opportunity identification
   - Strategic recommendations

2. **Complex Negotiations**
   - Multi-part deals
   - Royalty structures
   - Creative control agreements

3. **Industry Events**
   - Award shows affecting charts
   - Viral moments
   - Industry scandals

## Technical Implementation

### Data Management
```typescript
// Chart data generation
export const generateChartData = (week: number, playerLevel: number): MusicChart[] => {
  const charts = [];
  
  // Generate main chart
  const mainChart = createChart('Hot 100', ['pop', 'rock', 'hip-hop']);
  mainChart.entries = generateChartEntries(100, week, playerLevel);
  charts.push(mainChart);
  
  // Generate genre-specific charts
  const genres = ['rock', 'hip-hop', 'country', 'electronic'];
  genres.forEach(genre => {
    const chart = createChart(`${genre} Charts`, [genre]);
    chart.entries = generateChartEntries(40, week, playerLevel);
    charts.push(chart);
  });
  
  return charts;
};

// Artist contact logic
export const attemptContact = (
  artist: ChartArtist, 
  offer: ContactOffer, 
  playerRep: number
): ContactResponse => {
  const baseSuccess = calculateBaseSuccess(artist, playerRep);
  const offerAttractiveness = evaluateOffer(offer, artist);
  const finalSuccess = baseSuccess * offerAttractiveness;
  
  if (finalSuccess > 0.7) {
    return createAcceptResponse(artist, offer);
  } else if (finalSuccess > 0.4) {
    return createCounterResponse(artist, offer);
  } else {
    return createDeclineResponse(artist, offer);
  }
};
```

### Database Schema
```sql
-- Charts table
CREATE TABLE charts (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  genre JSON,
  last_updated TIMESTAMP,
  update_frequency INTEGER
);

-- Chart entries
CREATE TABLE chart_entries (
  id VARCHAR PRIMARY KEY,
  chart_id VARCHAR REFERENCES charts(id),
  position INTEGER,
  previous_position INTEGER,
  artist_id VARCHAR,
  song VARCHAR,
  weeks_on_chart INTEGER,
  peak_position INTEGER,
  trend VARCHAR,
  created_at TIMESTAMP
);

-- Artists
CREATE TABLE chart_artists (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  genre JSON,
  popularity INTEGER,
  contact_cost INTEGER,
  reputation_required INTEGER,
  last_contacted TIMESTAMP,
  relationship INTEGER DEFAULT 0
);

-- Trends
CREATE TABLE music_trends (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR,
  popularity INTEGER,
  momentum INTEGER,
  peak_expected INTEGER,
  regions JSON,
  demographics JSON,
  created_at TIMESTAMP
);
```

## UI/UX Design

### Charts Panel Layout
```tsx
// Charts tab in Bands section
<div className="charts-panel">
  <div className="chart-selector">
    <TabButton active={selectedChart === 'hot100'}>Hot 100</TabButton>
    <TabButton active={selectedChart === 'rock'}>Rock</TabButton>
    <TabButton active={selectedChart === 'hiphop'}>Hip-Hop</TabButton>
    {/* More genre tabs */}
  </div>
  
  <div className="chart-list">
    {chartEntries.map(entry => (
      <ChartEntry 
        key={entry.id}
        entry={entry}
        onContact={() => openContactModal(entry.artist)}
        contactable={entry.contactable}
        canAfford={playerMoney >= entry.collaborationCost}
      />
    ))}
  </div>
  
  <div className="trends-sidebar">
    <TrendsWidget trends={currentTrends} />
    <MarketInsights insights={marketInsights} />
  </div>
</div>
```

### Contact Modal
```tsx
<ContactModal 
  artist={selectedArtist}
  onSubmit={handleContactSubmit}
  playerReputation={gameState.reputation}
  availableFunds={gameState.money}
  previousInteractions={getArtistHistory(selectedArtist.id)}
/>
```

## Game Balance Considerations

### Contact Success Rates
- **New Player (Rep 0-100)**: 10-20% with emerging artists
- **Established (Rep 100-500)**: 30-50% with mid-tier artists
- **Industry Player (Rep 500-1000)**: 60-80% with major artists
- **Mogul (Rep 1000+)**: 90%+ with any artist

### Cost Scaling
- **Emerging Artists**: $500-$2,000
- **Chart Artists**: $5,000-$20,000
- **Top 10 Artists**: $50,000-$200,000
- **#1 Artists**: $500,000+

### Reputation Impact
- **Successful Collaborations**: +5-15 reputation
- **Failed Projects**: -2-5 reputation
- **Chart Success**: +10-50 reputation
- **Industry Recognition**: +20-100 reputation

## Success Metrics

### Player Engagement
- **Chart Checking**: Players check charts weekly
- **Contact Attempts**: 2-3 attempts per week
- **Success Rate**: 30-40% overall success rate
- **Repeat Collaborations**: 25% of successful contacts lead to repeat work

### Content Variety
- **Chart Diversity**: 50+ unique artists across all charts
- **Trend Cycles**: 6-8 major trends per year
- **Regional Variation**: 3-4 different regional markets
- **Genre Balance**: Equal representation across major genres

## Integration with Existing Systems

### Staff System
- A&R staff improve contact success rates
- Marketing staff help with trend analysis
- Producers unlock special collaboration types

### Equipment System
- Trending equipment affects collaboration success
- Vintage gear appeals to certain artists
- Modern equipment required for electronic collaborations

### Project System
- Chart artists become available for specific project types
- Collaboration projects have unique requirements
- Success affects both parties' chart positions

## Future Expansions

### Advanced Features
- **Record Label Simulation**: Start your own label
- **Distribution Deals**: Negotiate with streaming platforms
- **International Markets**: Expand globally
- **Award Shows**: Grammy nominations and wins
- **Music Videos**: Visual content creation
- **Concert Promotion**: Live event management

### Technical Enhancements
- **Real-time Charts**: Live updating during gameplay
- **AI-Driven Trends**: Machine learning for trend prediction
- **Social Media Integration**: In-game social networks
- **Community Features**: Player-created content sharing

This comprehensive system will transform the game from a studio simulator into a full music industry experience, providing endless strategic depth while maintaining the core fun of music creation.
