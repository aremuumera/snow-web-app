import type { Config } from "tailwindcss";
import { lightThemeVariations, darkThemeVariations } from "./src/styles/theme";
import { typography } from "./src/styles/typography";
import app_colors from "./src/styles/color";
import { app_config } from "./src/utils/config";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: app_colors[app_config.theme as keyof typeof app_colors],
        secondary: app_colors[app_config.theme as keyof typeof app_colors],
        light: lightThemeVariations,
        dark: darkThemeVariations,
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },

        // Theme-aware semantic colors
        background: {
          light: lightThemeVariations[50],
          dark: darkThemeVariations[900],
        },
        surface: {
          light: lightThemeVariations[75],
          dark: darkThemeVariations[800],
        },
        card: {
          light: lightThemeVariations[75],
          dark: darkThemeVariations[700],
        },
        disabled: {
          light: lightThemeVariations[300],
          dark: darkThemeVariations[600],
        },
        foreground: {
          light: lightThemeVariations[150],
          dark: darkThemeVariations[750],
        },
        "text-primary": {
          light: "#000000",
          dark: "#ffffff",
        },
        "text-secondary": {
          light: lightThemeVariations[600],
          dark: darkThemeVariations[100],
        },
        "text-tertiary": {
          light: lightThemeVariations[500],
          dark: darkThemeVariations[300],
        },
        "text-disabled": {
          light: lightThemeVariations[400],
          dark: darkThemeVariations[500],
        },
        "text-foreground": {
          light: lightThemeVariations[700],
          dark: darkThemeVariations[200],
        },
        border: {
          light: lightThemeVariations[200],
          dark: darkThemeVariations[400],
        },

        // Custom named colors
        green: app_colors.green,
        red: app_colors.red,
        yellow: app_colors.yellow,
        purple: app_colors.purple,
        california: app_colors.california,
        chateauGreen: app_colors.chateauGreen,
        lightGreen: app_colors.lightGreen,
        darkBlue: app_colors.darkBlue,
        nevada: app_colors.nevada,
        shakespeare: app_colors.shakespeare,
        stormGrey: app_colors.stormGrey,
        tomatoOrange: app_colors.tomatoOrange,
      },
      fontFamily: {
        "primary-light": ["var(--font-mona-sans)", "sans-serif"],
        "primary-regular": ["var(--font-mona-sans)", "sans-serif"],
        "primary-medium": ["var(--font-mona-sans)", "sans-serif"],
        "primary-semibold": ["var(--font-mona-sans)", "sans-serif"],
        "primary-bold": ["var(--font-mona-sans)", "sans-serif"],
        "secondary-light": ["var(--font-manrope)", "sans-serif"],
        "secondary-regular": ["var(--font-manrope)", "sans-serif"],
        "secondary-medium": ["var(--font-manrope)", "sans-serif"],
        "secondary-semibold": ["var(--font-manrope)", "sans-serif"],
        "secondary-bold": ["var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-mona-sans)", "sans-serif"],
        "sans-manrope": ["var(--font-manrope)", "sans-serif"],
      },
      fontSize: {
        h1: [`${typography.heading.h1.fontSize}px`, `${typography.heading.h1.lineHeight}px`],
        h2: [`${typography.heading.h2.fontSize}px`, `${typography.heading.h2.lineHeight}px`],
        h3: [`${typography.heading.h3.fontSize}px`, `${typography.heading.h3.lineHeight}px`],
        h4: [`${typography.heading.h4.fontSize}px`, `${typography.heading.h4.lineHeight}px`],
        h5: [`${typography.heading.h5.fontSize}px`, `${typography.heading.h5.lineHeight}px`],
        h6: [`${typography.heading.h6.fontSize}px`, `${typography.heading.h6.lineHeight}px`],
        h7: [`${typography.heading.h7.fontSize}px`, `${typography.heading.h7.lineHeight}px`],
        h8: [`${typography.heading.h8.fontSize}px`, `${typography.heading.h8.lineHeight}px`],
        b1: [`${typography.body.b1.fontSize}px`, `${typography.body.b1.lineHeight}px`],
        b2: [`${typography.body.b2.fontSize}px`, `${typography.body.b2.lineHeight}px`],
        b3: [`${typography.body.b3.fontSize}px`, `${typography.body.b3.lineHeight}px`],
      },
      fontWeight: {
        regular: typography.fontWeight.regular,
        medium: typography.fontWeight.medium,
        semiBold: typography.fontWeight.semiBold,
        bold: typography.fontWeight.bold,
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      screens: {
        xs: "320px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
