import confetti from 'canvas-confetti';

/**
 * Fires celebratory particles for hit records, high grades, and milestone awards.
 * Guards safely against SSR or headless test environments.
 */
export function triggerMilestoneCelebration(grade?: string, certification?: string): void {
  if (typeof window === 'undefined') return;

  const isPlatinum = certification?.toLowerCase().includes('platinum');
  const isGold = certification?.toLowerCase().includes('gold');
  const isTopGrade = grade && ['S', 'A+', 'A'].includes(grade.toUpperCase());

  if (isPlatinum) {
    // Platinum Record: shimmering silver/cyan/white dual-cannon blast
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#E5E7EB', '#F3F4F6', '#67E8F9', '#93C5FD', '#FFFFFF'],
    });
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#E5E7EB', '#F3F4F6', '#67E8F9', '#93C5FD', '#FFFFFF'],
    });
  } else if (isGold) {
    // Gold Record: rich gold and amber fountain
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { x: 0.5, y: 0.65 },
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#D97706', '#FEF3C7'],
    });
  } else if (isTopGrade) {
    // A/S Tier hit song celebration
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B'],
    });
  }
}

/**
 * General purpose lightweight confetti pop for project completion
 */
export function triggerProjectCompleteJuice(): void {
  if (typeof window === 'undefined') return;

  confetti({
    particleCount: 45,
    spread: 55,
    origin: { x: 0.5, y: 0.7 },
  });
}
