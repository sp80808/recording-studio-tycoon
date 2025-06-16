export type GenreId = string;
export type SubGenreId = string;
export type EntityId = string; // For clients, labels, artists etc.
export type SkillId = string;
export type ProjectId = string;
export type MoodId = string; // Assuming a mood system exists or will be added

// Example of a basic GameState, to be expanded as needed
export interface GameState {
    time: number; // Current game time (e.g., days, weeks)
    studioReputation: number;
    completedProjects: Array<{ projectId: ProjectId; genreId: GenreId; subGenreId?: SubGenreId; quality: number }>;
    staff: Array<{ id: string; skills: Map<SkillId, number> }>;
    // ... other global game state properties
}
