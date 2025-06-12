# Suno API Integration Plan (PRIVATE - DO NOT COMMIT)

**⚠️ THIS FILE CONTAINS API KEY - ADD TO .gitignore ⚠️**

## API Key Information
- **API Endpoint**: sunoapi.org
- **API Key**: b975f50ee5b289988a4428a0b4c7a62d
- **Purpose**: Automatic track generation for band management system

---

## Integration Overview

This document outlines the theoretical implementation of Suno AI music generation for the band management system in Recording Studio Tycoon. This feature would allow players to automatically generate original tracks for their bands using AI.

### Core Concept
- When players create original tracks for their bands, instead of placeholder audio, generate actual music using Suno AI
- Use genre, era, and band characteristics to create appropriate prompts
- Cache generated tracks to avoid API costs for repeated requests

---

## Technical Implementation Plan

### 1. API Service Layer

```typescript
// src/services/sunoService.ts
interface SunoApiConfig {
  apiKey: string;
  baseUrl: string;
}

interface SunoGenerationRequest {
  prompt: string;
  tags: string[];
  title: string;
  duration?: number; // 30-120 seconds
  style?: string;
}

interface SunoGenerationResponse {
  id: string;
  audio_url: string;
  title: string;
  tags: string[];
  metadata: {
    duration: number;
    created_at: string;
  };
}

class SunoApiService {
  private config: SunoApiConfig = {
    apiKey: 'b975f50ee5b289988a4428a0b4c7a62d',
    baseUrl: 'https://sunoapi.org/api/v1'
  };

  async generateTrack(request: SunoGenerationRequest): Promise<SunoGenerationResponse> {
    // Implementation would go here
    // POST to Suno API with prompt and parameters
    // Handle response and return generated track info
  }

  async getGenerationStatus(id: string): Promise<SunoGenerationResponse> {
    // Check if generation is complete
    // Suno typically takes 1-3 minutes to generate
  }
}
```

### 2. Prompt Generation System

```typescript
// src/utils/sunoPromptGenerator.ts
interface BandTrackContext {
  band: Band;
  genre: string;
  era: string;
  mood: 'upbeat' | 'mellow' | 'energetic' | 'experimental';
  length: 'short' | 'medium' | 'long'; // 30s, 60s, 120s
}

class SunoPromptGenerator {
  generatePrompt(context: BandTrackContext): SunoGenerationRequest {
    const eraStyles = {
      'analog60s': 'vintage recording, analog warmth, 1960s production',
      'digital80s': 'digital reverb, synthesizers, 1980s style',
      'internet2000s': 'modern production, clean mix, 2000s sound',
      'streaming2020s': 'contemporary, streaming-ready, polished'
    };

    const genrePrompts = {
      'rock': 'electric guitars, drums, bass, rock band',
      'pop': 'catchy melody, commercial sound, radio-friendly',
      'electronic': 'synthesizers, electronic beats, digital sounds',
      'hip-hop': 'rap vocals, beats, urban sound',
      'jazz': 'saxophone, piano, jazz ensemble, improvisation',
      'country': 'acoustic guitar, country vocals, southern style'
    };

    const prompt = `${genrePrompts[context.genre]}, ${eraStyles[context.era]}, ${context.mood} mood, instrumental track`;

    return {
      prompt,
      tags: [context.genre, context.era, context.mood],
      title: `${context.band.name} - Original Track`,
      duration: context.length === 'short' ? 30 : context.length === 'medium' ? 60 : 120,
      style: context.genre
    };
  }
}
```

### 3. Integration with Band Management

```typescript
// Enhancement to existing band management hooks
export const useBandManagement = () => {
  const [generatingTracks, setGeneratingTracks] = useState<Set<string>>(new Set());
  const sunoService = new SunoApiService();
  const promptGenerator = new SunoPromptGenerator();

  const createOriginalTrackWithAI = async (
    bandId: string, 
    trackParams: BandTrackContext
  ) => {
    setGeneratingTracks(prev => new Set([...prev, bandId]));
    
    try {
      // Generate prompt
      const prompt = promptGenerator.generatePrompt(trackParams);
      
      // Start generation
      const generation = await sunoService.generateTrack(prompt);
      
      // Poll for completion (show loading state)
      const checkCompletion = async () => {
        const result = await sunoService.getGenerationStatus(generation.id);
        
        if (result.audio_url) {
          // Download and cache the audio file
          await cacheGeneratedTrack(result);
          
          // Update band with new track
          updateBandWithGeneratedTrack(bandId, result);
          
          setGeneratingTracks(prev => {
            const next = new Set(prev);
            next.delete(bandId);
            return next;
          });
        } else {
          // Still generating, check again in 30 seconds
          setTimeout(checkCompletion, 30000);
        }
      };
      
      checkCompletion();
      
    } catch (error) {
      console.error('Suno generation failed:', error);
      setGeneratingTracks(prev => {
        const next = new Set(prev);
        next.delete(bandId);
        return next;
      });
    }
  };

  return {
    createOriginalTrackWithAI,
    generatingTracks: Array.from(generatingTracks)
  };
};
```

### 4. UI Integration

```typescript
// Enhancement to BandManagement component
const BandManagement = () => {
  const { createOriginalTrackWithAI, generatingTracks } = useBandManagement();

  const handleCreateAITrack = (band: Band) => {
    const context: BandTrackContext = {
      band,
      genre: band.primaryGenre,
      era: gameState.currentEra,
      mood: 'energetic', // Could be selectable
      length: 'medium'
    };

    createOriginalTrackWithAI(band.id, context);
  };

  return (
    <div>
      {/* Existing band management UI */}
      
      <Button 
        onClick={() => handleCreateAITrack(selectedBand)}
        disabled={generatingTracks.includes(selectedBand.id)}
      >
        {generatingTracks.includes(selectedBand.id) 
          ? 'Generating Track...' 
          : 'Create AI Original Track'
        }
      </Button>
    </div>
  );
};
```

---

## Cost Management Strategy

### 1. Caching System
- Cache generated tracks locally to avoid regenerating
- Use MD5 hash of prompt parameters as cache key
- Implement cache expiration (e.g., 30 days)

### 2. Rate Limiting
- Limit players to X generations per day/week
- Higher level players get more generations
- Premium feature for advanced players

### 3. Prompt Optimization
- Reuse similar prompts when possible
- Create a library of "template" tracks that can be slightly modified

---

## File Structure Changes

```
src/
  services/
    sunoService.ts          # API integration
  utils/
    sunoPromptGenerator.ts  # Prompt generation logic
  hooks/
    useSunoGeneration.ts    # React hook for UI integration
  cache/
    generated-tracks/       # Local cache for generated audio
```

---

## Environment Configuration

```env
# .env.local (DO NOT COMMIT)
VITE_SUNO_API_KEY=b975f50ee5b289988a4428a0b4c7a62d
VITE_SUNO_API_URL=https://sunoapi.org/api/v1
VITE_ENABLE_AI_GENERATION=true
```

---

## Implementation Phases

### Phase 1: Basic Integration
- Set up API service
- Create simple prompt generation
- Add basic UI for track generation

### Phase 2: Advanced Features
- Genre-specific prompt optimization
- Era-appropriate style generation
- Advanced caching and optimization

### Phase 3: Premium Features
- Custom prompt editing for advanced users
- Batch generation for albums
- Integration with charts system (AI tracks can chart)

---

## Security Considerations

1. **API Key Protection**
   - Never expose API key in frontend code
   - Use server-side proxy if possible
   - Implement request signing

2. **Rate Limiting**
   - Implement client-side and server-side limits
   - Track usage per user
   - Graceful degradation when limits exceeded

3. **Content Moderation**
   - Filter inappropriate prompts
   - Implement content guidelines
   - Allow reporting of generated content

---

## Testing Strategy

1. **Mock Service for Development**
   - Create mock Suno service for testing
   - Use sample audio files during development
   - Switch to real API only for production testing

2. **Error Handling**
   - Test API failures gracefully
   - Handle generation timeouts
   - Provide meaningful error messages to users

---

**⚠️ IMPORTANT: This is a theoretical implementation plan. Do not implement without:**
1. Proper API key security setup
2. Cost analysis and budgeting
3. Legal review of generated content usage
4. User consent and terms of service updates

---

*This document should be added to .gitignore to prevent accidental commits of the API key.*
