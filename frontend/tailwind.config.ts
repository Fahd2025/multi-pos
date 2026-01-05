import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override default screens to prevent container generation issues
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "hsl(var(--ring))",

        // Premium Glassmorphism Colors
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.7)",
          dark: "rgba(10, 10, 10, 0.7)",
          border: "rgba(255, 255, 255, 0.2)",
        },

        // Theme semantic colors
        success: "var(--success)",
        warning: "var(--warning)",
        info: "var(--info)",

        // Feature domain colors with alpha support (legacy - kept for backwards compatibility)
        sales: "rgb(var(--color-sales) / <alpha-value>)",
        inventory: "rgb(var(--color-inventory) / <alpha-value>)",
        customers: "rgb(var(--color-customers) / <alpha-value>)",
        expenses: "rgb(var(--color-expenses) / <alpha-value>)",
        purchases: "rgb(var(--color-purchases) / <alpha-value>)",
        reports: "rgb(var(--color-reports) / <alpha-value>)",
        users: "rgb(var(--color-users) / <alpha-value>)",
        settings: "rgb(var(--color-settings) / <alpha-value>)",
        tables: "rgb(var(--color-tables) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        pending: "rgb(var(--color-pending) / <alpha-value>)",

        // Chart colors to match globals.css
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
          3: "hsl(var(--chart-3) / <alpha-value>)",
          4: "hsl(var(--chart-4) / <alpha-value>)",
          5: "hsl(var(--chart-5) / <alpha-value>)",
        },
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],

        // POS-specific typography
        "price-sm": ["1.125rem", { lineHeight: "1.5rem", fontWeight: "700" }],
        "price-md": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "price-lg": ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
      },

      spacing: {
        // Safe area insets for notched devices
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },

      minHeight: {
        "touch-target": "48px", // WCAG 2.1 Level AAA
        "touch-target-sm": "44px", // iOS Human Interface Guidelines
        "touch-target-lg": "56px", // Material Design 3
      },

      minWidth: {
        "touch-target": "48px", // WCAG 2.1 Level AAA
        "touch-target-sm": "44px", // iOS Human Interface Guidelines
        "touch-target-lg": "56px", // Material Design 3
      },

      gap: {
        touch: "0.5rem", // 8px - minimum touch spacing
        "touch-md": "0.75rem", // 12px
        "touch-lg": "1rem", // 16px
      },

      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },

      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-once": "pulse 0.4s ease-out",
        "click-scale": "clickScale 0.1s ease-out",
        "fly-to-cart": "flyToCart 0.5s ease-in-out forwards",
      },

      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(37, 99, 235, 0.7)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 10px rgba(37, 99, 235, 0)" },
        },
        clickScale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        flyToCart: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.5) translate(100px, -100px)", opacity: "0.7" },
          "100%": { transform: "scale(0) translate(200px, -200px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
