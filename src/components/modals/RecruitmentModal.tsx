
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState } from '@/types/game';
import { Users } from 'lucide-react';

interface RecruitmentModalProps {
  gameState: GameState;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: (show: boolean) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  gameState,
  showRecruitmentModal,
  setShowRecruitmentModal,
  hireStaff,
  refreshCandidates
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={showRecruitmentModal} onOpenChange={setShowRecruitmentModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-stone-800/80 hover:bg-stone-700/80 text-white border-stone-600">
          <Users className="w-4 h-4 mr-2" />
          {t('recruitment_center_label')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-stone-900 border-stone-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('recruitment_center_label')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {gameState.availableCandidates.length === 0 ? (
            <div className="text-center text-stone-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-stone-600" />
              <div>{t('recruitment_no_candidates')}</div>
              <div className="text-sm mt-2">{t('recruitment_check_back')}</div>
            </div>
          ) : (
            gameState.availableCandidates.map((candidate, index) => {
              const signingFee = candidate.salary * 3; // 3x daily salary as signing fee
              
              return (
                <Card key={index} className="p-4 bg-white/[0.07] border-stone-600 hover:bg-stone-750 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                      <p className="text-purple-400 font-medium">{candidate.role}</p>
                      <p className="text-xs text-stone-400">{t('recruitment_level_xp', { level: candidate.levelInRole, xp: candidate.xpInRole })}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold">{t('recruitment_signing_fee', { fee: signingFee })}</div>
                      <div className="text-sm text-stone-400">{t('recruitment_salary_per_day', { salary: candidate.salary })}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center p-2 bg-stone-700 rounded">
                      <div className="text-amber-300 font-bold text-lg">{candidate.primaryStats.creativity}</div>
                      <div className="text-xs text-stone-400">{t('stat_creativity')}</div>
                    </div>
                    <div className="text-center p-2 bg-stone-700 rounded">
                      <div className="text-green-400 font-bold text-lg">{candidate.primaryStats.technical}</div>
                      <div className="text-xs text-stone-400">{t('stat_technical')}</div>
                    </div>
                    <div className="text-center p-2 bg-stone-700 rounded">
                      <div className="text-yellow-400 font-bold text-lg">{candidate.primaryStats.speed}</div>
                      <div className="text-xs text-stone-400">{t('stat_speed')}</div>
                    </div>
                  </div>

                  {candidate.genreAffinity && (
                    <div className="mb-3 p-2 bg-purple-900/30 rounded border border-purple-700">
                      <span className="text-purple-400 font-medium">{t('recruitment_genre_specialist_label')}</span>
                      <span className="text-white">{candidate.genreAffinity.genre}</span>
                      <span className="text-green-400 ml-2">{t('recruitment_genre_bonus_suffix', { bonus: candidate.genreAffinity.bonus })}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => hireStaff(index)}
                      disabled={gameState.money < signingFee}
                      className="flex-1 bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] disabled:bg-stone-600"
                    >
                      {gameState.money < signingFee ? t('recruitment_insufficient_funds') : t('recruitment_hire_button', { fee: signingFee })}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="border-t border-stone-700 pt-4">
          <Button
            onClick={refreshCandidates}
            disabled={gameState.money < 50}
            className="w-full bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] disabled:bg-stone-600"
          >
            {t('recruitment_find_candidates_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
