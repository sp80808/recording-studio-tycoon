import { useState, useEffect } from 'react';

type Theme = 'modern' | 'vintage' | 'dark' | 'light';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('gameTheme') as Theme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('gameTheme', theme);
  };

  return {
    currentTheme,
    changeTheme
  };
}; 