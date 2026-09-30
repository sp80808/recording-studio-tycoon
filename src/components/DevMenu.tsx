import React from 'react';
import { useBoxDropsStore } from '../features/boxDrops/boxDropsStore';
import { PerformanceOverlay } from './dev/PerformanceOverlay';
import { RewardFxGallery } from './dev/RewardFxGallery';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Optional floating DEV chrome. Both surfaces default OFF in GameSettings and
 * only render when the player opts in via Settings → System → Developer Tools.
 * Fresh installs / reset settings never show these over the studio HUD.
 */
export const DevMenu: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const trigger = useBoxDropsStore((s) => s.triggerDrop);

  const showBoxDrop = settings.devShowBoxDropButton === true;
  const showPerfHud = settings.devShowPerfHud === true;

  if (!showBoxDrop && !showPerfHud) return null;

  return (
    <>
      {showBoxDrop && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <button
            type="button"
            onClick={() => trigger('1970s', 2)}
            className="pointer-events-auto px-3 py-2 bg-amber-600 text-stone-950 rounded text-xs font-semibold shadow border border-amber-400/40"
          >
            DEV: Spawn Box Drop
          </button>
        </div>
      )}
      {showPerfHud && (
        <>
          <PerformanceOverlay onClose={() => updateSettings({ devShowPerfHud: false })} />
          <RewardFxGallery />
        </>
      )}
    </>
  );
};

export default DevMenu;
