import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  APPEARANCE_FIELDS,
  appearanceFieldLabel,
  appearanceOptionLabel,
  appearanceUi,
  appearanceValueLabel,
  isAppearanceFieldRelevant,
  cycleAppearanceField,
  setAppearanceField,
  type AppearanceField,
} from '@/features/sprites/appearanceFields';
import { sanitizeProducerAppearance, type ProducerAppearance, type ResolvedProducerAppearance } from '@/features/sprites/producerAppearance';

import './appearance-editor.css';

export interface AppearanceEditorProps {
  appearance: ProducerAppearance;
  /** Always called with a complete, sanitised appearance. */
  onChange: (next: ResolvedProducerAppearance) => void;
  /** Optional per-edit hook (e.g. click sound). */
  onEdit?: () => void;
  fields?: readonly AppearanceField[];
  /** Pair rows in two columns when the container is wide (the career-start layout). */
  wide?: boolean;
}

/** One row per property: visible label + visible current value, and exactly one control surface. */
function AppearanceRow({ field, appearance, onChange }: { field: AppearanceField; appearance: ResolvedProducerAppearance; onChange: (next: ResolvedProducerAppearance) => void }) {
  const label = appearanceFieldLabel(field);
  const value = appearanceValueLabel(field, appearance);
  const selected = field.get(appearance);
  const labelId = `appearance-label-${field.id}`;
  const relevant = isAppearanceFieldRelevant(field, appearance);

  if (field.kind === 'swatch') {
    return (
      <div className="appearance-row appearance-row--swatch" data-field={field.id} role="radiogroup" aria-labelledby={labelId} aria-disabled={!relevant || undefined} data-disabled={!relevant || undefined}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          e.stopPropagation();
          const next = cycleAppearanceField(field, appearance, e.key === 'ArrowRight' ? 1 : -1);
          onChange(next);
          e.currentTarget.querySelector<HTMLElement>(`[data-value="${field.get(next)}"]`)?.focus();
        }}>
        <span id={labelId} className="appearance-row-label">{label}</span>
        <span className="appearance-row-value" data-testid={`appearance-value-${field.id}`}>{relevant ? value : appearanceUi('appearance.ui.hidden')}</span>
        <span className="appearance-swatches">
          {field.options.map((option) => {
            const name = appearanceOptionLabel(option);
            return (
              <button key={option.value} type="button" role="radio" disabled={!relevant} aria-checked={selected === option.value} aria-label={name} title={name} data-value={option.value}
                tabIndex={selected === option.value ? 0 : -1} className="appearance-swatch" style={{ '--swatch': option.swatch } as React.CSSProperties}
                {...(selected === option.value ? { 'data-gamepad-adjust': '', 'data-gamepad-discrete': '' } : { 'data-gamepad-skip': '' })}
                onClick={() => onChange(setAppearanceField(field, appearance, option.value))} />
            );
          })}
        </span>
      </div>
    );
  }

  const step = (delta: number) => onChange(cycleAppearanceField(field, appearance, delta));
  const index = Math.max(0, field.options.findIndex((o) => o.value === selected));
  const last = field.options.length - 1;
  // Spinbutton pattern: the value is the single tab stop; the arrow buttons are pointer/touch affordances.
  return (
    <div className="appearance-row appearance-row--choice" data-field={field.id}>
      <span id={labelId} className="appearance-row-label">{label}</span>
      <button type="button" className="appearance-step" tabIndex={-1} data-gamepad-skip aria-label={appearanceUi('appearance.ui.previous', { label })} onClick={() => step(-1)}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <div className="appearance-row-value appearance-spin" role="spinbutton" tabIndex={0} data-gamepad-adjust data-gamepad-discrete
        data-testid={`appearance-value-${field.id}`} aria-labelledby={labelId}
        aria-valuemin={1} aria-valuemax={field.options.length} aria-valuenow={index + 1} aria-valuetext={value}
        title={appearanceUi('appearance.ui.position', { index: index + 1, total: field.options.length })}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step(1);
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step(-1);
          else if (e.key === 'Home') onChange(field.set(appearance, field.options[0].value));
          else if (e.key === 'End') onChange(field.set(appearance, field.options[last].value));
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}>{value}</div>
      <button type="button" className="appearance-step" tabIndex={-1} data-gamepad-skip aria-label={appearanceUi('appearance.ui.next', { label })} onClick={() => step(1)}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

/** The canonical appearance editor: rendered entirely from `APPEARANCE_FIELDS`. */
export function AppearanceEditor({ appearance, onChange, onEdit, fields = APPEARANCE_FIELDS, wide = false }: AppearanceEditorProps) {
  const resolved = sanitizeProducerAppearance(appearance);
  return (
    <div className={`appearance-editor${wide ? ' appearance-editor--wide' : ''}`} role="group" aria-label={appearanceUi('appearance.ui.editor')} data-testid="appearance-editor">
      {fields.map((field) => (
        <AppearanceRow key={field.id} field={field} appearance={resolved} onChange={(next) => { onEdit?.(); onChange(next); }} />
      ))}
    </div>
  );
}
