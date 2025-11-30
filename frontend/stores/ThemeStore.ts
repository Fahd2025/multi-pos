import { makeAutoObservable, reaction } from 'mobx';

export type Theme = 'light' | 'dark';

class ThemeStore {
  theme: Theme = 'light';

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== 'undefined') {
      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.theme = savedTheme;
      }

      // Use MobX reaction to automatically apply theme when theme changes
      reaction(
        () => this.theme,
        (theme) => {
          this.applyThemeToDOM(theme);
        },
        { fireImmediately: true }
      );
    }
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  }

  private applyThemeToDOM(theme: 'light' | 'dark') {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  get isDark(): boolean {
    return this.theme === 'dark';
  }
}

// Create a singleton instance
export const themeStore = new ThemeStore();
