/**
 * Patch-time learning (issue #289 steps 4 and 5, building on #306 concept tags).
 * Pure and deterministic: a short real-recording line for the jack the player just patched
 * (why this link sits where it does in the chain), and the single best-fit gear per jack
 * for a quiet "crew favourite" glow. No target values or scores are exposed.
 */
import type { GameState, StaffMember } from '@/types/game';
import type { ProjectBrief } from '@/rpg/projectBrief';
import {
  SIGNAL_SLOTS,
  availableForSlot,
  evaluateChain,
  type SignalChain,
  type SignalSlot,
} from '@/rpg/signalChain';

/** English fallback; `public/locales/<lng>/content.json` holds the same ids. */
export const PATCH_LESSON_TEXT: Record<SignalSlot, string> = {
  microphone: 'The mic is first in the chain for a reason: nothing downstream can add detail it never heard, so the capsule and its placement set the ceiling.',
  preamp: 'The preamp comes right after the mic because a mic signal is tiny. Lifting it early keeps it well above the noise of every later stage.',
  dynamics: 'Compression after the preamp tames peaks once the signal is healthy, so the recorder is not hit by sudden spikes and the vocal stays even.',
  recorderInterface: 'The recorder comes last: it prints whatever arrives. Leave a little headroom so a loud take never clips.',
};

export const patchLessonId = (slot: SignalSlot): string => `chain.learn.${slot}`;

export const patchLesson = (slot: SignalSlot): { id: string; english: string } => ({
  id: patchLessonId(slot),
  english: PATCH_LESSON_TEXT[slot],
});

/**
 * Best-fit free gear for one jack given what is already patched elsewhere.
 * Same evaluator as Quick fill; ties break by condition then id so it never flickers.
 * Returns undefined when there is no clear favourite (fewer than two options, or a dead heat).
 */
export function suggestedGearForSlot(
  slot: SignalSlot,
  chain: SignalChain,
  state: Pick<GameState, 'ownedEquipment' | 'activeProject' | 'activeProjects'>,
  staff: StaffMember[],
  brief: Pick<ProjectBrief, 'direction' | 'priority' | 'genre'>,
  exceptProjectId?: string,
): string | undefined {
  const taken = new Set(
    SIGNAL_SLOTS.filter((s) => s !== slot).map((s) => chain.slots[s]).filter((id): id is string => Boolean(id)),
  );
  const candidates = availableForSlot(state, slot, exceptProjectId).filter((e) => !taken.has(e.id));
  if (candidates.length < 2) return undefined; // a lone choice is not a recommendation
  const scored = candidates.map((e) => ({
    e,
    score: evaluateChain({ ...chain, slots: { ...chain.slots, [slot]: e.id } }, state, staff, brief).compatibility,
  }));
  scored.sort((a, b) => b.score - a.score || (b.e.condition ?? 100) - (a.e.condition ?? 100) || a.e.id.localeCompare(b.e.id));
  if (scored[0].score === scored[1].score && (scored[0].e.condition ?? 100) === (scored[1].e.condition ?? 100)) return undefined;
  return scored[0].e.id;
}
