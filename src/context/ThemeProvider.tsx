"use client";

import { app_config, appThemes, colorMode as colorModes } from "@/utils/config";
import { useTheme as useNextTheme } from "next-themes";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { colorThemes } from "@/styles/theme";

if (typeof console !== 'undefined' && typeof console.error === 'function' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    const msg = args.map(arg => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    if (msg.includes('Encountered a script tag')) {
      return;
    }
    orig.apply(console, args);
  };
}

export type ThemeName =
  | "blue" | "green" | "red" | "purple" | "yellow"
  | "california" | "chateauGreen" | "lightGreen" | "darkBlue"
  | "nevada" | "shakespeare" | "stormGrey" | "tomatoOrange" | "lightBlue";

export type ColorMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeName;
  colorMode: ColorMode;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  defaultColorMode?: ColorMode;
}

export function ThemeProvider({
  children,
  defaultTheme = app_config.theme as ThemeName,
  defaultColorMode = "dark",
}: ThemeProviderProps) {
  const [appTheme, setAppTheme] = useState<ThemeName>(defaultTheme);
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  const isDark = resolvedTheme === "dark";

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme && isValidTheme(savedTheme)) {
      setAppTheme(savedTheme as ThemeName);
    }
  }, []);

  // Update dynamic CSS custom variables on theme change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const colors = colorThemes[appTheme as keyof typeof colorThemes];
    if (!colors) return;

    const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    keys.forEach((key) => {
      const colorValue = colors[key as keyof typeof colors];
      if (colorValue) {
        document.documentElement.style.setProperty(`--color-primary-${key}`, colorValue);
      }
    });
  }, [appTheme]);

  const setTheme = (newTheme: ThemeName) => {
    setAppTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
  };

  const setColorMode = (mode: ColorMode) => {
    setNextTheme(mode);
    localStorage.setItem("app_color_mode", mode);
  };

  const toggleColorMode = () => {
    const newMode = isDark ? "light" : "dark";
    setColorMode(newMode);
  };

  const value: ThemeContextType = {
    theme: appTheme,
    colorMode: (nextTheme as ColorMode) || defaultColorMode,
    isDark,
    setTheme,
    setColorMode,
    toggleColorMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function isValidTheme(theme: string): theme is ThemeName {
  return (appThemes as readonly string[]).includes(theme);
}
