# Theme Switcher Documentation

## Overview

This Next.js application now includes a comprehensive light/dark theme switcher powered by **MobX** for state management. The theme switcher provides three modes:
- **Light Mode**: Classic light theme
- **Dark Mode**: Dark theme optimized for low-light environments
- **System Mode**: Automatically follows the user's system theme preference

## Features

- 🌓 Three theme modes (Light, Dark, System)
- 💾 Persistent theme preference (saved to localStorage)
- 🔄 Automatic system theme detection
- 🎨 Smooth transitions between themes
- 📱 Responsive design
- ⚡ MobX for reactive state management
- 🎯 TypeScript support

## Installation

The required dependencies are already installed:
```bash
npm install mobx mobx-react-lite
```

## ⚠️ Critical: Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4**, which has a different configuration system than v3. The following setup is REQUIRED:

### 1. Tailwind Config (`tailwind.config.ts`)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // ✅ REQUIRED for class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... rest of config
};

export default config;
```

### 2. Global Styles (`app/globals.css`)
```css
@import "tailwindcss";
@config "../tailwind.config.ts"; /* ✅ REQUIRED - tells Tailwind v4 to read the config */

/* ... rest of styles */
```

**Without the `@config` directive, Tailwind v4 will NOT read your `darkMode: 'class'` setting!**

## File Structure

```
frontend/
├── stores/
│   ├── ThemeStore.ts          # MobX store for theme management
│   └── index.ts               # Store exports
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx  # Theme context provider
│   └── shared/
│       ├── ThemeSwitcher.tsx  # Theme switcher components
│       └── index.ts           # Component exports
└── app/
    ├── layout.tsx             # Root layout with ThemeProvider
    └── globals.css            # Global styles with theme variables
```

## Usage

### 1. Basic Implementation

The theme switcher is already integrated into the application. The `ThemeProvider` is wrapped around the entire app in `app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Using the Theme Switcher Component

#### Full Theme Switcher (with labels)

```tsx
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';

export default function MyPage() {
  return (
    <div>
      <ThemeSwitcher />
    </div>
  );
}
```

This renders a segmented control with three buttons: Light, Dark, and System.

#### Compact Theme Switcher (icon only)

```tsx
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';

export default function MyPage() {
  return (
    <div>
      <ThemeSwitcherCompact />
    </div>
  );
}
```

This renders a single button that toggles between themes.

### 3. Using the Theme Store Directly

You can access the theme store directly in any component:

```tsx
import { useTheme } from '@/components/providers/ThemeProvider';
import { observer } from 'mobx-react-lite';

const MyComponent = observer(() => {
  const themeStore = useTheme();

  return (
    <div>
      <p>Current theme: {themeStore.theme}</p>
      <p>Effective theme: {themeStore.effectiveTheme}</p>
      <p>Is dark mode: {themeStore.isDark ? 'Yes' : 'No'}</p>

      <button onClick={() => themeStore.setTheme('dark')}>
        Set Dark Mode
      </button>

      <button onClick={() => themeStore.toggleTheme()}>
        Toggle Theme
      </button>
    </div>
  );
});
```

### 4. Accessing the Store Without React

```tsx
import { themeStore } from '@/stores';

// Get current theme
const currentTheme = themeStore.theme;

// Set theme
themeStore.setTheme('dark');

// Toggle theme
themeStore.toggleTheme();
```

## Theme Store API

### Properties

- `theme: 'light' | 'dark' | 'system'` - The currently selected theme mode
- `systemTheme: 'light' | 'dark'` - The detected system theme
- `effectiveTheme: 'light' | 'dark'` - The actual theme being applied (computed)
- `isDark: boolean` - Whether the effective theme is dark (computed)

### Methods

- `setTheme(theme: 'light' | 'dark' | 'system')` - Set the theme mode
- `toggleTheme()` - Cycle through themes: light → dark → system → light

## Styling with Themes

### Using Tailwind Dark Mode Classes

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  This content adapts to the theme
</div>
```

### Using CSS Variables

The following CSS variables are available and automatically update with theme changes:

**Light Mode:**
```css
--background: #ffffff
--foreground: #171717
--card: #ffffff
--primary: #2563eb
--secondary: #f3f4f6
--muted: #f9fafb
--border: #e5e7eb
```

**Dark Mode:**
```css
--background: #0a0a0a
--foreground: #ededed
--card: #1a1a1a
--primary: #3b82f6
--secondary: #262626
--muted: #171717
--border: #262626
```

Usage in CSS:
```css
.my-component {
  background: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}
```

## Examples

### Example 1: Adding Theme Switcher to Header

```tsx
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <ThemeSwitcherCompact />
    </header>
  );
}
```

### Example 2: Creating a Custom Theme-Aware Component

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useTheme } from '@/components/providers/ThemeProvider';

const CustomCard = observer(({ children }) => {
  const themeStore = useTheme();

  return (
    <div className={`
      p-6 rounded-lg
      ${themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}
    `}>
      {children}
      <p className="text-xs mt-4">
        Current theme: {themeStore.effectiveTheme}
      </p>
    </div>
  );
});

export default CustomCard;
```

### Example 3: Conditional Rendering Based on Theme

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useTheme } from '@/components/providers/ThemeProvider';

const Logo = observer(() => {
  const themeStore = useTheme();

  return (
    <img
      src={themeStore.isDark ? '/logo-dark.png' : '/logo-light.png'}
      alt="Logo"
    />
  );
});
```

## Browser Support

- All modern browsers that support:
  - CSS Custom Properties
  - LocalStorage
  - matchMedia API

## Performance

- ⚡ Lightweight: MobX provides minimal overhead
- 🎯 Selective re-rendering: Only components using the theme store re-render on theme change
- 💾 Persistent: Theme preference saved to localStorage
- 🔄 Efficient: Uses CSS variables for instant theme switching

## Troubleshooting

### Theme not persisting after refresh
- Check browser localStorage is enabled
- Verify no errors in browser console

### Flash of unstyled content on load
- The `suppressHydrationWarning` prop on `<html>` prevents hydration warnings
- Theme is applied on client mount to prevent FOUC
- Theme switcher components use a `mounted` state to prevent hydration mismatches

### Hydration Errors
If you see hydration errors in the console:
- The theme switcher components already handle this with the `mounted` state pattern
- They render a placeholder during SSR and only show the actual state after client mount
- This prevents server/client HTML mismatches

### Theme not applying to some components
- Ensure components use Tailwind's `dark:` classes or CSS variables
- Verify component is within the `ThemeProvider`

## Migration Guide

If you want to add the theme switcher to existing pages:

1. Import the component:
```tsx
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';
```

2. Add dark mode classes to your existing Tailwind classes:
```tsx
// Before
<div className="bg-white text-black">

// After
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
```

## Advanced Customization

### Creating Custom Theme Colors

Edit `globals.css` to add custom theme colors:

```css
:root {
  --my-custom-color: #ff6b6b;
}

.dark {
  --my-custom-color: #ff8787;
}
```

Then use in Tailwind config or CSS:
```css
.my-element {
  color: var(--my-custom-color);
}
```

### Extending the Theme Store

You can extend the ThemeStore with additional functionality:

```typescript
import { makeAutoObservable } from 'mobx';
import { themeStore as baseThemeStore } from '@/stores/ThemeStore';

class ExtendedThemeStore extends baseThemeStore.constructor {
  fontSize: 'small' | 'medium' | 'large' = 'medium';

  constructor() {
    super();
    makeAutoObservable(this);
  }

  setFontSize(size: 'small' | 'medium' | 'large') {
    this.fontSize = size;
    // Apply font size logic...
  }
}
```

## License

Part of the Multi-Branch POS System

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
