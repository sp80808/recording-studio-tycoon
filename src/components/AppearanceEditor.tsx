import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  APPEARANCE_FIELDS,
  appearanceFieldLabel,
  appearanceOptionLabel,
  appearanceUi,
  appearanceValueLabel,
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
}

/** One row per property: visible label + visible current value, and exactly one control surface. */
function AppearanceRow({ field, appearance, onChange }: { field: AppearanceField; appearance: ResolvedProducerAppearance; onChange: (next: ResolvedProducerAppearance) => void }) {
  const label = appearanceFieldLabel(field);
  const value = appearanceValueLabel(field, appearance);
  const selected = field.get(appearance);
  const labelId = `appearance-label-${field.id}`;

  if (field.kind === 'swatch') {
    return (
      <div className="appearance-row appearance-row--swatch" data-field={field.id} role="radiogroup" aria-labelledby={labelId}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          e.stopPropagation();
          const next = cycleAppearanceField(field, appearance, e.key === 'ArrowRight' ? 1 : -1);
          onChange(next);
          e.currentTarget.querySelector<HTMLElement>(`[data-value="${field.get(next)}"]`)?.focus();
        }}>
        <span id={labelId} className="appearance-row-label">{label}</span>
        <span className="appearance-row-value" data-testid={`appearance-value-${field.id}`}>{value}</span>
        <span className="appearance-swatches">
          {field.options.map((option) => {
            const name = appearanceOptionLabel(option);
            return (
              <button key={option.value} type="button" role="radio" aria-checked={selected === option.value} aria-label={name} title={name} data-value={option.value}
                tabIndex={selected === option.value ? 0 : -1} className="appearance-swatch" style={{ '--swatch': option.swatch } as React.CSSProperties}
                onClick={() => onChange(setAppearanceField(field, appearance, option.value))} />
            );
          })}
        </span>
      </div>
    );
  }

  const step = (delta: number) => onChange(cycleAppearanceField(field, appearance, delta));
  const index = Math.max(0, field.options.findIndex((o) => o.value === selected));
  return (
    <div className="appearance-row appearance-row--choice" data-field={field.id} role="group" aria-labelledby={labelId}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          step(e.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      <span id={labelId} className="appearance-row-label">{label}</span>
      <button type="button" className="appearance-step" aria-label={appearanceUi('appearance.ui.previous', { label })} onClick={() => step(-1)}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span className="appearance-row-value" data-testid={`appearance-value-${field.id}`} aria-live="polite"
        title={appearanceUi('appearance.ui.position', { index: index + 1, total: field.options.length })}>{value}</span>
      <button type="button" className="appearance-step" aria-label={appearanceUi('appearance.ui.next', { label })} onClick={() => step(1)}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

/** The canonical appearance editor: rendered entirely from `APPEARANCE_FIELDS`. */
export function AppearanceEditor({ appearance, onChange, onEdit, fields = APPEARANCE_FIELDS }: AppearanceEditorProps) {
  const resolved = sanitizeProducerAppearance(appearance);
  return (
    <div className="appearance-editor" role="group" aria-label={appearanceUi('appearance.ui.editor')} data-testid="appearance-editor">
      {fields.map((field) => (
        <AppearanceRow key={field.id} field={field} appearance={resolved} onChange={(next) => { onEdit?.(); onChange(next); }} />
      ))}
    </div>
  );
}
