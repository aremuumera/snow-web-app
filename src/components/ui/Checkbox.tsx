"use client";

import React, { forwardRef } from "react";
import { Check } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = "", checked, ...props }, ref) => {
    const { theme } = useTheme();
    const themeColors = colorThemes[theme];

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              ref={ref}
              checked={checked}
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                w-5 h-5
                rounded-[6px]
                border border-border-light dark:border-border-dark
                flex items-center justify-center
                transition-all duration-200
                peer-focus:ring-2 peer-focus:ring-primary-500/25
                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                ${checked ? "" : "bg-surface-light dark:bg-surface-dark"}
              `}
              style={checked ? { backgroundColor: themeColors[500], borderColor: themeColors[500] } : {}}
            >
              {checked && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
            </div>
          </div>
          {label && (
            <span className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark flex-1">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="text-b3 font-primary-regular text-danger-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
