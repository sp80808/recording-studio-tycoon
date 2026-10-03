import React, { Suspense } from 'react';

const BalanceLab = React.lazy(() => import('./BalanceLab'));

/** Mounts the lab only in development and only when the URL asks for it (`?balanceLab`). */
export const BalanceLabLauncher: React.FC = () => {
  if (!import.meta.env.DEV) return null;
  if (!new URLSearchParams(window.location.search).has('balanceLab')) return null;
  return <Suspense fallback={null}><BalanceLab /></Suspense>;
};

export default BalanceLabLauncher;
