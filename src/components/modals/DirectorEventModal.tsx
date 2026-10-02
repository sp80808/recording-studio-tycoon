import React, { useMemo } from 'react';
import type { PendingDirectorView } from '@/narrative/directorEvents';
import { CityScene } from '@/components/CityScene';
import { cityForEvent } from '@/narrative/cityEventCity';
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
  const content = useMemo<DecisionContent | null>(() => {
    if (!event) return null;
    return {
      key: `director:${event.def.id}:${event.subject?.id ?? ''}`,
      kicker: event.def.kicker,
      badge: event.subject?.label ?? 'Studio event',
      title: event.def.title,
      context: event.context,
      prompt: 'What do you do?',
      illustration: cityForEvent(event.def.id) ? <CityScene cityId={cityForEvent(event.def.id)} mood={sagaMood(event.def.id)} /> : undefined,
      options: event.options.map((o) => ({
        id: o.id,
        label: o.label,
        flavorText: o.flavorText,
        moneyDelta: sum(o.effects, 'money'),
        repDelta: sum(o.effects, 'reputation'),
        xpDelta: sum(o.effects, 'xp') || undefined,
        affordable: o.affordable,
        outcome: o.outcome,
      })),
    };
  }, [event]);

  return (
    <StoryDecisionModal
      content={content}
      open={open}
      commitLabel="Commit to this choice"
      onCommit={onChoose}
      onDeferred={onDeferred}
      onDone={onDone}
    />
  );
};
