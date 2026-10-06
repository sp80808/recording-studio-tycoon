/**
 * Career story rewards (#259 slice 4): earned titles and cosmetic/furnishing provenance.
 *
 * Pure and read-only. Titles are derived from the same milestones as the chronicle, so nothing new is persisted and
 * legacy saves with sparse history simply earn none. Cosmetic data is read from studioCustomization.ts, never written.
 * Lives in its own module because studioCustomization imports careerChronicle (avoids an import cycle).
 */
import type { GameState } from '@/types/game';
import { deriveCareerMilestones, type CareerMilestone } from '@/utils/careerChronicle';
import { getCustomization, getProvenance, isItemUnlocked, PRODUCER_COSMETICS, STUDIO_FURNISHINGS } from '@/rpg/studioCustomization';

type RewardState = Parameters<typeof deriveCareerMilestones>[0] & Partial<Pick<GameState, 'studioCustomization'>>;

/** Title earned by each milestone id. The milestone id doubles as the i18n key suffix (career_title_<id>). */
export const MILESTONE_TITLES: Record<string, string> = {
  'first-paid-session': 'Paid Professional',
  'first-repeat-client': 'Worth Rebooking',
  'first-poor-session': 'Battle-Scarred',
  'first-loyal-client': 'Keeper of Regulars',
  'first-story-choice': 'Decisive',
  'first-staff-hire': 'Bandleader',
  'first-room-added': 'Multi-Room Operator',
  'first-premises-move': 'Out of the Bedroom',
  'first-charting-release': 'Chart Maker',
};

export interface EarnedTitle {
  /** Milestone id that earned it. */
  id: string;
  title: string;
  /** What earned it, in the milestone's own words. */
  because: string;
}

/** Earned titles in rough career order. The last one is the player's current title. */
export const deriveEarnedTitles = (state: RewardState): EarnedTitle[] =>
  deriveCareerMilestones(state)
    .filter((m) => MILESTONE_TITLES[m.id])
    .map((m) => ({ id: m.id, title: MILESTONE_TITLES[m.id], because: m.title }));

export const currentEarnedTitle = (state: RewardState): EarnedTitle | null => {
  const all = deriveEarnedTitles(state);
  return all[all.length - 1] ?? null;
};

export interface Keepsake {
  itemId: string;
  name: string;
  kind: 'furnishing' | 'cosmetic';
  milestoneId: string;
  /** One-line "why you have this", e.g. "First paid session: Demo brought in the first real money." */
  provenance: string;
}

/**
 * Furnishings and producer cosmetics the story has earned, with provenance. Recorded provenance wins (it is what the
 * player saw at unlock time); otherwise it is rebuilt from the live milestone. Items whose milestone is still ahead are omitted.
 */
export const deriveKeepsakes = (state: RewardState): Keepsake[] => {
  const milestones = new Map<string, CareerMilestone>(deriveCareerMilestones(state).map((m) => [m.id, m]));
  const cust = getCustomization(state);
  const out: Keepsake[] = [];
  const add = (kind: Keepsake['kind'], item: { id: string; name: string; unlock: { kind: string; milestoneId?: string } }) => {
    if (item.unlock.kind !== 'milestone' || !item.unlock.milestoneId) return;
    const m = milestones.get(item.unlock.milestoneId);
    if (!m && !isItemUnlocked(cust, item.id)) return;
    out.push({
      itemId: item.id,
      name: item.name,
      kind,
      milestoneId: item.unlock.milestoneId,
      provenance: getProvenance(cust, item.id) ?? (m ? `${m.title}: ${m.detail}` : item.name),
    });
  };
  for (const f of STUDIO_FURNISHINGS) add('furnishing', f);
  for (const c of PRODUCER_COSMETICS) add('cosmetic', c);
  return out;
};
