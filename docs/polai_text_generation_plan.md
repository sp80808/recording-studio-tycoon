# PolAI Text Generation Integration Plan

## 1. Solution Overview

We will:
- Extend the existing `PolAiService` to support text generation via the Pollinations.AI API.
- Implement a modular system for requesting, caching, and displaying AI-generated text for:
  - **Album/Song Reviews**
  - **Dynamic In-Game News**
  - **Band Member Bios**
  - **Album/Song/Equipment Descriptions**
- Integrate these features into the relevant UI panels and systems.
- Update documentation and task plans accordingly.

---

## 2. Step-by-Step Implementation Plan

### A. Extend PolAiService for Text Generation
- Add a method to `PolAiService` for making text generation requests.
- Support prompt customization (e.g., for reviews, news, bios).
- Implement error handling and response parsing.

**Example API Call:**
- Endpoint: `https://api.pollinations.ai/text`
- Payload: `{ prompt: "Write a music review for a synthwave album called 'Neon Nights'." }`

### B. Create TextGenerationManager
- Centralized manager for requesting, caching, and distributing generated text.
- Responsibilities:
  - Request text from `PolAiService` with the appropriate prompt.
  - Cache results to avoid redundant API calls.
  - Provide methods for each use case (getReview, getNews, getBio, getDescription).

### C. UI Integration
- **Reviews:**
  - Add a reviews section to album/song info panels.
  - Display generated reviews, with a "Generate New Review" button.
- **News:**
  - Add a news feed panel (e.g., in the main menu or dashboard).
  - Display generated news headlines and blurbs.
- **Bios:**
  - Add bios to band member info panels.
  - Option to re-generate or edit bios.
- **Descriptions:**
  - Add descriptions to albums, songs, and equipment info panels.

### D. Prompt Engineering
- Design prompt templates for each use case, e.g.:
  - **Review:**
    `"Write a short, enthusiastic music review for the album '{albumName}' by {bandName}, in the {genre} genre."`
  - **News:**
    `"Write a news headline and short article about {bandName} releasing a new album called '{albumName}'."`
  - **Bio:**
    `"Write a creative biography for a {role} named {memberName} in a {genre} band."`
  - **Description:**
    `"Describe the {itemType} '{itemName}' used in a professional recording studio."`

### E. Documentation & Task Plan Updates
- Update `docs/architecture.md`, `docs/technical.md`, and `tasks/active_context.md` to reflect the new text generation features and integration points.

---

## 3. Trade-offs & Considerations

- **API Usage:** Implement caching and rate limiting to avoid excessive API calls.
- **User Experience:** Provide loading indicators and error messages for failed requests.
- **Extensibility:** Design the system so new text-based features can be added easily.

---

## 4. Next Steps (Execution Plan)

1. Extend PolAiService with a `GenerateTextAsync(string prompt)` method.
2. Implement TextGenerationManager with methods for each use case.
3. Integrate with UI for reviews, news, bios, and descriptions.
4. Update documentation and task plans.
5. Test all new features for robustness and user experience.

---

## 5. Future Enhancements

- Add support for user-editable AI-generated text.
- Allow players to "publish" or "share" generated news/reviews in-game.
- Use AI-generated text for dynamic event scripting or storylines. 