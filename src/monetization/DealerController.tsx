// DealerController — Flight Case Monetisation (bead 89o.5).
// Flag-gated entry point. Flag off (default) → renders nothing: zero
// behaviour change to the core loop. Never auto-opens; explicit clicks only.

import React from 'react';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import { useDealerStore } from './store';
import DealerModal from './DealerModal';

export const DealerController: React.FC = () => {
  const dealerEnabled = useFeatureFlag('monetisation-dealer');
  const { dealerOpen, setDealerOpen } = useDealerStore();
  if (!dealerEnabled) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setDealerOpen(true)}
        aria-label="Open Flight Case Dealer"
        className="fixed bottom-4 right-4 z-40 px-3 py-2 rounded bg-stone-900/90 border border-amber-700 text-amber-300 text-xs font-mono shadow-lg hover:bg-stone-800"
      >
        📦 CASE DEALER
      </button>
      <DealerModal open={dealerOpen} onClose={() => setDealerOpen(false)} />
    </>
  );
};

export default DealerController;
