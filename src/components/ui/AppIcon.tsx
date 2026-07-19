"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeProvider";

interface AppIconProps {
  name: string; // The base name of the icon (e.g. 'notification', 'wallet', 'mtn')
  size?: number;
  className?: string;
  color?: string; // Optional override color — defaults to primary-500 via CSS var
  noBg?: boolean;
}

// Theme-aware icons that have -light/-dark variants and use currentColor in their SVG markup
const themeAwareIcons = [
  "airtime",
  "betting",
  "bill",
  "bank",
  "buy-giftcard",
  "chat",
  "crypto",
  "data",
  "elect",
  "friends",
  "gift-reward",
  "giftcard",
  "head-support",
  "headPhone",
  "history",
  "instagram",
  "kyc",
  "logout",
  "message",
  "no-trans",
  "notification",
  "password",
  "payment",
  "pin",
  "profile",
  "rank",
  "rate",
  "receipt-bg",
  "redeem",
  "refer",
  "reward",
  "security",
  "sell-giftcard",
  "share",
  "support",
  "theme",
  "tv",
  "twitter",
  "verify",
  "website",
  "whatsapp",
];

// PNG icons that should never be fetched inline
const pngIcons = [
  "success-tick",
  "verified-up",
  "unverified-down",
  "auth-logo",
  "icon",
  "favicon",
  "rank-light",
  "rank-dark",
  "atrader-splash-dark",
  "atrader-splash-light",
  "breppo-splash-dark",
  "breppo-splash-light",
];

// Icons that should be fetched and rendered inline as SVGs but do not have separate light/dark files
const inlineOnlyIcons = [
  "home_active",
  "home_inactive",
  "wallet",
  "wallet-active",
  "calc",
  "calc-active",
  "chat-tab",
  "chat-tab-active",
  "setting",
  "setting-active",
  "ward",
  "wdard",
  "wdaru",
  "wallet-aru",
];

// Simple in-memory cache so we don't re-fetch the same SVG on every render
const svgCache: Record<string, string> = {};

export function AppIcon({ name, size = 24, className = "", color, noBg }: AppIconProps) {
  const { isDark } = useTheme();
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Resolve the source path
  let src = `/icons/${name}.svg`;
  let isPng = false;

  if (name === "chat-tab") {
    src = "/icons/chat.svg";
  } else if (name === "chat-tab-active") {
    src = "/icons/chat-active.svg";
  }

  const isThemeAware = themeAwareIcons.includes(name);
  const isInlineOnly = inlineOnlyIcons.includes(name);

  const shortSuffixIcons = [
    "airtime",
    "betting",
    "bill",
    "crypto",
    "data",
    "elect",
    "giftcard",
    "tv",
    "history",
    "rank",
  ];

  if (isThemeAware) {
    if (shortSuffixIcons.includes(name)) {
      const isBettingLight = name === "betting" && !isDark;
      const base = isBettingLight ? "beeting" : name;
      const suffix = isDark ? "-d" : "-l";
      src = `/icons/${base}${suffix}.svg`;
    } else {
      const suffix = isDark ? "-dark" : "-light";
      src = `/icons/${name}${suffix}.svg`;
    }
  } else if (["mtn", "glo", "airtel", "mobile9", "dstv", "gotv", "startimes", "xbox"].includes(name.toLowerCase())) {
    const filename = name.toLowerCase() === "mobile9" ? "9mobilee" : name.toLowerCase();
    src = `/images/${filename}.svg`;
  }

  if (pngIcons.includes(name)) {
    src = `/icons/${name}.png`;
    isPng = true;
  }

  // Rank special case — uses rank-d.svg / rank-l.svg (currentColor SVGs, not the leaderboard PNGs)
  if (name === "rank") {
    const suffix = isDark ? "-d" : "-l";
    src = `/icons/rank${suffix}.svg`;
    isPng = false;
  }

  const isSvg = src.endsWith(".svg");
  const shouldRenderInline = isSvg && (isThemeAware || isInlineOnly || name === "rank");

  // Fetch SVG content inline for theme-aware/inline-only icons so currentColor works
  useEffect(() => {
    if (!shouldRenderInline) {
      setSvgContent(null);
      return;
    }

    // Check cache first
    if (svgCache[src]) {
      setSvgContent(svgCache[src]);
      return;
    }

    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${src}`);
        return res.text();
      })
      .then((text) => {
        svgCache[src] = text;
        if (!cancelled) setSvgContent(text);
      })
      .catch(() => {
        if (!cancelled) setSvgContent(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src, shouldRenderInline]);

  // For theme-aware or inline-only SVGs: render inline so CSS `color` flows to `currentColor` in the SVG
  if (shouldRenderInline && svgContent) {
    let finalSvg = svgContent;

    if (noBg) {
      // 1. Remove background rect from the SVG string
      finalSvg = finalSvg.replace(/<rect[^>]*\/>/g, '');

      // 2. Crop the viewBox to only enclose the path coordinates if it is a 38x38 SVG
      if (name === "crypto" || name === "giftcard") {
        finalSvg = finalSvg.replace('viewBox="0 0 38 38"', 'viewBox="7.33 7.33 23.34 23.34"');
      } else if (name === "bill") {
        finalSvg = finalSvg.replace('viewBox="0 0 38 38"', 'viewBox="5.5 5.5 28 28"');
      }
    }

    // Replace the SVG's hardcoded width/height with 100% so it scales to the container
    const scaledSvg = finalSvg
      .replace(/(<svg[^>]*)\swidth="[^"]*"/, '$1 width="100%"')
      .replace(/(<svg[^>]*)\sheight="[^"]*"/, '$1 height="100%"');

    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          color: color || "currentColor",
        }}
        dangerouslySetInnerHTML={{ __html: scaledSvg }}
      />
    );
  }

  // For non-theme-aware icons and PNGs: use regular <img>
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="object-contain w-full h-full"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.endsWith(".svg")) {
            target.src = `/icons/${name}.png`;
          } else {
            target.src = "/icons/favicon.png";
          }
        }}
      />
    </div>
  );
}
export default AppIcon;
