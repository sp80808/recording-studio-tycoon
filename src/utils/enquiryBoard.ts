import type { Project } from '@/types/game';

export type EnquiryFitFilter = 'all' | 'excellent' | 'good' | 'stretch';
export type EnquirySort = 'recommended' | 'fee' | 'rep' | 'quick';

const FIT_RANK: Record<string, number> = { Excellent: 0, Good: 1, Poor: 2 };

export function matchesEnquiryQuery(p: Pick<Project, 'title' | 'genre' | 'clientName' | 'clientType'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [p.title, p.genre, p.clientName ?? '', p.clientType ?? ''].some((f) =>
    f.toLowerCase().includes(q),
  );
}

export function matchesEnquiryFit(
  p: Pick<Project, 'matchRating' | 'isStoryContract'>,
  fit: EnquiryFitFilter,
): boolean {
  if (p.isStoryContract) return true; // story always pinned regardless of filter
  if (fit === 'all') return true;
  if (fit === 'excellent') return p.matchRating === 'Excellent';
  if (fit === 'good') return p.matchRating === 'Excellent' || p.matchRating === 'Good';
  return p.matchRating === 'Poor';
}

/**
 * Filter + sort the bookings board. Story contracts pin to the top in every
 * mode; everything else follows the selected sort. Pure — safe to unit check.
 */
export function filterAndSortBoard<T extends Project>(
  offers: readonly T[],
  opts: { query: string; fit: EnquiryFitFilter; sort: EnquirySort },
): T[] {
  return [...offers]
    .filter((p) => matchesEnquiryQuery(p, opts.query) && matchesEnquiryFit(p, opts.fit))
    .sort((a, b) => {
      const story = Number(Boolean(b.isStoryContract)) - Number(Boolean(a.isStoryContract));
      if (story !== 0) return story;
      if (opts.sort === 'fee') return (b.payoutBase ?? 0) - (a.payoutBase ?? 0);
      if (opts.sort === 'rep') return (b.repGainBase ?? 0) - (a.repGainBase ?? 0);
      if (opts.sort === 'quick') return (a.durationDaysTotal ?? 99) - (b.durationDaysTotal ?? 99);
      return (
        (FIT_RANK[a.matchRating] ?? 9) - (FIT_RANK[b.matchRating] ?? 9) ||
        (b.repGainBase ?? 0) - (a.repGainBase ?? 0)
      );
    });
}
