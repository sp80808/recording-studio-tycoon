# Minigame Design Document: Lyric Focus Game

1.  **Name:** Lyric Focus (Internal ID: `lyricFocus`)
2.  **Concept/Theme:**
    The player is presented with a song's theme/mood/genre and selects relevant keywords/phrases to refine the lyrical direction, aiming to improve the song's "Lyrical Quality."
3.  **Triggering Context:**
    *   During an `OriginalMusicProject`, within a "Songwriting" or "Lyrics" stage that has `minigameTriggerId: 'lyricFocus'`.
    *   Triggered automatically when such a stage begins.
4.  **Core Gameplay Loop:**
    *   **Phase 1: Theme Presentation:** Display target genre, mood, and a central theme.
    *   **Phase 2: Keyword Selection:** Player selects 5-7 keywords/phrases from a pool within a time limit (e.g., 45 seconds). The pool contains relevant, neutral, and off-theme items.
    *   **Phase 3: Evaluation:** A "Lyrical Focus Score" (0-100) is generated based on selections.
5.  **Controls:**
    *   Mouse clicks to select/deselect keyword cards.
6.  **Success/Failure Conditions:**
    *   Score-based: High score = significant lyrical quality boost; Medium = moderate boost; Low = minor/no boost. No hard failure.
7.  **Scoring/Grading:**
    *   Keywords have hidden relevance scores (e.g., Highly Relevant: +15-20, Relevant: +10, Neutral: +0-5, Off-Theme: -5).
    *   Bonus for selecting "golden" keywords.
    *   Time bonus for quick completion.
    *   Penalty for exceeding selection limit (if applicable, or just cap selections).
8.  **Impact on Game State:**
    *   Primary: Modifies `lyricalQuality` aspect of the song project.
    *   Secondary: Small XP boost for player/staff.
    *   Potential: Unlock lyrical themes for future songs on exceptional performance.
9.  **Player/Staff Skills Influence:**
    *   Relevant skills (e.g., Player's `Creative Intuition`, Staff's `Songwriting`):
        *   May highlight more relevant keywords.
        *   May provide a slightly better initial pool of keywords.
        *   May slightly increase the time limit.
        *   May apply a small bonus multiplier to the final score.
10. **Difficulty Scaling:**
    *   Project difficulty can influence:
        *   Time limit.
        *   Ratio of relevant to irrelevant keywords.
        *   Subtlety of keyword relevance.
11. **UI/UX Sketch (Conceptual):**
    *   Top: Display Genre, Mood, Theme. Timer. Score.
    *   Middle: Grid of clickable keyword cards.
    *   Bottom: Area showing currently selected keywords (e.g., "Selected Ideas: 3/7"). Feedback message area.
12. **Inspiration:** Word association, mood board creation, brainstorming tools.
