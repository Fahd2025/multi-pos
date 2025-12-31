/**
 * Enhanced Theme Store with Advanced Configuration
 *
 * Manages theme mode, presets, custom colors, and advanced settings like
 * border radius, font scaling, spacing, animations, and accessibility features.
 */

import { makeAutoObservable, reaction } from 'mobx';
import { ThemeConfig, ThemeMode, ThemeStyle } from '@/types/branch-settings';
import { getPresetById, getDefaultPreset } from '@/lib/theme-presets';

export type Theme = 'light' | 'dark';

class ThemeStore {
  // Basic theme mode
  theme: Theme = 'light';

  // Full theme configuration
  config: ThemeConfig = {
    mode: 'light',
    style: 'preset',
    presetId: 'default',
    borderRadius: 'md',
    fontScale: 1,
    spacing: 'comfortable',
    enableAnimations: true,
    animationSpeed: 'normal',
    highContrast: false,
    reducedMotion: false,
  };

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== 'undefined') {
      // Load saved config from localStorage
      this.loadFromLocalStorage();

      // Auto-apply theme when config changes
      reaction(
        () => this.config,
        (config) => {
          this.applyThemeToDOM(config);
          this.saveToLocalStorage();
        },
        { fireImmediately: true }
      );

      // Listen for system preference changes if mode is 'auto'
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.config.mode === 'auto') {
          this.applyThemeToDOM(this.config);
        }
      });
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromLocalStorage() {
    try {
      const savedConfig = localStorage.getItem('themeConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsed };
        this.theme = this.getEffectiveMode(this.config.mode);
      }
    } catch (error) {
      console.error('Failed to load theme config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveToLocalStorage() {
    try {
      localStorage.setItem('themeConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save theme config:', error);
    }
  }

  /**
   * Get effective mode (light/dark) from mode setting
   */
  private getEffectiveMode(mode: ThemeMode): Theme {
    if (mode === 'auto') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light';
    }
    return mode;
  }

  /**
   * Set full theme configuration
   */
  setConfig(config: ThemeConfig) {
    this.config = config;
    this.theme = this.getEffectiveMode(config.mode);
  }

  /**
   * Set theme mode (light/dark/auto)
   */
  setTheme(mode: Theme) {
    this.config = { ...this.config, mode };
    this.theme = mode;
  }

  /**
   * Set theme mode including auto
   */
  setMode(mode: ThemeMode) {
    this.config = { ...this.config, mode };
    this.theme = this.getEffectiveMode(mode);
  }

  /**
   * Toggle between light and dark
   */
  toggleTheme() {
    const newMode = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newMode);
  }

  /**
   * Set theme style (preset/custom) and optional preset ID
   */
  setStyle(style: ThemeStyle, presetId?: string) {
    this.config = {
      ...this.config,
      style,
      ...(style === 'preset' && presetId ? { presetId } : {}),
    };
  }

  /**
   * Set custom colors for both light and dark modes
   */
  setCustomColors(customColors: ThemeConfig['customColors']) {
    this.config = {
      ...this.config,
      style: 'custom',
      customColors,
    };
  }

  /**
   * Set border radius
   */
  setBorderRadius(borderRadius: ThemeConfig['borderRadius']) {
    this.config = { ...this.config, borderRadius };
  }

  /**
   * Set font scale (0.8 to 1.2)
   */
  setFontScale(fontScale: number) {
    this.config = { ...this.config, fontScale };
  }

  /**
   * Set spacing (compact/comfortable/spacious)
   */
  setSpacing(spacing: ThemeConfig['spacing']) {
    this.config = { ...this.config, spacing };
  }

  /**
   * Toggle animations on/off
   */
  toggleAnimations() {
    this.config = {
      ...this.config,
      enableAnimations: !this.config.enableAnimations,
    };
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed: ThemeConfig['animationSpeed']) {
    this.config = { ...this.config, animationSpeed: speed };
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast() {
    this.config = {
      ...this.config,
      highContrast: !this.config.highContrast,
    };
  }

  /**
   * Toggle reduced motion
   */
  toggleReducedMotion() {
    this.config = {
      ...this.config,
      reducedMotion: !this.config.reducedMotion,
    };
  }

  /**
   * Apply theme configuration to DOM
   */
  private applyThemeToDOM(config: ThemeConfig) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Apply mode (light/dark/auto)
    const effectiveMode = this.getEffectiveMode(config.mode);

    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update theme property for consistency
    this.theme = effectiveMode;

    // Get colors based on style
    let colors;
    if (config.style === 'preset' && config.presetId) {
      const preset = getPresetById(config.presetId) || getDefaultPreset();
      colors = effectiveMode === 'dark' ? preset.dark : preset.light;
    } else if (config.style === 'custom' && config.customColors) {
      colors =
        effectiveMode === 'dark'
          ? config.customColors.dark
          : config.customColors.light;
    } else {
      const defaultPreset = getDefaultPreset();
      colors = effectiveMode === 'dark' ? defaultPreset.dark : defaultPreset.light;
    }

    // Apply CSS custom properties for colors
    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        if (value) {
          // Convert camelCase to kebab-case
          const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVar, value);
        }
      });
    }

    // Apply border radius
    const radiusMap = {
      none: '0rem',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    };
    root.style.setProperty(
      '--radius',
      radiusMap[config.borderRadius || 'md']
    );

    // Apply font scale
    root.style.setProperty('--font-scale', String(config.fontScale || 1));
    // Also apply to font-size for immediate effect
    const baseFontSize = 16; // Base font size in pixels
    root.style.fontSize = `${baseFontSize * (config.fontScale || 1)}px`;

    // Apply spacing scale
    const spacingMap = {
      compact: '0.85',
      comfortable: '1',
      spacious: '1.15',
    };
    root.style.setProperty(
      '--spacing-scale',
      spacingMap[config.spacing || 'comfortable']
    );

    // Apply animation settings
    if (!config.enableAnimations || config.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      const speedMap = {
        slow: '0.5s',
        normal: '0.3s',
        fast: '0.15s',
      };
      const duration = speedMap[config.animationSpeed || 'normal'];
      root.style.setProperty('--animation-duration', duration);
      root.style.setProperty('--transition-duration', duration);
    }

    // Apply accessibility settings
    if (config.reducedMotion) {
      root.style.setProperty('--prefers-reduced-motion', 'reduce');
    } else {
      root.style.setProperty('--prefers-reduced-motion', 'no-preference');
    }

    // Apply high contrast mode
    if (config.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  /**
   * Computed: is current mode dark?
   */
  get isDark(): boolean {
    if (this.config.mode === 'auto') {
      return typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    }
    return this.theme === 'dark';
  }

  /**
   * Computed: get current preset if style is 'preset'
   */
  get currentPreset() {
    if (this.config.style === 'preset' && this.config.presetId) {
      return getPresetById(this.config.presetId);
    }
    return undefined;
  }

  /**
   * Computed: get effective mode name for display
   */
  get effectiveModeName(): string {
    if (this.config.mode === 'auto') {
      return this.isDark ? 'dark (auto)' : 'light (auto)';
    }
    return this.theme;
  }
}

// Create singleton instance
export const themeStore = new ThemeStore();
