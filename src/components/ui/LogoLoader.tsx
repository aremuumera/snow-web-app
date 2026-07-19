"use client";

import React from "react";
import { motion } from "motion/react";
import { useTheme } from "@/context/ThemeProvider";
import { app_config } from "@/utils/config";

interface LogoLoaderProps {
  className?: string;
  size?: number;
}

export function LogoLoader({ className = "", size = 48 }: LogoLoaderProps) {
  const { isDark } = useTheme();
  const logoSrc = isDark ? app_config.LogoLight : app_config.LogoDark;

  return (
    <div className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}>
      {/* Loop animation for forming/writing the logo and wiping out */}
      <motion.div
        animate={{
          clipPath: [
            "inset(0 100% 0 0)", // Start hidden
            "inset(0 0% 0 0)",   // Reveal (form itself)
            "inset(0 0% 0 0)",   // Hold visible
            "inset(0 0 0 100%)", // Wipe out
            "inset(0 100% 0 0)", // Reset hidden
          ],
          opacity: [0.4, 1, 1, 0.2, 0.4],
          scale: [0.96, 1, 1, 0.96, 0.96],
        }}
        transition={{
          duration: 2.8,
          ease: "easeInOut",
          repeat: Infinity,
          times: [0, 0.4, 0.7, 0.9, 1],
        }}
        className="relative flex items-center justify-center"
      >
        <img
          src={logoSrc}
          alt={app_config.name}
          style={{ height: `${size}px` }}
          className="object-contain"
        />
      </motion.div>
    </div>
  );
}
