import { money } from '@/utils/displayMoney';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Project } from '@/types/game';

interface ProjectCardProps {
  project: Project;
  onStartProject: (project: Project) => void;
  isActiveProject: boolean;
}

const ProjectCardComponent: React.FC<ProjectCardProps> = ({ project, onStartProject, isActiveProject }) => {
  const { t } = useTranslation();
  return (
    <Card className="p-4 bg-stone-900/90 border-stone-600 hover:bg-stone-800/90 transition-colors backdrop-blur-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white">{project.title}</h3>
        <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">{project.clientType}</span>
      </div>
      <div className="text-sm space-y-1 text-stone-200">
        <div>{t('project_card_genre_label')} <span className="text-white">{project.genre}</span></div>
        <div>{t('project_card_difficulty_label')} <span className="text-orange-400">{project.difficulty}</span></div>
        <div className="text-green-400 font-semibold">{money(project.payoutBase)}</div>
        <div className="text-amber-300 font-semibold">{t('project_card_rep_gain', { value: project.repGainBase })}</div>
        <div className="text-yellow-400 font-semibold">{t('project_card_days_suffix', { days: project.durationDaysTotal })}</div>
      </div>
      <Button
        onClick={() => onStartProject(project)}
        disabled={isActiveProject}
        className="w-full mt-3 bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] disabled:bg-stone-600 text-emerald-100"
        size="sm"
      >
        {t('project_card_start_button')}
      </Button>
    </Card>
  );
};

export const ProjectCard = React.memo(ProjectCardComponent);
