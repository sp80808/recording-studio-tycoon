export const RISING_STUDIO_MILESTONE_ID = 'rising-studio-rival-arrival';

export interface CareerCutsceneChoice {
  id: string;
  label: string;
  outcome: string;
}

export interface CareerCutscenePayload {
  title: string;
  chapter: string;
  speaker: string;
  speakerTitle: string;
  location: string;
  lines: string[];
  choices: CareerCutsceneChoice[];
}

export interface SavedCareerSnapshot {
  gameState?: {
    reputation?: number;
    playerData?: { level?: number };
  };
}

export const RISING_STUDIO_CUTSCENE: CareerCutscenePayload = {
  title: 'A Needle at the Door',
  chapter: 'Rival Encounter · Chapter I',
  speaker: 'Silas Vance',
  speakerTitle: 'The Analog High Priest · Black Wax Vault',
  location: 'Your control room · After the last client leaves',
  lines: [
    'The meters settle. Then a stranger places a hand-labelled reel on your console: BLACK WAX — MASTER 001.',
    '“You have made enough noise for the old rooms to notice. Charts forget. Tape remembers.”',
    'Silas offers no handshake. Only a challenge: define what this studio will protect before success defines it for you.',
  ],
  choices: [
    {
      id: 'protect-the-take',
      label: 'Protect the honest take',
      outcome: 'Studio creed set: artists remember that your red light is a safe place.',
    },
    {
      id: 'master-the-moment',
      label: 'Master the moment',
      outcome: 'Studio creed set: every limitation becomes part of the arrangement.',
    },
  ],
};

export function shouldTriggerRisingStudioCutscene(
  previousSave: string | null,
  currentSave: string | null,
  alreadySeen: boolean,
): boolean {
  if (alreadySeen || !currentSave || currentSave === previousSave) return false;

  try {
    const snapshot = JSON.parse(currentSave) as SavedCareerSnapshot;
    const reputation = snapshot.gameState?.reputation ?? 0;
    const level = snapshot.gameState?.playerData?.level ?? 0;
    return reputation >= 25 || level >= 3;
  } catch {
    return false;
  }
}
