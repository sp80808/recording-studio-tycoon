import { money, signedMoney } from '@/utils/displayMoney';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Coins, Lock, Sparkles, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { gameAudio } from '@/utils/audioSystem';

export interface DecisionOption {
  id: string;
  label: string;
  flavorText: string;
  /** Small tag on the card ("purist", "hit-maker"…). */
  tag?: string;
  moneyDelta: number;
  repDelta: number;
  xpDelta?: number;
  /** False when the option's cost can't be paid — the card is disabled and says why. */
  affordable: boolean;
  /** Revealed after the player commits. */
  outcome: string;
}

export interface DecisionSpeaker {
  name: string;
  initials: string;
  accent: string;
  line: string;
}

export interface DecisionContent {
  /** Stable key — when it changes the modal resets its selection. */
  key: string;
  kicker: string;
  badge: string;
  title: string;
  context: string;
  prompt: string;
  speaker?: DecisionSpeaker;
  /** Optional scene drawn under the title (cutscene card). */
  illustration?: React.ReactNode;
  options: DecisionOption[];
}

interface StoryDecisionModalProps {
  /** Live content from the game state; null when nothing is pending. */
  content: DecisionContent | null;
  /** Parent gate (no overlapping modals, dismissed-for-now, etc.). */
  open: boolean;
  commitLabel?: string;
  continueLabel?: string;
  /** Player picked and committed an option. State should be updated here. */
  onCommit: (optionId: string) => void;
  /** "Decide later" — the decision stays pending. */
  onDeferred: () => void;
  /** Outcome screen dismissed. */
  onDone?: () => void;
}

export const ConsequenceChips: React.FC<{ option: Pick<DecisionOption, 'moneyDelta' | 'repDelta' | 'xpDelta'> }> = ({ option }) => {
  const { t } = useTranslation();
  const { moneyDelta, repDelta, xpDelta } = option;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {moneyDelta !== 0 && (
        <span className={`rst-chip ${moneyDelta > 0 ? 'rst-chip-money' : 'rst-chip-danger'}`}>
          <Coins size={12} aria-hidden="true" />
          {signedMoney(moneyDelta)}
        </span>
      )}
      {repDelta !== 0 && (
        <span className={`rst-chip ${repDelta > 0 ? 'rst-chip-brass' : 'rst-chip-danger'}`}>
          <Star size={12} aria-hidden="true" />
          {repDelta > 0 ? `+${repDelta} Rep` : `−${Math.abs(repDelta)} Rep`}
        </span>
      )}
      {!!xpDelta && (
        <span className="rst-chip rst-chip-live">
          <Sparkles size={12} aria-hidden="true" />
          +{xpDelta} XP
        </span>
      )}
      {moneyDelta === 0 && repDelta === 0 && !xpDelta && <span className="rst-chip">{t('story_no_cost')}</span>}
    </div>
  );
};

/**
 * One decision popup for every story beat — campaign crossroads and emergent subplots alike.
 * Select → commit (so a stray click can't lock in a story path) → outcome screen.
 * Content is captured at commit time so the outcome survives the state moving on underneath it.
 */
export const StoryDecisionModal: React.FC<StoryDecisionModalProps> = ({
  content,
  open,
  commitLabel,
  continueLabel,
  onCommit,
  onDeferred,
  onDone,
}) => {
  const { t } = useTranslation();
  const commitText = commitLabel ?? t('event_commit');
  const continueText = continueLabel ?? t('story_continue');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{ content: DecisionContent; option: DecisionOption } | null>(null);
  const contentKey = content?.key;
  const commitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [contentKey]);

  const shown = resolved?.content ?? content;
  const isOpen = Boolean(resolved) || (open && Boolean(content));

  const select = useCallback(
    (option: DecisionOption) => {
      if (!option.affordable) return;
      setSelectedId(option.id);
      void gameAudio.playUISound('notice').catch(() => {});
    },
    [],
  );

  const commit = useCallback(() => {
    if (!content || !selectedId) return;
    const option = content.options.find((o) => o.id === selectedId);
    if (!option || !option.affordable) return;
    setResolved({ content, option });
    onCommit(option.id);
    void gameAudio.playUISound('success').catch(() => {});
  }, [content, selectedId, onCommit]);

  const finish = useCallback(() => {
    setResolved(null);
    setSelectedId(null);
    onDone?.();
  }, [onDone]);

  // 1–4 select an option, Enter commits / continues.
  useEffect(() => {
    if (!isOpen || !shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (resolved) {
        if (e.key === 'Enter') { e.preventDefault(); finish(); }
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= shown.options.length) {
        e.preventDefault();
        select(shown.options[n - 1]);
      } else if (e.key === 'Enter' && selectedId) {
        e.preventDefault();
        commit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shown, resolved, selectedId, select, commit, finish]);

  if (!shown) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (next) return;
        if (resolved) finish();
        else onDeferred();
      }}
    >
      <DialogContent className="max-w-xl" data-testid="story-decision-modal">
        <div className="flex flex-wrap items-center gap-2 pr-9">
          <p className="rst-kicker text-[var(--rst-story)]">{shown.kicker}</p>
          <span className="rst-chip rst-chip-story ml-auto">{shown.badge}</span>
        </div>

        <DialogTitle className="text-2xl">{shown.title}</DialogTitle>

        {shown.illustration}

        {shown.speaker && !resolved && (
          <figure className="flex items-start gap-3 rounded-xl border border-[var(--rst-line)] bg-[var(--rst-fill-1)] p-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-bold"
              style={{ borderColor: shown.speaker.accent, color: shown.speaker.accent }}
            >
              {shown.speaker.initials}
            </span>
            <figcaption className="min-w-0">
              <span className="rst-kicker" style={{ color: shown.speaker.accent }}>{shown.speaker.name}</span>
              <p className="mt-0.5 font-[var(--rst-serif)] text-sm italic leading-relaxed text-[var(--rst-ivory)]">{shown.speaker.line}</p>
            </figcaption>
          </figure>
        )}

        {resolved ? (
          <div className="grid gap-4 rst-enter" aria-live="polite">
            <div className="rounded-xl border border-[var(--rst-brass-line)] bg-[var(--rst-brass-fill)] p-4">
              <p className="rst-kicker flex items-center gap-1.5 text-[var(--rst-brass-300)]">
                <Check size={13} aria-hidden="true" /> You chose
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--rst-ivory)]">{resolved.option.label}</p>
              <DialogDescription className="mt-2 text-[var(--rst-ivory-soft)]">{resolved.option.outcome}</DialogDescription>
              <div className="mt-3"><ConsequenceChips option={resolved.option} /></div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="rst-btn rst-btn-primary" onClick={finish} autoFocus>
                {continueText} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <DialogDescription className="rst-body">{shown.context}</DialogDescription>
            <div className="grid gap-2.5 rst-enter" role="group" aria-label={shown.prompt}>
              <p className="rst-kicker">{shown.prompt}</p>
              {shown.options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className="rst-option text-left"
                  aria-pressed={selectedId === option.id}
                  disabled={!option.affordable}
                  onClick={() => select(option)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--rst-line-strong)] text-[11px] font-bold text-[var(--rst-brass-300)]"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--rst-ivory)]">{option.label}</h3>
                        {option.tag && <span className="rst-chip shrink-0 !py-0.5 text-[10px] uppercase">{option.tag}</span>}
                      </div>
                      <p className="rst-muted mt-1 text-xs leading-relaxed">{option.flavorText}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <ConsequenceChips option={option} />
                        {!option.affordable && (
                          <span className="rst-chip rst-chip-danger">
                            <Lock size={11} aria-hidden="true" /> Can’t afford
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" className="rst-btn rst-btn-ghost" onClick={onDeferred}>
                {t('story_decide_later')}
              </button>
              <button
                ref={commitRef}
                type="button"
                className="rst-btn rst-btn-primary"
                disabled={!selectedId}
                onClick={commit}
              >
                {commitText} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
