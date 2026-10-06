// Per-city window skylines (#291). Pure data: silhouette character for the two skyline layers plus one
// landmark per city, all drawn by `buildWindowView` from Pixi polygons. In-house original, no external art.

export type SkylineLandmark =
  | 'palms' // Los Angeles
  | 'twin-spires' // Nashville
  | 'gherkin' // London
  | 'tv-tower' // Berlin
  | 'red-tower' // Tokyo
  | 'sugarloaf' // Rio
  | 'cylinders' // Detroit
  | 'cranes' // Lagos
  | 'none';

export interface SkylineLayer {
  top: number;
  hMin: number;
  hMax: number;
  /** Tower width range as a fraction of the glass width. */
  wMin: number;
  wMax: number;
  color: number;
  alpha: number;
}

export interface SkylineStyle {
  far: SkylineLayer;
  near: SkylineLayer;
  landmark: SkylineLandmark;
  /** Landmark position across the glass (0..1). */
  landmarkU: number;
  landmarkColor: number;
  /** Chance a tower window is lit at night. */
  lit: number;
}

const base = (far: Partial<SkylineLayer>, near: Partial<SkylineLayer>): Pick<SkylineStyle, 'far' | 'near'> => ({
  far: { top: 0.34, hMin: 0.12, hMax: 0.3, wMin: 0.07, wMax: 0.16, color: 0x1a2236, alpha: 0.75, ...far },
  near: { top: 0.22, hMin: 0.08, hMax: 0.22, wMin: 0.07, wMax: 0.16, color: 0x10151f, alpha: 1, ...near },
});

export const DEFAULT_SKYLINE: SkylineStyle = { ...base({}, {}), landmark: 'none', landmarkU: 0.5, landmarkColor: 0x10151f, lit: 0.5 };

export const SKYLINE_STYLES: Record<string, SkylineStyle> = {
  'los-angeles': { ...base({ hMin: 0.06, hMax: 0.2, color: 0x2a2038 }, { hMin: 0.04, hMax: 0.12, wMin: 0.09, wMax: 0.2, color: 0x1a1426 }), landmark: 'palms', landmarkU: 0.72, landmarkColor: 0x0d0a14, lit: 0.45 },
  nashville: { ...base({ hMin: 0.1, hMax: 0.24, color: 0x1d2433 }, { hMin: 0.06, hMax: 0.16, color: 0x121722 }), landmark: 'twin-spires', landmarkU: 0.66, landmarkColor: 0x0d1119, lit: 0.5 },
  london: { ...base({ hMin: 0.06, hMax: 0.16, color: 0x232a3a }, { hMin: 0.05, hMax: 0.13, wMin: 0.05, wMax: 0.11, color: 0x151a26 }), landmark: 'gherkin', landmarkU: 0.62, landmarkColor: 0x0f131d, lit: 0.4 },
  berlin: { ...base({ hMin: 0.07, hMax: 0.18, color: 0x222732 }, { hMin: 0.05, hMax: 0.14, wMin: 0.08, wMax: 0.18, color: 0x14171f }), landmark: 'tv-tower', landmarkU: 0.7, landmarkColor: 0x0e1016, lit: 0.45 },
  tokyo: { ...base({ hMin: 0.16, hMax: 0.34, wMin: 0.05, wMax: 0.11, color: 0x1b2038 }, { hMin: 0.12, hMax: 0.28, wMin: 0.05, wMax: 0.11, color: 0x0f1220 }), landmark: 'red-tower', landmarkU: 0.64, landmarkColor: 0xb8402e, lit: 0.7 },
  rio: { ...base({ hMin: 0.05, hMax: 0.14, color: 0x1e2a38 }, { hMin: 0.04, hMax: 0.12, wMin: 0.08, wMax: 0.17, color: 0x12202a }), landmark: 'sugarloaf', landmarkU: 0.7, landmarkColor: 0x1a2a2a, lit: 0.45 },
  detroit: { ...base({ hMin: 0.1, hMax: 0.26, color: 0x232830 }, { hMin: 0.07, hMax: 0.18, wMin: 0.08, wMax: 0.15, color: 0x14171c }), landmark: 'cylinders', landmarkU: 0.68, landmarkColor: 0x0d1013, lit: 0.4 },
  lagos: { ...base({ hMin: 0.07, hMax: 0.2, color: 0x2a2630 }, { hMin: 0.05, hMax: 0.15, wMin: 0.07, wMax: 0.14, color: 0x18141a }), landmark: 'cranes', landmarkU: 0.34, landmarkColor: 0x0e0c10, lit: 0.45 },
};

export const getSkylineStyle = (cityId?: string): SkylineStyle => (cityId ? SKYLINE_STYLES[cityId] : undefined) ?? DEFAULT_SKYLINE;
