'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { themeStore } from '@/stores/ThemeStore';

const ThemeContext = createContext(themeStore);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = observer(({ children }: ThemeProviderProps) => {
  useEffect(() => {
    // Force reapply theme on mount to ensure it's applied
    const currentTheme = themeStore.theme;
    themeStore.setTheme(currentTheme);
  }, []);

  return (
    <ThemeContext.Provider value={themeStore}>
      {children}
    </ThemeContext.Provider>
  );
});

ThemeProvider.displayName = 'ThemeProvider';
