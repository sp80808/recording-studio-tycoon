import { useContentLocale, tc } from '@/i18n/content';
import { renderDebrief, type DebriefLine } from '@/minigames/debriefs';

/** Quiet, skippable engineer's note under a minigame result. Collapses with one tap; renders nothing when empty. */
export const MinigameDebrief = ({ lines }: { lines: readonly DebriefLine[] }) => {
  useContentLocale();
  if (!lines.length) return null;
  return (
    <details open className="mt-2 rounded-md border border-stone-700/60 bg-stone-950/40 px-3 py-2 text-left text-[11px] text-stone-300">
      <summary className="cursor-pointer select-none text-stone-400">{tc('mg.debrief.title', "Engineer's notes")}</summary>
      <ul className="mt-1 space-y-1">
        {renderDebrief(lines).map((text, i) => (
          <li key={lines[i].key}>{text}</li>
        ))}
      </ul>
    </details>
  );
};
