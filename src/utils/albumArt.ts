/**
 * Deterministic local album art generator.
 *
 * The remote Pollinations endpoint does not exist in this build, so every
 * request fell back to `/placeholder.svg`. This module renders a seeded,
 * genre-aware cover on a <canvas> and returns a data URL — instant, offline,
 * unique per project, and cacheable.
 */

export interface AlbumArtOptions {
  title?: string;
  genre?: string;
  artist?: string;
  /** 0-100; high scores get a foil/sheern treatment. */
  score?: number;
  /** Square pixel size. Default 512. */
  size?: number;
  /** Save seed mixed into the hash so identical projects differ per save (bead u92). */
  saveSeed?: string | number;
}

type RGB = [number, number, number];

interface GenrePalette {
  bg: RGB;
  mid: RGB;
  accent: RGB;
  pattern: 'grid' | 'radial' | 'bars' | 'rings' | 'waves' | 'flame' | 'diagonal' | 'dots' | 'sun';
}

const PALETTES: { match: RegExp; palette: GenrePalette }[] = [
  { match: /rock|metal|punk|grunge/i, palette: { bg: [12, 10, 10], mid: [90, 20, 20], accent: [249, 115, 22], pattern: 'flame' } },
  { match: /electronic|techno|synth|edm|house|dance/i, palette: { bg: [6, 8, 24], mid: [76, 29, 149], accent: [34, 211, 238], pattern: 'grid' } },
  { match: /hip.?hop|rap|trap|grime|drill/i, palette: { bg: [8, 8, 8], mid: [120, 80, 10], accent: [252, 211, 77], pattern: 'bars' } },
  { match: /jazz|blues|soul|funk/i, palette: { bg: [10, 12, 28], mid: [120, 70, 20], accent: [252, 211, 77], pattern: 'rings' } },
  { match: /acoustic|folk|country|americana/i, palette: { bg: [14, 16, 12], mid: [60, 90, 40], accent: [253, 230, 138], pattern: 'waves' } },
  { match: /classical|orchestral|ambient|soundtrack/i, palette: { bg: [8, 10, 20], mid: [40, 60, 120], accent: [219, 234, 254], pattern: 'rings' } },
  { match: /r&b|rnb|neo.soul|gospel/i, palette: { bg: [18, 8, 24], mid: [120, 40, 120], accent: [249, 168, 212], pattern: 'sun' } },
  { match: /reggae|ska|afro|latin|salsa/i, palette: { bg: [8, 18, 10], mid: [180, 120, 10], accent: [74, 222, 128], pattern: 'sun' } },
  { match: /pop|indie|alt/i, palette: { bg: [20, 10, 34], mid: [147, 51, 234], accent: [244, 114, 182], pattern: 'radial' } },
];

const FALLBACK: GenrePalette = { bg: [18, 14, 30], mid: [100, 60, 160], accent: [244, 114, 182], pattern: 'radial' };

export function paletteForGenre(genre?: string): GenrePalette {
  if (!genre) return FALLBACK;
  for (const { match, palette } of PALETTES) {
    if (match.test(genre)) return palette;
  }
  return FALLBACK;
}

/** FNV-1a hash — stable across sessions so the same project always gets the same art. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG from a seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = (c: RGB, a = 1): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const cache = new Map<string, string>();

export function albumArtCacheKey(opts: AlbumArtOptions): string {
  return `${opts.title ?? 'untitled'}|${opts.genre ?? 'pop'}|${opts.artist ?? ''}|${opts.score ?? ''}|${opts.saveSeed ?? ''}`;
}

function shiftHue(p: GenrePalette, rng: () => number): GenrePalette {
  // Small per-title variation so two rock records don't look identical.
  const jitter = (v: number, amt: number): number =>
    Math.max(0, Math.min(255, Math.round(v + (rng() - 0.5) * amt)));
  return {
    ...p,
    bg: [jitter(p.bg[0], 24), jitter(p.bg[1], 24), jitter(p.bg[2], 24)],
    mid: [jitter(p.mid[0], 36), jitter(p.mid[1], 36), jitter(p.mid[2], 36)],
    accent: [jitter(p.accent[0], 28), jitter(p.accent[1], 28), jitter(p.accent[2], 28)],
  };
}

function paintPattern(
  ctx: CanvasRenderingContext2D,
  pattern: GenrePalette['pattern'],
  size: number,
  pal: GenrePalette,
  rng: () => number,
): void {
  ctx.save();
  switch (pattern) {
    case 'grid': {
      ctx.strokeStyle = rgb(pal.accent, 0.35);
      ctx.lineWidth = 1;
      const step = size / 12;
      ctx.translate(size / 2, size * 0.62);
      ctx.transform(1, 0, -0.35, 0.7, 0, 0);
      ctx.translate(-size / 2, -size * 0.62);
      for (let i = -4; i <= 16; i++) {
        ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
      }
      // horizon glow
      const g = ctx.createLinearGradient(0, size * 0.4, 0, size);
      g.addColorStop(0, rgb(pal.accent, 0));
      g.addColorStop(1, rgb(pal.accent, 0.35));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case 'bars': {
      const n = 14;
      const w = size / n;
      for (let i = 0; i < n; i++) {
        const h = size * (0.15 + rng() * 0.55);
        const grad = ctx.createLinearGradient(0, size, 0, size - h);
        grad.addColorStop(0, rgb(pal.mid, 0.9));
        grad.addColorStop(1, rgb(pal.accent, 0.95));
        ctx.fillStyle = grad;
        const x = i * w + w * 0.18;
        ctx.fillRect(x, size - h, w * 0.64, h);
      }
      break;
    }
    case 'rings': {
      ctx.translate(size * 0.72, size * 0.28);
      for (let i = 6; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(0, 0, (size * 0.11 * i) * (0.9 + rng() * 0.2), 0, Math.PI * 2);
        ctx.strokeStyle = rgb(pal.accent, 0.12 + i * 0.05);
        ctx.lineWidth = 2 + (6 - i);
        ctx.stroke();
      }
      break;
    }
    case 'waves': {
      ctx.strokeStyle = rgb(pal.accent, 0.5);
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        ctx.lineWidth = 1 + r * 0.7;
        const yBase = size * (0.3 + r * 0.12);
        for (let x = 0; x <= size; x += 8) {
          const y = yBase + Math.sin((x / size) * Math.PI * (2 + r * 0.6) + rng() * 0.4) * size * 0.045;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'flame': {
      const g = ctx.createRadialGradient(size / 2, size * 1.05, 10, size / 2, size * 1.05, size * 0.85);
      g.addColorStop(0, rgb(pal.accent, 0.85));
      g.addColorStop(0.45, rgb(pal.mid, 0.55));
      g.addColorStop(1, rgb(pal.mid, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      // embers
      ctx.fillStyle = rgb(pal.accent, 0.8);
      for (let i = 0; i < 40; i++) {
        const s = 1 + rng() * 3;
        ctx.globalAlpha = 0.25 + rng() * 0.6;
        ctx.fillRect(rng() * size, rng() * size, s, s);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'diagonal': {
      ctx.rotate(-0.5);
      for (let i = -8; i < 20; i++) {
        ctx.fillStyle = rgb(i % 2 ? pal.mid : pal.accent, i % 2 ? 0.28 : 0.16);
        ctx.fillRect(i * (size / 10), -size, size / 22, size * 3);
      }
      break;
    }
    case 'dots': {
      const step = size / 16;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = (rng() * step) / 2.4;
          ctx.fillStyle = rgb(pal.accent, 0.12 + rng() * 0.4);
          ctx.beginPath();
          ctx.arc(x * step + step / 2, y * step + step / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'sun':
    case 'radial':
    default: {
      const cx = size * (0.3 + rng() * 0.15);
      const cy = size * (0.3 + rng() * 0.15);
      const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, size * 0.85);
      g.addColorStop(0, rgb(pal.accent, 0.75));
      g.addColorStop(0.4, rgb(pal.mid, 0.45));
      g.addColorStop(1, rgb(pal.mid, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      if (pattern === 'sun') {
        // retro sun disc + slats
        ctx.fillStyle = rgb(pal.accent, 0.9);
        ctx.beginPath();
        ctx.arc(size / 2, size * 0.58, size * 0.21, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgb(pal.bg, 1);
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(size * 0.2, size * (0.55 + i * 0.055), size * 0.6, size * 0.012);
        }
      }
      break;
    }
  }
  ctx.restore();
}

function paintGrain(ctx: CanvasRenderingContext2D, size: number, rng: () => number): void {
  const dots = Math.floor(size * 1.2);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const v = rng() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.03 + rng() * 0.05})`;
    ctx.fillRect(rng() * size, rng() * size, 1.4, 1.4);
  }
  ctx.restore();
  // vignette
  const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Render a cover synchronously. Returns a data URL, or null when canvas
 * is unavailable (SSR / very old WebView) so callers can use CSS fallback.
 */
export function renderAlbumArtSync(opts: AlbumArtOptions): string | null {
  try {
    const size = opts.size ?? 512;
    const key = `${albumArtCacheKey(opts)}@${size}`;
    const hit = cache.get(key);
    if (hit) return hit;

    const seed = hashSeed(`${opts.title ?? ''}::${opts.genre ?? ''}::${opts.artist ?? ''}::${opts.saveSeed ?? ''}`);
    const rng = seededRandom(seed);
    const pal = shiftHue(paletteForGenre(opts.genre), rng);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // base gradient
    const base = ctx.createLinearGradient(0, 0, size, size);
    base.addColorStop(0, rgb(pal.bg, 1));
    base.addColorStop(0.55, rgb(pal.mid, 0.55));
    base.addColorStop(1, rgb(pal.bg, 1));
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    paintPattern(ctx, pal.pattern, size, pal, rng);

    // centre medallion — gives every cover a focal point
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(2, size / 200);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * (0.2 + rng() * 0.06), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // score foil: high scores get a golden diagonal sheen baked in
    if (typeof opts.score === 'number' && opts.score >= 80) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, 0.12 + (opts.score - 80) * 0.012);
      const sheen = ctx.createLinearGradient(0, 0, size, size);
      sheen.addColorStop(0.42, 'rgba(255,255,255,0)');
      sheen.addColorStop(0.5, 'rgba(255,235,180,1)');
      sheen.addColorStop(0.58, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }

    paintGrain(ctx, size, rng);

    const url = canvas.toDataURL('image/png');
    if (cache.size > 60) {
      const first = cache.keys().next();
      if (!first.done) cache.delete(first.value);
    }
    cache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

/** Async wrapper kept for service-layer compatibility (remote-first, local fallback). */
export async function renderAlbumArt(opts: AlbumArtOptions): Promise<string | null> {
  return renderAlbumArtSync(opts);
}

export function clearAlbumArtCache(): void {
  cache.clear();
}
