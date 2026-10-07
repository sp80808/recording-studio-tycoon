/** Board-face copy for the pinned story contract (#334): who is watching, and what the locked stake means.
 * Pure data over existing rival cast + stake terms; no new campaign system.
 */
import { tc } from '@/i18n/content';
import { describeStake, isStakeUnlocked, STAKE_LABEL, describeStakeUnlock, type ContractStake } from '@/rpg/contractStakes';
import type { RivalStudio } from './studioLore';

const STAKE_STORY_MEANING: Record<ContractStake, string> = {
  safe: 'Prove-it session — finish clean; the rival is scouting, not swinging.',
  ambitious: 'Challenge cut — A-rank earns respect; a miss costs reputation.',
  moonshot: 'Last-word master — S-rank or the rival owns the story.',
};

export interface StoryContractBrief {
  /** "The Distortion Cellar is watching" */
  watching: string;
  /** "Roxy Riot — The Sonic Saboteur. “Turn it up…”" */
  voice: string;
  stakeKicker: string;
  stakeLabel: string;
  stakeMeaning: string;
  /** Mechanical terms from describeStake (fee multiplier, rank bar, rep cost). */
  stakeTerms: string;
  /** Present only when the player's level is below the stake's normal unlock. */
  unlockNote?: string;
}

export const buildStoryContractBrief = (rival: RivalStudio, stake: ContractStake, playerLevel: number): StoryContractBrief => {
  const label = STAKE_LABEL[stake];
  return {
    watching: tc('story.brief.watching', '{{rival}} is watching', { rival: rival.name }),
    voice: tc('story.brief.voice', '{{producer}} — {{epithet}}. “{{catchphrase}}”', {
      producer: rival.headProducer,
      epithet: rival.epithet,
      catchphrase: rival.catchphrase,
    }),
    stakeKicker: tc('story.brief.stake', 'Stake: {{label}}', { label }),
    stakeLabel: label,
    stakeMeaning: tc(`story.stake.${stake}`, STAKE_STORY_MEANING[stake]),
    stakeTerms: describeStake(stake),
    unlockNote: isStakeUnlocked(stake, playerLevel)
      ? undefined
      : tc('story.stake.unlockNote', '{{unlock}} — the story fixes it for this gig.', { unlock: describeStakeUnlock(stake) }),
  };
};
