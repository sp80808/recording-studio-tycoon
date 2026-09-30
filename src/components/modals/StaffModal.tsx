
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { GameState, StaffMember } from '@/types/game';
import { getStaffStatusColor, getEnergyColor } from '@/utils/staffUtils';

interface StaffModalProps {
  gameState: GameState;
  showStaffModal: boolean;
  setShowStaffModal: (show: boolean) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal?: (staff: StaffMember) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  gameState,
  showStaffModal,
  setShowStaffModal,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-stone-800/80 hover:bg-stone-700/80 text-white border-stone-600">
          {t('staff_modal_button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-stone-900 border-stone-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">{t('staff_modal_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {gameState.hiredStaff.length === 0 ? (
            <div className="text-center text-stone-400 py-8">
              {t('staff_modal_no_staff')}
            </div>
          ) : (
            gameState.hiredStaff.map(staff => (
              <Card key={staff.id} className="p-4 bg-stone-800 border-stone-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{staff.name}</h4>
                    <p className="text-stone-300">{t('staff_modal_role_level', { role: staff.role, level: staff.levelInRole })}</p>
                    {staff.status === 'Training' && staff.trainingEndDay && (
                      <p className="text-yellow-400 text-sm">
                        {t('staff_modal_training_until', { day: staff.trainingEndDay })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getStaffStatusColor(staff.status)}`}>{staff.status}</div>
                    <div className="text-sm text-stone-400">{t('staff_modal_salary_per_week', { salary: staff.salary })}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-amber-300 font-bold">{staff.primaryStats.creativity}</div>
                    <div className="text-xs text-stone-400">{t('stat_creativity')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{staff.primaryStats.technical}</div>
                    <div className="text-xs text-stone-400">{t('stat_technical')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">{staff.primaryStats.speed}</div>
                    <div className="text-xs text-stone-400">{t('stat_speed')}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-300">{t('stat_energy_label')}</span>
                    <span className={getEnergyColor(staff.energy)}>{staff.energy}/100</span>
                  </div>
                  <Progress
                    value={staff.energy}
                    className="h-2"
                    aria-label={t('staff_modal_energy_aria', { name: staff.name })}
                  />
                </div>

                {staff.genreAffinity && (
                  <div className="mb-3 text-sm">
                    <span className="text-purple-400">{t('staff_modal_genre_affinity_label')}</span>
                    <span className="text-white">{t('staff_modal_genre_affinity_value', { genre: staff.genreAffinity.genre, bonus: staff.genreAffinity.bonus })}</span>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {staff.status === 'Idle' && gameState.activeProject && (
                    <Button
                      size="sm"
                      onClick={() => assignStaffToProject(staff.id)}
                      className="bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24]"
                    >
                      {t('staff_modal_assign_button')}
                    </Button>
                  )}

                  {staff.status === 'Working' && (
                    <Button
                      size="sm"
                      onClick={() => unassignStaffFromProject(staff.id)}
                      className="bg-red-400/[0.14] ring-1 ring-inset ring-red-400/45 hover:bg-red-400/[0.24]"
                    >
                      {t('staff_modal_unassign_button')}
                    </Button>
                  )}

                  {staff.status !== 'Working' && staff.status !== 'Training' && (
                    <Button
                      size="sm"
                      onClick={() => toggleStaffRest(staff.id)}
                      className="bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24]"
                    >
                      {staff.status === 'Resting' ? t('staff_modal_stop_resting_button') : t('staff_modal_rest_button')}
                    </Button>
                  )}

                  {staff.status === 'Idle' && openTrainingModal && (
                    <Button
                      size="sm"
                      onClick={() => openTrainingModal(staff)}
                      className="bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 hover:bg-purple-400/[0.24]"
                    >
                      {t('staff_modal_send_training_button')}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
