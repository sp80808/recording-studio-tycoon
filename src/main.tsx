import React, { Suspense } from 'react'; // Import React and Suspense
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from './App.tsx';
import './index.css';
import { useSettings, SettingsProvider } from './contexts/SettingsContext';
import { useEffect } from 'react';
import './i18n'; // Import the i18n configuration

const RootComponent = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback="Loading..."> {/* Wrap with Suspense for translation loading */}
      <SettingsProvider>
        <RootComponent />
      </SettingsProvider>
    </Suspense>
    <SpeedInsights />
  </React.StrictMode>
);
