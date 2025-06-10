import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useSettings } from './contexts/SettingsContext';
import { useEffect } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';

const RootComponent = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <SettingsProvider>
    <RootComponent />
  </SettingsProvider>
);
