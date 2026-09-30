/** Motion mode mirrored onto <html> so plain CSS can honour settings, not just the OS media query. */
export interface FeelInputs {
  reducedMotion?: boolean;
  graphicsPreset?: 'low' | 'medium' | 'high' | 'ultra';
}

export interface FeelAttributes {
  'data-reduced-motion': 'true' | 'false';
  'data-graphics': 'low' | 'medium' | 'high' | 'ultra';
}

export function feelAttributes({ reducedMotion, graphicsPreset }: FeelInputs): FeelAttributes {
  return {
    'data-reduced-motion': reducedMotion ? 'true' : 'false',
    'data-graphics': graphicsPreset ?? 'high',
  };
}

export function applyFeelAttributes(el: HTMLElement, inputs: FeelInputs): void {
  const attrs = feelAttributes(inputs);
  (Object.keys(attrs) as (keyof FeelAttributes)[]).forEach(k => el.setAttribute(k, attrs[k]));
}
