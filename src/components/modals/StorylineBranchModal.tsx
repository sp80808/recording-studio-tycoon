import React, { useEffect, useState } from 'react';
import { GamePanel } from '@/components/ui/GamePanel';
import { KenneyButton } from '@/components/ui/KenneyButton';
import type { StorylineBranchOption, StorylineNode } from '@/narrative/branchingStorylineEngine';
import { gameAudio } from '@/utils/audioSystem';
import { ArrowRight, CheckCircle, Coins, MessageSquareQuote, Star, Swords } from 'lucide-react';

interface StorylineBranchModalProps {
  isOpen: boolean;
  node: StorylineNode | null;
  onChoose: (option: StorylineBranchOption) => void;
  onClose: () => void;
}

export const StorylineBranchModal: React.FC<StorylineBranchModalProps> = ({
  isOpen,
  node,
  onChoose,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<StorylineBranchOption | null>(null);
  const dilemma = node?.branchDilemma ?? null;

  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
    }
  }, [isOpen, node?.id]);

  if (!isOpen || !node || !dilemma) return null;

  const handleSelect = (option: StorylineBranchOption) => {
    setSelectedOption(option);
    void gameAudio.playUISound('notice').catch(() => {});
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    onChoose(selectedOption);
    void gameAudio.playClick().catch(() => {});
    setSelectedOption(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storyline-branch-title"
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <GamePanel
        variant="amber"
        className="relative z-10 flex w-full max-w-xl flex-col p-5 shadow-2xl animate-inspector-pop border-amber-500/50"
      >
        <div className="mb-3 flex items-center justify-between border-b-2 border-slate-700/80 pb-2">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-amber-400 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
              {dilemma.kicker}
            </span>
          </div>
          <span className="rounded border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            Act {node.act} · Branch
          </span>
        </div>

        <h2 id="storyline-branch-title" className="mb-2 text-xl font-black tracking-wide text-white">
          {node.title}
        </h2>

        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-300">
            <MessageSquareQuote size={14} aria-hidden="true" />
            {node.rivalName}
          </div>
          <p className="text-sm italic leading-relaxed text-rose-100/90">{node.rivalDialogue}</p>
        </div>

        <p className="mb-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
          {dilemma.context}
        </p>

        {selectedOption ? (
          <div className="my-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-lg border-2 border-emerald-500/60 bg-emerald-950/40 p-4 text-slate-100 shadow-inner">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-300">
                <CheckCircle size={18} aria-hidden="true" />
                Path locked in
              </div>
              <p className="mb-1 text-sm font-semibold text-white">{selectedOption.label}</p>
              <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                {selectedOption.consequences.narrativeOutcome}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <KenneyButton onClick={handleConfirm} variant="green" size="md">
                Advance campaign
              </KenneyButton>
            </div>
          </div>
        ) : (
          <div className="my-1 space-y-2.5">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Choose your studio trajectory:
            </p>
            {dilemma.options.map((option) => {
              const { moneyDelta, repDelta } = option.consequences;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full cursor-pointer rounded-lg border-2 border-slate-700/80 bg-slate-900/80 p-3 text-left transition-all hover:border-amber-400/80 hover:brightness-110 active:scale-[0.99] game-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{option.label}</h3>
                    <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-300">
                      {option.playstyleTag}
                    </span>
                  </div>
                  <p className="mb-2.5 text-xs leading-relaxed text-slate-300">{option.flavorText}</p>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2 text-[11px]">
                    {moneyDelta !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          moneyDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        <Coins size={12} aria-hidden="true" />
                        {moneyDelta > 0
                          ? `+$${moneyDelta.toLocaleString()}`
                          : `-$${Math.abs(moneyDelta).toLocaleString()}`}
                      </span>
                    )}
                    {repDelta !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          repDelta > 0 ? 'text-sky-400' : 'text-orange-400'
                        }`}
                      >
                        <Star size={12} aria-hidden="true" />
                        {repDelta > 0 ? `+${repDelta} Rep` : `${repDelta} Rep`}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                      Choose this path <ArrowRight size={12} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </GamePanel>
    </div>
  );
};
