import { renderAlbumArtSync } from '@/utils/albumArt';

export async function generateBandName(): Promise<string> {
  const response = await fetch('/api/pollinations/band-name');
  if (!response.ok) {
    throw new Error(`Error generating band name: ${response.statusText}`);
  }
  const data: { name: string } = await response.json();
  return data.name;
}

export async function generateAlbumArt(prompt: string, opts?: { title?: string; genre?: string; saveSeed?: string | number }): Promise<string> {
  // Remote art (when hosted) still wins — but it must fail fast so the review
  // modal never hangs on a missing endpoint. Anything else falls back to the
  // deterministic local renderer instead of a placeholder.
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2800);
    try {
      const response = await fetch(`/api/pollinations/album-art?prompt=${encodeURIComponent(prompt)}`, {
        signal: controller.signal,
      });
      if (response.ok) {
        const data: { url: string } = await response.json();
        if (data.url && !data.url.includes('placeholder')) return data.url;
      }
    } finally {
      window.clearTimeout(timeout);
    }
  } catch (err) {
    console.warn('generateAlbumArt remote failed, using local art', err);
  }
  try {
    const local = renderAlbumArtSync({ title: opts?.title ?? prompt.slice(0, 80), genre: opts?.genre, saveSeed: opts?.saveSeed });
    if (local) return local;
  } catch (err) {
    console.warn('generateAlbumArt local render failed', err);
  }
  // Last resort: callers treat placeholder as "no art" and show CSS art.
  return '/placeholder.svg';
}

export async function generateReview(projectName: string): Promise<string> {
  try {
    const prompt = `Write a concise in-universe review of the album titled '${projectName}', including critical feedback and praise.`;
    // Fail fast like generateAlbumArt: a hung request must not outlive the review modal.
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2800);
    try {
      const response = await fetch(`/api/pollinations/text?prompt=${encodeURIComponent(prompt)}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Error generating review: ${response.statusText}`);
      }
      const data: { text: string } = await response.json();
      return data.text;
    } finally {
      window.clearTimeout(timeout);
    }
  } catch (err) {
    console.warn('generateReview failed, using fallback', err);
    // Fallback: generate simple contextual review
    const positives = [
      'captivating melodies',
      'innovative production',
      'strong lyrical themes',
      'compelling performances'
    ];
    const negatives = [
      'occasionally feels repetitive',
      'could use more dynamic range',
      'some tracks lack cohesion',
      'lyrics sometimes fall flat'
    ];
    const pos = positives[Math.floor(Math.random() * positives.length)];
    const neg = negatives[Math.floor(Math.random() * negatives.length)];
    return `The album "${projectName}" delivers ${pos}, though it ${neg}.`;
  }
}
