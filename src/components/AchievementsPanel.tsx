import { useMemo, useState } from 'react';
import {
  Award, BadgeCheck, Banknote, Building2, ChevronDown, Crown, Disc3, DoorOpen, Ear, Feather, Handshake,
  Headphones, Hourglass, Landmark, Library, Lock, Music2, PiggyBank, Repeat, ScrollText, Shapes,
  SlidersHorizontal, Split, Swords, ThumbsUp, Trophy, UserPlus, Users, type LucideIcon,
} from 'lucide-react';
import type { GameState } from '@/types/game';
import {
  ACHIEVEMENTS,
  countUnlocked,
  type AchievementCategory,
  type AchievementDef,
  type AchievementTier,
} from '@/narrative/achievements';
import { gameAudio } from '@/utils/audioSystem';

const ICONS: Record<string, LucideIcon> = {
  Award, BadgeCheck, Banknote, Building2, Crown, Disc3, DoorOpen, Ear, Feather, Handshake, Headphones, Hourglass,
  Landmark, Library, Music2, PiggyBank, Repeat, ScrollText, Shapes, SlidersHorizontal, Split, Swords, ThumbsUp,
  Trophy, UserPlus, Users,
};

const TIER_STYLE: Record<AchievementTier, { ring: string; text: string; label: string }> = {
  bronze: { ring: 'rgba(196,132,84,0.55)', text: '#d9a273', label: 'Bronze' },
  silver: { ring: 'rgba(200,205,214,0.5)', text: '#d5d9e0', label: 'Silver' },
  gold: { ring: 'rgba(230,184,102,0.75)', text: 'var(--rst-brass-200)', label: 'Gold' },
};

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  craft: 'Craft',
  business: 'Business',
  studio: 'Studio',
  story: 'Story',
};

const CATEGORIES: AchievementCategory[] = ['craft', 'business', 'studio', 'story'];

function Tile({ def, earnedDay, state }: { def: AchievementDef; earnedDay?: number; state: GameState }) {
  const earned = earnedDay !== undefined;
  const Icon = ICONS[def.icon] ?? Award;
  const tier = TIER_STYLE[def.tier];
  const progress = !earned ? def.progress?.(state) : undefined;
  const hiddenLocked = def.hidden && !earned;
  return (
    <li
      className="flex items-start gap-3 rounded-xl border p-3"
      style={{
        borderColor: earned ? tier.ring : 'var(--rst-line)',
        background: earned ? 'rgba(230,184,102,0.05)' : 'rgba(0,0,0,0.18)',
        opacity: earned ? 1 : 0.72,
      }}
      data-earned={earned ? 'true' : 'false'}
    >
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border"
        style={{ borderColor: earned ? tier.ring : 'var(--rst-line-strong)', color: earned ? tier.text : 'var(--rst-ivory-soft)' }}
      >
        {hiddenLocked ? <Lock size={16} /> : <Icon size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--rst-ivory)]">
          <span className="truncate">{hiddenLocked ? '???' : def.title}</span>
          <span className="rst-kicker !text-[9px]" style={{ color: tier.text }}>{tier.label}</span>
        </p>
        <p className="rst-muted mt-0.5 text-xs leading-relaxed">{hiddenLocked ? 'Keep telling the studio’s story to find this one.' : def.description}</p>
        {earned ? (
          <p className="mt-1 text-[11px] tabular-nums text-[var(--rst-money)]">Earned on day {earnedDay}</p>
        ) : (
          progress && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.target}
                aria-valuenow={progress.current}
                aria-label={`${def.title} progress`}
              >
                <span className="block h-full rounded-full bg-[var(--rst-brass-400)]" style={{ width: `${(progress.current / progress.target) * 100}%` }} />
              </span>
              <span className="text-[11px] tabular-nums text-stone-400">
                {progress.target >= 1000 ? `$${progress.current.toLocaleString()}` : progress.current}
                {' / '}
                {progress.target >= 1000 ? `$${progress.target.toLocaleString()}` : progress.target}
              </span>
            </div>
          )
        )}
      </div>
    </li>
  );
}

/** Trophy case — collapsible so the career tab stays calm, but the count is always visible. */
export function AchievementsPanel({ gameState }: { gameState: GameState }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AchievementCategory | 'all'>('all');
  const unlocked = countUnlocked(gameState);
  const earned = gameState.unlockedAchievements ?? {};

  const visible = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => category === 'all' || a.category === category).sort((a, b) => {
        const ea = a.id in earned ? 0 : 1;
        const eb = b.id in earned ? 0 : 1;
        return ea - eb;
      }),
    [category, earned],
  );

  return (
    <section className="rst-surface overflow-hidden text-xs" aria-label="Trophies">
      <button
        type="button"
        onClick={() => {
          void gameAudio.playClick().catch(() => {});
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <Trophy size={18} className="shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="rst-kicker block">Trophies</span>
          <span className="rst-title mt-0.5 block text-base">
            {unlocked} <span className="text-stone-500">/ {ACHIEVEMENTS.length}</span> earned
          </span>
        </span>
        <span
          className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <span className="block h-full rounded-full bg-[var(--rst-brass-400)]" style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }} />
        </span>
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-[var(--rst-brass-300)]' : 'text-stone-500'}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="space-y-3 border-t border-[var(--rst-line)] bg-black/20 p-4 animate-rst-rise">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Trophy category">
            {(['all', ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={`rst-chip cursor-pointer ${category === c ? 'rst-chip-brass' : ''}`}
              >
                {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <ul className="grid gap-2">
            {visible.map((def) => (
              <Tile key={def.id} def={def} earnedDay={earned[def.id]} state={gameState} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
