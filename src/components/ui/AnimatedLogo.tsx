"use client";

import React from "react";
import { motion } from "motion/react";
import { useTheme } from "@/context/ThemeProvider";
import { app_config } from "@/utils/config";

interface AnimatedLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

export function AnimatedLogo({ className = "", iconSize = 32 }: AnimatedLogoProps) {
  const { isDark } = useTheme();
  
  // Use the actual brand SVG logo paths from configuration
  const logoSrc = isDark ? app_config.LogoLight : app_config.LogoDark;

  return (
    <div className={`relative flex items-center select-none overflow-hidden ${className}`}>
      {/* Wipe/reveal wrapper with clip path and scale/opacity animation */}
      <motion.div
        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.7 }}
        animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="relative flex items-center"
      >
        <img
          src={logoSrc}
          alt={app_config.name}
          style={{ height: `${iconSize}px` }}
          className="object-contain"
        />
      </motion.div>
    </div>
  );
}
