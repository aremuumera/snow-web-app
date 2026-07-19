"use client";

import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { Loader2 } from "lucide-react";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "outline" | "danger" | "success" | "warning";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-b3",
  sm: "px-4 py-2 text-b3",
  md: "px-5 py-2.5 text-b2",
  lg: "px-6 py-3 text-b1",
  xl: "px-8 py-4 text-b1",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const { theme, isDark } = useTheme();
  const themeColors = colorThemes[theme];

  const getVariantClasses = (): string => {
    switch (variant) {
      case "primary":
        return `text-white hover:opacity-90 active:opacity-80`;
      case "secondary":
        return isDark
          ? "bg-dark-600 text-dark-50 hover:bg-dark-500 active:bg-dark-400"
          : "bg-light-100 text-light-900 hover:bg-light-200 active:bg-light-300";
      case "tertiary":
        return isDark
          ? "bg-transparent text-dark-50 hover:bg-dark-700 active:bg-dark-600"
          : "bg-transparent text-light-900 hover:bg-light-100 active:bg-light-200";
      case "ghost":
        return isDark
          ? "bg-transparent text-dark-50 hover:bg-dark-700"
          : "bg-transparent text-light-900 hover:bg-light-100";
      case "outline":
        return isDark
          ? `bg-transparent border border-dark-300 text-dark-50 hover:bg-dark-700`
          : `bg-transparent border border-light-200 text-light-900 hover:bg-light-100`;
      case "danger":
        return "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700";
      case "success":
        return "bg-success-500 text-white hover:bg-success-600 active:bg-success-700";
      case "warning":
        return "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700";
      default:
        return "";
    }
  };

  const primaryBgStyle = variant === "primary" ? { backgroundColor: themeColors[500] } : {};

  return (
    <button
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${fullWidth ? "w-full" : ""}
        rounded-full
        font-primary-semibold
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        select-none
        ${className}
      `}
      style={primaryBgStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
