import React, { Suspense } from 'react'; // Import React and Suspense
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from './App.tsx';
import './index.css';
import { useSettings, SettingsProvider } from './contexts/SettingsContext';
import { SaveSystemProvider } from './contexts/SaveSystemContext';
import { useEffect } from 'react';
import './i18n'; // Import the i18n configuration
import { gameAudio } from './utils/audioSystem'; // Import gameAudio
import { initInteractionListener } from './utils/userInteraction'; // Import interaction listener

// Initialize audio system and interaction listener early
gameAudio.initialize().then(() => {
  console.log('Game audio system initialized from main.tsx');
}).catch(e => console.error("Error initializing game audio system from main.tsx:", e));
initInteractionListener();

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
        <SaveSystemProvider>
          <RootComponent />
        </SaveSystemProvider>
      </SettingsProvider>
    </Suspense>
    <SpeedInsights />
  </React.StrictMode>
);
