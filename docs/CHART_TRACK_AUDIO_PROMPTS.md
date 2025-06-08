# Music Generation Prompts for Chart Tracks

This document contains a comprehensive list of prompts for generating short example music clips to be used as playable tracks in the in-game charts. These clips will add an interactive audio layer to the gameplay, allowing players to click and play chart tracks. Each clip should be 10-20 seconds long to save on storage while still providing a representative musical sample.

## 🎵 Planning: How Many Clips Do We Need?

- **Charts System**: The in-game charts typically display a Top 10 or Top 20 each week.
- **Genres**: The game features a variety of genres (e.g., Rock, Pop, Hip-Hop, Electronic, Jazz, Country, R&B, Indie, Classical, etc.).
- **Eras**: There are 4 main eras (Analog 60s, Digital 80s, Internet 2000s, Streaming 2020s), each with distinct musical styles.
- **Variety**: To avoid repetition, each genre/era combo should have at least 2-3 unique clips.

### Calculation Example
- 10 genres × 4 eras × 3 variations = **120 clips** (minimum)
- For a richer experience, aim for 5 variations per genre/era: 10 × 4 × 5 = **200 clips**

## 📋 Prompt List Structure
- **Filename**: `era_genre_variation.mp3` (e.g., `80s_pop_01.mp3`)
- **Prompt**: Text prompt for music generation
- **Tags**: Era, genre, mood, tempo, instruments

---

## Example Prompts

### Analog 60s (1960s-1970s)
- **Rock**
  - Prompt: "A short 1960s rock band jam, live drums, electric guitar riffs, vintage bass, energetic and raw, mono tape feel."
  - Filename: `60s_rock_01.mp3`
- **Pop**
  - Prompt: "Upbeat 1960s pop tune, female vocals, tambourine, handclaps, bright piano, Motown influence."
  - Filename: `60s_pop_01.mp3`
- **Jazz**
  - Prompt: "Swinging 60s jazz combo, upright bass, brushed drums, saxophone lead, smoky club vibe."
  - Filename: `60s_jazz_01.mp3`

### Digital 80s (1980s-1990s)
- **Electronic**
  - Prompt: "1980s synthwave instrumental, analog synths, drum machine, arpeggiated bass, retro-futuristic mood."
  - Filename: `80s_electronic_01.mp3`
- **Hip-Hop**
  - Prompt: "Old-school 80s hip-hop beat, sampled drums, vinyl scratches, funky bassline, breakdance energy."
  - Filename: `80s_hiphop_01.mp3`
- **Pop**
  - Prompt: "Catchy 80s pop chorus, gated reverb drums, synth stabs, male vocals, danceable groove."
  - Filename: `80s_pop_01.mp3`

### Internet 2000s (2000s-2010s)
- **Indie**
  - Prompt: "2000s indie rock, jangly guitars, lo-fi drums, melodic bass, introspective mood."
  - Filename: `2000s_indie_01.mp3`
- **R&B**
  - Prompt: "Smooth 2000s R&B, soulful vocals, lush pads, syncopated beats, romantic vibe."
  - Filename: `2000s_rnb_01.mp3`
- **Electronic**
  - Prompt: "2000s EDM club track, sidechained synths, punchy kick, energetic build-up."
  - Filename: `2000s_electronic_01.mp3`

### Streaming 2020s (2020s+)
- **Pop**
  - Prompt: "Modern 2020s pop, autotuned vocals, trap hi-hats, deep bass, catchy hook, polished production."
  - Filename: `2020s_pop_01.mp3`
- **Hip-Hop**
  - Prompt: "2020s hip-hop, melodic rap, 808 bass, atmospheric synths, contemporary flow."
  - Filename: `2020s_hiphop_01.mp3`
- **Electronic**
  - Prompt: "2020s electronic, future bass, chopped vocals, lush synth layers, festival vibe."
  - Filename: `2020s_electronic_01.mp3`

---

## 📑 Full Prompt Table (Template)
| Era         | Genre      | Variation | Filename              | Prompt (for music generator)                                      |
|-------------|------------|-----------|-----------------------|-------------------------------------------------------------------|
| Analog 60s  | Rock       | 01        | 60s_rock_01.mp3       | A short 1960s rock band jam, live drums, electric guitar riffs...  |
| ...         | ...        | ...       | ...                   | ...                                                               |

(Expand this table for all genre/era/variation combinations as needed)

---

## 📂 Audio Directory Structure

Create the following folder for generated audio clips:

```
/workspaces/recording-studio-tycoon/src/audio/chart_clips/
```

All generated chart track clips should be saved here, named as per the filename convention above.

---

## 🛠️ Implementation Plan

1. **Generate Audio Clips**
   - Use the prompts above with a music generation tool (e.g., Suno, AIVA, Boomy, etc.)
   - Export each clip as a 10-20 second MP3, named as per the convention
   - Save all clips in `src/audio/chart_clips/`
2. **Integrate with Game**
   - Update the charts system to associate each chart entry with a genre, era, and audio clip filename
   - Add a play button to each chart entry in the UI
   - On click, play the corresponding audio clip from `src/audio/chart_clips/`
   - Optionally, show a waveform or playback animation
3. **Fallback Handling**
   - If a chart entry has no audio, show a disabled play button or a placeholder sound
4. **Performance & Storage**
   - Keep clips short (10-20s) to minimize storage and bandwidth
   - Consider lazy-loading audio files as needed
5. **Future Expansion**
   - Add more variations per genre/era as the game grows
   - Allow for user-submitted or procedurally generated tracks in the future

---

*This plan ensures a scalable, immersive audio layer for the charts system, enhancing player engagement and historical authenticity.*
