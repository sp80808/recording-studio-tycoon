import React, { useState } from 'react';
import { useBoxDropsStore } from '../features/boxDrops/boxDropsStore';
import { PerformanceOverlay } from './dev/PerformanceOverlay';

export const DevMenu: React.FC = () => {
  const trigger = useBoxDropsStore((s: any) => s.triggerDrop);
  const [showPerfOverlay, setShowPerfOverlay] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 p-2 bg-white border rounded shadow flex flex-col gap-2 z-50">
        <button
          onClick={() => trigger('1970s', 2)}
          className="px-3 py-2 bg-sky-600 text-white rounded text-xs font-semibold"
        >
          DEV: Spawn Box Drop
        </button>
        <button
          onClick={() => setShowPerfOverlay((prev) => !prev)}
          className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
        >
          DEV: {showPerfOverlay ? 'Hide Perf HUD' : 'Show Perf HUD'}
        </button>
      </div>
      {showPerfOverlay && <PerformanceOverlay onClose={() => setShowPerfOverlay(false)} />}
    </>
  );
};

export default DevMenu;
