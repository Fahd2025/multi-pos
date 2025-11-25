'use client';

import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { Theme } from '@/stores/ThemeStore';

export const ThemeSwitcher = observer(() => {
  const themeStore = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes: Array<{ value: Theme; icon: typeof SunIcon; label: string }> = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
  ];

  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-md transition-all text-gray-600 dark:text-gray-400"
            title={label}
            aria-label={`Switch to ${label.toLowerCase()} mode`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => themeStore.setTheme(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all
            ${
              themeStore.theme === value
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          title={label}
          aria-label={`Switch to ${label.toLowerCase()} mode`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';

// Alternative compact version - icon only toggle
export const ThemeSwitcherCompact = observer(() => {
  const themeStore = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the icon after component mounts on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before mount, show a neutral icon to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const Icon = themeStore.isDark ? SunIcon : MoonIcon;

  return (
    <button
      onClick={() => themeStore.toggleTheme()}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Current: ${themeStore.theme} mode`}
      aria-label="Toggle theme"
    >
      <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
});

ThemeSwitcherCompact.displayName = 'ThemeSwitcherCompact';
