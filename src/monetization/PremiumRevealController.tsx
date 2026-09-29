// PremiumRevealController — Flight Case Monetisation (bead 89o.6).
// Plays the existing case reveal as celebration after a verified purchase.
// Flag-gated; renders nothing when the flag is off or no celebration is
// staged. The modal receives display-only data — it cannot mint rewards.

import React, { useEffect } from 'react';
import CrateUnboxingModal from '@/features/boxDrops/CrateUnboxingModal';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import { getActiveExperimentId } from './experiments';
import { celebrationToDisplay } from './reveal';
import { useDealerStore } from './store';
import { trackPremiumCaseOpened } from './telemetry';

export const PremiumRevealController: React.FC = () => {
  const premiumEnabled = useFeatureFlag('premium-cases');
  const { celebration, clearCelebration } = useDealerStore();

  useEffect(() => {
    if (!premiumEnabled || !celebration) return;
    trackPremiumCaseOpened({
      sku: celebration.sku,
      experimentId: getActiveExperimentId(),
    });
  }, [premiumEnabled, celebration?.sku]);

  if (!premiumEnabled || !celebration) return null;
  return (
    <CrateUnboxingModal
      items={[]}
      source="purchase"
      titleOverride={celebration.productTitle}
      premium={{
        productTitle: celebration.productTitle,
        items: celebrationToDisplay(celebration.sku, celebration.refs),
      }}
      onClose={clearCelebration}
    />
  );
};

export default PremiumRevealController;
