import React, { useState } from 'react';
import type { GameState, Project } from '@/types/game';
import { getProjectBrief } from '@/rpg/projectBrief';
import {
  SIGNAL_SLOTS,
  SLOT_LABELS,
  availableForSlot,
  evaluateChain,
  resolveTemplates,
  validateChain,
  type SignalChain,
  type SignalSlot,
} from '@/rpg/signalChain';

interface ChainComposerProps {
  project: Project;
  state: GameState;
  chain?: SignalChain;
  onChange: (chain: SignalChain | undefined) => void;
  onSaveTemplate: (chain: SignalChain, name: string) => void;
}

/** Compact slot composer (#86 V1): no drag and drop, just four selects and an explainable summary. */
export const ChainComposer: React.FC<ChainComposerProps> = ({ project, state, chain, onChange, onSaveTemplate }) => {
  const [name, setName] = useState('');
  const brief = getProjectBrief(project);
  const current: SignalChain = chain ?? { id: `chain-${project.id}`, name: 'Vocal chain', service: 'vocal-recording', roomId: project.bookingRoomId ?? 'studio-a', slots: {} };
  const ev = chain ? evaluateChain(chain, state, state.hiredStaff, brief) : null;
  const validation = chain ? validateChain(chain, state, project.id) : null;
  const templates = resolveTemplates(state);

  const setSlot = (slot: SignalSlot, id: string) => {
    const slots = { ...current.slots };
    if (id) slots[slot] = id; else delete slots[slot];
    onChange(Object.keys(slots).length ? { ...current, slots } : undefined);
  };

  return (
    <div className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs" data-testid="chain-composer">
      <div className="rst-kicker mb-1.5 !text-[10px]">Vocal chain (optional)</div>
      {templates.length > 0 && (
        <select
          aria-label="Saved chain template"
          className="mb-1.5 w-full rounded border border-[var(--rst-line)] bg-black/30 px-1.5 py-1"
          value=""
          onChange={(e) => {
            const t = templates.find((x) => x.chain.id === e.target.value);
            if (t) onChange({ ...t.chain, id: `chain-${project.id}` });
          }}
        >
          <option value="">Load template…</option>
          {templates.map((t) => (
            <option key={t.chain.id} value={t.chain.id}>
              {t.chain.name}{t.validation.broken.length ? ` (missing: ${t.validation.broken.map((s) => SLOT_LABELS[s]).join(', ')})` : ''}
            </option>
          ))}
        </select>
      )}
      <div className="space-y-1">
        {SIGNAL_SLOTS.map((slot) => (
          <label key={slot} className="flex items-center gap-2">
            <span className="w-16 text-stone-400">{SLOT_LABELS[slot]}</span>
            <select
              className="min-w-0 flex-1 rounded border border-[var(--rst-line)] bg-black/30 px-1.5 py-1"
              value={current.slots[slot] ?? ''}
              onChange={(e) => setSlot(slot, e.target.value)}
            >
              <option value="">— empty —</option>
              {availableForSlot(state, slot, project.id).map((g) => (
                <option key={g.id} value={g.id}>{g.name} · {Math.round(g.condition)}%</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {ev && validation && (
        <div className="mt-2 space-y-0.5 text-stone-300">
          <div>
            {ev.traits.length > 0 ? `Character: ${ev.traits.join(' / ')}` : 'Character: neutral'} · Setup {ev.setupTime} min · Reliability {ev.reliabilityRisk} · Crew familiarity {ev.familiarity}%
          </div>
          {validation.broken.length > 0 && <div className="text-rose-300">Unavailable: {validation.broken.map((s) => SLOT_LABELS[s]).join(', ')}</div>}
          {ev.reasons.slice(0, 3).map((r) => <div key={r}>· {r}</div>)}
          <div className="mt-1 flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="min-w-0 flex-1 rounded border border-[var(--rst-line)] bg-black/30 px-1.5 py-1"
            />
            <button
              type="button"
              className="rst-chip cursor-pointer"
              disabled={!name.trim() || !validation.valid}
              onClick={() => { onSaveTemplate(current, name); setName(''); }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainComposer;
