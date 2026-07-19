"use client";

import React from "react";
import { GuestGuard } from "@/guards/GuestGuard";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { app_config } from "@/utils/config";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, isDark } = useTheme();
  const themeColors = colorThemes[theme];

  return (
    <GuestGuard>
      <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark lg:overflow-hidden">
        {/* Left Side: Forms */}
        <div className="w-full lg:w-1/2 lg:h-screen flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-20 overflow-y-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-md w-full mx-auto pt-12 lg:pt-24">
            {/* Header logo */}
            <div className="flex mb-8 justify-start">
              <img
                src={isDark ? app_config.LogoLight : app_config.LogoDark}
                alt={app_config.name}
                className="h-7 object-contain "
              />
            </div>
            {children}
          </div>
        </div>

        {/* Right Side: Gradient Panel */}
        <div
          className="hidden lg:flex lg:w-1/2 lg:h-screen flex-col justify-between p-12 lg:p-20 relative select-none overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, ${themeColors[500]} 0%, ${themeColors[700]} 100%)`,
          }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/icons/logo-dark-png.png"
              alt={app_config.name}
              className="h-10 object-contain brightness-0 invert"
            />
          </div>

          {/* Illustration/Tagline */}
          <div className="flex flex-col gap-6 text-white max-w-lg">
            <h2 className="text-h2 font-primary-bold tracking-tight">
              Trade Gift Cards & Crypto Instantly.
            </h2>
            <p className="text-b1 font-primary-medium opacity-90 leading-relaxed">
              Experience the fastest payouts, best rates, and secure transaction systems. Pay bills, buy airtime, and manage all your digital assets in one white-label ready platform.
            </p>
          </div>

          {/* Footer Info */}
          <div className="text-white/60 text-b3 font-primary-regular">
            © {new Date().getFullYear()} {app_config.name_v1}. All rights reserved.
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
