import React from 'react';
import { StatIcon } from '@/components/icons/GameIcons';
import { FEATURE_COPY, type ProducerFeature } from '@/rpg/featureUnlocks';

/** One-shot "technique unlocked" moment (#260). Renders only the head of the
 *  reveal queue, so several crossed thresholds never stack overlays. */
export const FeatureRevealBanner: React.FC<{ feature: ProducerFeature | null; onAcknowledge: (f: ProducerFeature) => void }> = ({
  feature,
  onAcknowledge,
}) => {
  if (!feature) return null;
  const copy = FEATURE_COPY[feature];
  return (
    <div
      role="status"
      data-rst-feature-reveal={feature}
      className="flex items-center gap-2 rounded-[2px] border border-amber-400/50 bg-amber-400/[0.12] px-2.5 py-1.5 text-amber-100"
    >
      <StatIcon name="flame" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[11px] font-mono font-bold uppercase">{copy.title}</div>
        <div className="text-[11px] text-amber-100/80">{copy.body}</div>
      </div>
      <button
        type="button"
        onClick={() => onAcknowledge(feature)}
        className="h-7 shrink-0 rounded-[2px] border border-amber-400/50 px-2 text-[10px] font-mono font-bold uppercase hover:bg-amber-400/20"
      >
        Got it
      </button>
    </div>
  );
};
