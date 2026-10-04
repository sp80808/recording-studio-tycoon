import React, { Suspense } from 'react';

const Workbench = React.lazy(() => import('./Workbench'));

/** Mounts the workbench only in development and only when the URL asks for it (`?contentWorkbench`). */
export const WorkbenchLauncher: React.FC = () => {
  if (!import.meta.env.DEV) return null;
  if (!new URLSearchParams(window.location.search).has('contentWorkbench')) return null;
  return <Suspense fallback={null}><Workbench /></Suspense>;
};

export default WorkbenchLauncher;
