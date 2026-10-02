import React, { useMemo } from 'react';
import type { PendingDirectorView } from '@/narrative/directorEvents';
import { CityScene } from '@/components/CityScene';
import { cityForEvent } from '@/narrative/cityEventCity';
import { useTranslation } from 'react-i18next';
import { tc, tcOpt, useContentLocale } from '@/i18n/content';
import { StoryDecisionModal, type DecisionContent } from './StoryDecisionModal';

interface DirectorEventModalProps {
  event: PendingDirectorView | null;
  open: boolean;
  onChoose: (optionId: string) => void;
  onDeferred: () => void;
  onDone: () => void;
}

const sum = (effects: PendingDirectorView['options'][number]['effects'], kind: string): number =>
  effects.reduce((total, e) => (e.kind === kind && 'amount' in e ? total + e.amount : total), 0);

const sagaMood = (id: string): 'dusk' | 'night' | 'dawn' => {
  const m = /^saga_[a-z]+_(\d)$/.exec(id);
  return m ? (['dusk', 'night', 'dawn'] as const)[Number(m[1]) - 1] : 'dusk';
};

/** A Studio Event Director beat (client, crew, gear or industry). Same decision card as subplots; effects are data, applied by the director. */
export const DirectorEventModal: React.FC<DirectorEventModalProps> = ({ event, open, onChoose, onDeferred, onDone }) => {
  const { t } = useTranslation();
  const contentVersion = useContentLocale();
  const content = useMemo<DecisionContent | null>(() => {
    if (!event) return null;
    const id = event.def.id;
    const rawContext = tcOpt(`event.${id}.context`);
    // Subject-less events can't fill {{label}}, so they keep the English line.
    const context = rawContext && (event.subject || !rawContext.includes('{{'))
      ? tc(`event.${id}.context`, event.context, { label: event.subject?.label ?? '' })
      : event.context;
    return {
      key: `director:${event.def.id}:${event.subject?.id ?? ''}`,
      kicker: tc(`event.${id}.kicker`, event.def.kicker),
      badge: event.subject?.label ?? t('event_studio_event'),
      title: tc(`event.${id}.title`, event.def.title),
      context,
      prompt: t('event_prompt'),
      illustration: cityForEvent(event.def.id) ? <CityScene cityId={cityForEvent(event.def.id)} mood={sagaMood(event.def.id)} /> : undefined,
      options: event.options.map((o) => ({
        id: o.id,
        label: tc(`event.${id}.opt.${o.id}.label`, o.label),
        flavorText: tc(`event.${id}.opt.${o.id}.flavor`, o.flavorText),
        moneyDelta: sum(o.effects, 'money'),
        repDelta: sum(o.effects, 'reputation'),
        xpDelta: sum(o.effects, 'xp') || undefined,
        affordable: o.affordable,
        outcome: tc(`event.${id}.opt.${o.id}.outcome`, o.outcome),
      })),
    };
  }, [event, t, contentVersion]);

  return (
    <StoryDecisionModal
      content={content}
      open={open}
      commitLabel={t('event_commit')}
      onCommit={onChoose}
      onDeferred={onDeferred}
      onDone={onDone}
    />
  );
};
