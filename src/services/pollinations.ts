import { renderAlbumArtSync } from '@/utils/albumArt';

/**
 * Album art is rendered in-house (deterministic canvas art). The game no longer
 * calls any remote or same-origin art/text endpoint: those 404 on
 * static hosting and added a failing request to every review (#338/#345).
 * The filename is kept so existing imports keep working.
 */
export async function generateAlbumArt(prompt: string, opts?: { title?: string; genre?: string; saveSeed?: string | number }): Promise<string> {
  try {
    const local = renderAlbumArtSync({ title: opts?.title ?? prompt.slice(0, 80), genre: opts?.genre, saveSeed: opts?.saveSeed });
    if (local) return local;
  } catch (err) {
    console.warn('generateAlbumArt local render failed', err);
  }
  // Callers treat placeholder as "no art" and show CSS art.
  return '/placeholder.svg';
}
