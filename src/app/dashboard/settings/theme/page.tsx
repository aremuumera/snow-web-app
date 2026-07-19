"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme, ThemeName, ColorMode } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { appThemes } from "@/utils/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Check, Sun, Moon, Laptop } from "lucide-react";

export default function ThemeCustomizationPage() {
  const router = useRouter();
  const { theme: activeTheme, colorMode, setTheme, setColorMode, isDark } = useTheme();

  const themeDisplayNames: Record<ThemeName, string> = {
    blue: "Royal Blue",
    green: "Forest Green",
    red: "Crimson Red",
    purple: "Vibrant Purple",
    yellow: "Mellow Yellow",
    california: "California Orange",
    chateauGreen: "Chateau Green",
    lightGreen: "Lime Green",
    darkBlue: "Midnight Blue",
    nevada: "Nevada Dust",
    shakespeare: "Shakespeare Blue",
    stormGrey: "Stormy Grey",
    tomatoOrange: "Tomato Orange",
    lightBlue: "Light Blue",
  };

  const modeOptions: { value: ColorMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
    { value: "system", label: "System", icon: <Laptop className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Theme & Customization
        </h3>
      </div>

      {/* Light / Dark Mode Switches */}
      <div className="flex flex-col gap-3">
        <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark px-1">
          Color Scheme Mode
        </h4>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-[20px] grid grid-cols-3 gap-3">
          {modeOptions.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setColorMode(mode.value)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer select-none
                ${colorMode === mode.value
                  ? "border-primary-500 bg-primary-500/10 text-primary-500 dark:text-primary-400 font-primary-bold"
                  : "bg-white dark:bg-dark-900/40 border-border-light dark:border-border-dark hover:bg-light-100 dark:hover:bg-dark-700 text-text-secondary-light dark:text-text-secondary-dark"
                }
              `}
            >
              {mode.icon}
              <span className="text-b3">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Color Selections */}
      <div className="flex flex-col gap-3">
        <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark px-1">
          Brand Primary Accent
        </h4>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] grid grid-cols-2 sm:grid-cols-3 gap-4">
          {appThemes.map((themeName) => {
            const themeColors = colorThemes[themeName];
            const isSelected = activeTheme === themeName;

            return (
              <button
                key={themeName}
                onClick={() => setTheme(themeName as ThemeName)}
                className={`
                  flex items-center gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all select-none
                  ${isSelected
                    ? "border-primary-500 bg-primary-500/10 font-primary-bold"
                    : "bg-white dark:bg-dark-900/40 border-border-light dark:border-border-dark hover:bg-light-100 dark:hover:bg-dark-700"
                  }
                `}
              >
                {/* Color Dot indicator */}
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white"
                  style={{ backgroundColor: themeColors[500] }}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-3" />}
                </div>
                <span className="text-b3 text-text-primary-light dark:text-text-primary-dark truncate">
                  {themeDisplayNames[themeName as ThemeName] || themeName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
