import React, { useState } from 'react';
import { GamePanel } from '@/components/ui/GamePanel';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { NarrativeDilemma, NarrativeChoiceOption } from '@/narrative/narrativeChoices';
import { gameAudio } from '@/utils/audioSystem';
import { AlertCircle, ArrowRight, CheckCircle, Coins, HeartHandshake, Star } from 'lucide-react';

interface NarrativeChoiceModalProps {
  dilemma: NarrativeDilemma | null;
  isOpen: boolean;
  onSelectOption: (dilemmaId: string, choiceId: string) => void;
  onClose: () => void;
}

export const NarrativeChoiceModal: React.FC<NarrativeChoiceModalProps> = ({
  dilemma,
  isOpen,
  onSelectOption,
  onClose,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);

  if (!isOpen || !dilemma) return null;

  const handleChoose = (choice: NarrativeChoiceOption) => {
    setSelectedChoiceId(choice.id);
    setOutcomeMessage(choice.consequences.outcomeNarrative);
    void gameAudio.playUISound('notice').catch(() => {});
  };

  const handleConfirm = () => {
    if (!selectedChoiceId) return;
    onSelectOption(dilemma.id, selectedChoiceId);
    void gameAudio.playClick().catch(() => {});
    setOutcomeMessage(null);
    setSelectedChoiceId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dilemma-title"
    >
      {/* Background Gradient Scrim */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <GamePanel
        className="relative z-10 w-full max-w-xl flex flex-col p-5 shadow-2xl animate-inspector-pop border-amber-500/50"
      >
        {/* Header Kicker */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-700/80">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400 animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-widest text-amber-300 uppercase">
              {dilemma.kicker}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Source: {dilemma.source}
          </span>
        </div>

        {/* Title & Story Context */}
        <h2 id="dilemma-title" className="text-xl font-black text-white tracking-wide mb-2">
          {dilemma.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          {dilemma.context}
        </p>

        {/* Outcome View (If an option has been chosen) */}
        {outcomeMessage ? (
          <div className="space-y-4 my-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-lg bg-emerald-950/40 border-2 border-emerald-500/60 text-slate-100 shadow-inner">
              <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-sm">
                <CheckCircle size={18} />
                Decision Executed
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {outcomeMessage}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <KenneyButton
                onClick={handleConfirm}
                variant="green"
                size="md"
              >
                Proceed into Studio
              </KenneyButton>
            </div>
          </div>
        ) : (
          /* Choice Options List */
          <div className="space-y-2.5 my-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Your Course of Action:
            </p>
            {dilemma.options.map((option) => {
              const { moneyDelta, repDelta, clientLoyaltyDelta } = option.consequences;
              return (
                <div
                  key={option.id}
                  onClick={() => handleChoose(option)}
                  className="cursor-pointer rounded-lg border-2 border-slate-700/80 bg-slate-900/80 p-3 hover:border-amber-400/80 hover:brightness-110 active:scale-[0.99] transition-all game-interactive"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {option.label}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-700">
                      {option.playstyleFit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {option.flavorText}
                  </p>

                  {/* Consequence Preview Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    {moneyDelta !== 0 && (
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        moneyDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        <Coins size={12} />
                        {moneyDelta > 0 ? `+$${moneyDelta.toLocaleString()}` : `-$${Math.abs(moneyDelta).toLocaleString()}`}
                      </span>
                    )}
                    {repDelta !== 0 && (
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        repDelta > 0 ? 'text-sky-400' : 'text-orange-400'
                      }`}>
                        <Star size={12} />
                        {repDelta > 0 ? `+${repDelta} Rep` : `${repDelta} Rep`}
                      </span>
                    )}
                    {clientLoyaltyDelta !== undefined && clientLoyaltyDelta !== 0 && (
                      <span className="inline-flex items-center gap-1 font-bold text-purple-400">
                        <HeartHandshake size={12} />
                        +{clientLoyaltyDelta} Loyalty
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                      Choose this path <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GamePanel>
    </div>
  );
};
