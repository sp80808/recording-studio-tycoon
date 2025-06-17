# Pollinations.AI (PolAI) API Integration Plan for Recording Studio Tycoon

## 1. Introduction

This document details the strategy for integrating the Pollinations.AI (PolAI) API into the "Recording Studio Tycoon" game. The goal is to leverage PolAI's generative capabilities (image, text, audio) to enhance player creativity, game dynamism, and overall immersion. This plan complements other AI integrations, such as the Suno API for music generation.

## 2. Goals of PolAI Integration

*   **Enhance Creative Expression:** Provide players with tools to generate unique visual assets (e.g., album art, band logos).
*   **Increase Game Dynamism:** Introduce AI-generated content for news, reviews, NPC dialogue, and event descriptions to make the game world feel more alive and less repetitive.
*   **Improve Immersion:** Utilize AI-generated text and potentially voice to create a richer narrative and interactive experience.
*   **Accessibility:** Explore TTS for enhancing accessibility.

## 3. Key PolAI API Capabilities to Leverage

*   **Image Generation API (`https://image.pollinations.ai/prompt/...`)**:
    *   Text-to-Image generation.
    *   Parameters: `prompt`, `model`, `seed`, `width`, `height`, `nologo`, `private`, `enhance`, `safe`, `transparent`.
*   **Text Generation API (`https://text.pollinations.ai/...` or `POST https://text.pollinations.ai/openai`)**:
    *   Simple GET endpoint for basic text generation.
    *   OpenAI-compatible POST endpoint for advanced chat, vision (image input), speech-to-text, and function calling.
    *   Parameters: `prompt`, `model`, `seed`, `temperature`, `system` (for system prompts), `json`, `stream`, `private`.
*   **Audio Generation API (Text-to-Speech - `model=openai-audio`)**:
    *   GET endpoint for short TTS: `https://text.pollinations.ai/{prompt}?model=openai-audio&voice={voice}`.
    *   POST endpoint (via `/openai`) for longer TTS, returning base64 audio.
    *   Voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`.
*   **React Hooks (`@pollinations/react`)**:
    *   `usePollinationsImage`, `usePollinationsText`, `usePollinationsChat` for easier frontend integration.

## 4. Proposed Integration Points

### 4.1. Image Generation

#### 4.1.1. Album Art Generation
*   **Description:** Players can generate unique album art for their band's releases.
*   **API Endpoint:** `GET https://image.pollinations.ai/prompt/{prompt}`
*   **Key Parameters:** `prompt`, `width=512`, `height=512` (or other square dimensions suitable for album art), `nologo=true`, `private=true`, `enhance=true` (optional, for better prompts), `safe=true`.
*   **UI/UX:**
    *   Button: "Generate AI Album Art" in the release finalization screen.
    *   Input: Text area for prompt, potentially with suggestions or keyword pickers (e.g., genre, mood, style).
    *   Display: Shows the generated image. Options to "Re-roll" (new seed or modified prompt) or "Accept".
    *   Loading state during generation.
*   **Prompt Strategy:** Combine game context (genre, era, band name, song themes) with player input.
    *   Example: `"[Genre] album cover for [Band Name], theme: [Song Theme], style: [Artistic Style e.g., '80s synthwave', 'photorealistic', 'abstract']"`
*   **Data Flow (Mermaid):**
    ```mermaid
    sequenceDiagram
        participant Player
        participant GameUI_ReleaseScreen as Release Screen
        participant PolAIService as PolAI Service (Client-Side)
        participant PolAI_ImageAPI as PolAI Image API

        Player->>GameUI_ReleaseScreen: Enters prompt / Clicks "Generate Art"
        GameUI_ReleaseScreen->>PolAIService: generateAlbumArt(prompt, options)
        PolAIService->>PolAI_ImageAPI: GET /prompt/{encoded_prompt}?params...
        PolAI_ImageAPI-->>PolAIService: Image Data (URL or Blob)
        PolAIService-->>GameUI_ReleaseScreen: Displays Image
        Player->>GameUI_ReleaseScreen: Accepts or Re-rolls
    ```

#### 4.1.2. Band Logo Generation
*   **Description:** Players generate a logo for their band.
*   **API Endpoint:** `GET https://image.pollinations.ai/prompt/{prompt}`
*   **Key Parameters:** `prompt`, `width=512`, `height=512`, `nologo=true`, `private=true`, `safe=true`, `transparent=true` (if using a model like `gptimage` that supports it effectively).
*   **UI/UX:** Similar to album art, located in the band management/creation screen.
*   **Prompt Strategy:** `"[Band Name] band logo, [Style e.g., 'minimalist text logo', 'graffiti style', 'vintage rock emblem']"`

#### 4.1.3. Dynamic Event/News Images
*   **Description:** Illustrative images for in-game news, event pop-ups.
*   **API Endpoint:** `GET https://image.pollinations.ai/prompt/{prompt}`
*   **Key Parameters:** `prompt`, `width=800`, `height=450` (16:9 aspect ratio), `nologo=true`, `private=true`, `safe=true`.
*   **Implementation:** Generated procedurally when an event triggers. Prompts would be predefined based on event type.
    *   Example: Event "New Signing" -> Prompt: `"Illustration of a band signing a record contract in a modern office, hopeful atmosphere"`

### 4.2. Text Generation

#### 4.2.1. Dynamic NPC & Client Dialogue
*   **Description:** Varied and context-aware dialogue.
*   **API Endpoint:** `POST https://text.pollinations.ai/openai` (for chat completions)
*   **Key Parameters:** `model` (e.g., `openai`, `mistral`), `messages` (with system prompt defining personality and user prompt providing context), `temperature` (for variability).
*   **Implementation:**
    *   System Prompt Example: `"You are a cynical record label executive from the 80s. You are talking to a new band. Current year is [GameYear]. Popular genre is [PopularGenre]."`
    *   User Prompt Example (internal): `"The band [BandName] is pitching their new [Genre] song. Respond to their pitch."`

#### 4.2.2. In-Game News, Reviews, Social Media
*   **Description:** Dynamic news articles, music reviews, simulated social media.
*   **API Endpoint:** `POST https://text.pollinations.ai/openai`
*   **Implementation (Review Example):**
    *   System Prompt: `"You are a music critic. Write a short, insightful review."`
    *   User Prompt: `"Review the song '[SongTitle]' by [BandName]. It's a [Genre] track released in [Year]. It achieved [ChartPosition] and has [QualityScore]/100 quality. Focus on its [PositiveTrait] and [NegativeTrait if any]."`

#### 4.2.3. Creative Writing Assistance (Lyrics, Bios)
*   **Description:** Assist players with lyrical themes, keywords, or band bios.
*   **API Endpoint:** `POST https://text.pollinations.ai/openai`
*   **UI/UX (Lyrics):** "Suggest Lyrical Themes" button. Input: Genre, Mood. Output: List of themes/keywords.
    *   User Prompt: `"Suggest 5 lyrical themes for a [Genre] song with a [Mood] mood."`

#### 4.2.4. Dynamic Project Briefs
*   **Description:** More creative contract project descriptions.
*   **API Endpoint:** `GET https://text.pollinations.ai/{prompt}` (for simpler, one-off descriptions)
*   **Implementation:** When generating new contract projects, use a base template and inject AI-generated flavor text.
    *   Prompt: `"Write a short, quirky client request for a jingle for a new brand of [ProductType] cereal. The style should be [Adjective]."`

### 4.3. Audio Generation (Text-to-Speech)

#### 4.3.1. In-Game Announcer / Notifications
*   **Description:** TTS for important announcements or tutorial prompts.
*   **API Endpoints:**
    *   Short: `GET https://text.pollinations.ai/{prompt}?model=openai-audio&voice={voice}`
    *   Longer: `POST https://text.pollinations.ai/openai` (with `model: "openai-audio"`, `voice` in body)
*   **UI/UX:** Audio plays alongside visual notifications. Player can select announcer voice preference.

#### 4.3.2. Accessibility Feature (Screen Reader)
*   **Description:** Option to read out UI text, event descriptions, tutorials.
*   **API Endpoint:** `POST https://text.pollinations.ai/openai` (for longer texts)
*   **Implementation:** A toggle in settings. When active, relevant text elements can be sent to the TTS API.

## 5. Technical Implementation Strategy

*   **API Interaction:**
    *   Prioritize using `@pollinations/react` hooks for frontend features (Image/Text generation) for simplicity.
    *   Direct API calls (using `fetch` or a library like `axios`) for features not covered by hooks or requiring more control (e.g., TTS POST).
*   **Service Layer (Client-Side):**
    *   Consider creating a `src/services/polAiService.ts` to encapsulate API call logic, prompt construction, and error handling, even if initially thin. This centralizes interaction and makes future backend proxying easier if needed.
    ```typescript
    // src/services/polAiService.ts (Conceptual)
    const IMAGE_API_BASE = "https://image.pollinations.ai/prompt/";
    const TEXT_API_OPENAI = "https://text.pollinations.ai/openai";

    interface PolAiImageOptions {
        width?: number;
        height?: number;
        model?: string;
        seed?: number;
        nologo?: boolean;
        private?: boolean;
        enhance?: boolean;
        safe?: boolean;
        transparent?: boolean;
        referrer?: string; // Should be set globally or per app instance
    }

    // ... more interfaces for text/audio

    class PolAiService {
        private referrer = "RecordingStudioTycoon_Alpha"; // Example

        async generateImage(prompt: string, options: PolAiImageOptions = {}): Promise<string | null> {
            const queryParams = new URLSearchParams();
            if (options.width) queryParams.append('width', options.width.toString());
            // ... other options
            queryParams.append('nologo', (options.nologo ?? true).toString());
            queryParams.append('private', (options.private ?? true).toString());
            queryParams.append('safe', (options.safe ?? true).toString());
            queryParams.append('referrer', this.referrer);

            const encodedPrompt = encodeURIComponent(prompt);
            const url = `${IMAGE_API_BASE}${encodedPrompt}?${queryParams.toString()}`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error("PolAI Image Error:", response.status, await response.text());
                    return null;
                }
                const blob = await response.blob();
                return URL.createObjectURL(blob); // For displaying in <img>
            } catch (error) {
                console.error("PolAI Image Fetch Error:", error);
                return null;
            }
        }

        // ... methods for text and audio generation
    }

    export const polAiService = new PolAiService();
    ```
*   **State Management:** Integrate with `useGameState` and other relevant custom hooks. API call results will update the game state, triggering UI re-renders.
*   **User Experience:**
    *   Consistent loading indicators (spinners, progress messages).
    *   Clear error messages if API calls fail (e.g., "Could not generate art. Please try again.").
    *   "Re-roll" or "Try again" options for generative features.
*   **Prompt Engineering:** Store base prompt templates and dynamically insert game context variables.
*   **Authentication:**
    *   Primarily rely on referrer-based authentication for frontend calls. Register the game's domain/identifier at `auth.pollinations.ai`.
    *   The `referrer` parameter should be consistently included in API calls.

## 6. Cost and Rate Limit Management

*   **Monitoring:** Initially, operate within free/low-cost tiers. Monitor API usage frequency.
*   **Client-Side Throttling:** Implement debouncing/throttling for user-triggered generative actions to prevent accidental spamming of API calls.
*   **Caching:**
    *   For generated images (album art, logos), cache the resulting image URL or blob locally (e.g., in `localStorage` or `IndexedDB` for a session, or associate with the specific game entity like a Release).
    *   For less dynamic generated text (e.g., a specific news article for an event), it can be stored as part of the event data once generated.

## 7. Prioritization and Phased Rollout

*   **Phase 1 (High Impact, Core Creative):**
    1.  Album Art Generation.
    2.  Dynamic News/Reviews (Text Generation).
*   **Phase 2 (Enhancements & Immersion):**
    1.  Band Logo Generation.
    2.  Creative Writing Assistance (Lyrics).
    3.  TTS for Announcer/Notifications.
*   **Phase 3 (Further Polish & Advanced):**
    1.  Dynamic NPC Dialogue.
    2.  Dynamic Event Images.
    3.  Accessibility TTS.

## 8. Document Updates

*   This document (`docs/POLAI_API_INTEGRATION_PLAN.md`) serves as the primary plan.
*   `tasks/tasks_plan.md`: Add specific tasks for each prioritized feature.
*   `docs/architecture.md`: Update if a significant `PolAiService` or related modules are added.
*   `docs/cline_docs/techStack.md`: Add PolAI API and `@pollinations/react` if used.
*   `docs/cline_docs/codebaseSummary.md`: Summarize new components/services related to PolAI.

This detailed plan provides a roadmap for integrating PolAI into Recording Studio Tycoon, aiming to create a more engaging and creative experience for players.
