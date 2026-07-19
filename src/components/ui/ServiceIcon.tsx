"use client";

import React from "react";
import { AppIcon } from "./AppIcon";
import { useTheme } from "@/context/ThemeProvider";

interface ServiceIconProps {
  role?: string;
  name?: string;
  image?: string;
  size?: number;
}

export function ServiceIcon({ role, name, image, size = 32 }: ServiceIconProps) {
  const { isDark } = useTheme();
  const imageSource = image;
  if (imageSource && imageSource.startsWith("http")) {
    return (
      <img
        src={imageSource}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-contain shrink-0"
      />
    );
  }

  const normalizedRole = role?.toLowerCase() || "";
  let iconName = "";

  switch (normalizedRole) {
    case "airtime":
      iconName = "airtime";
      break;
    case "data":
      iconName = "data";
      break;
    case "cable":
    case "cable tv":
      iconName = "tv";
      break;
    case "electricity":
    case "bill":
      iconName = "elect";
      break;
    case "giftcard":
    case "buy gift card":
    case "sell gift card":
      iconName = "giftcard";
      break;
    case "crypto":
    case "buy crypto":
    case "sell crypto":
      iconName = "crypto";
      break;
    case "betting":
      iconName = "betting";
      break;
    case "withdrawal":
    case "debit":
      iconName = isDark ? "wdard" : "ward";
      break;
    case "deposit":
    case "credit":
      iconName = isDark ? "wdaru" : "wallet-aru";
      break;
  }

  if (iconName) {
    return <AppIcon name={iconName} size={size} color="var(--color-primary-500)" />;
  }

  const firstChar = role?.charAt(0).toUpperCase() || "T";
  return (
    <div
      style={{ width: size, height: size }}
      className="bg-light-200 dark:bg-dark-500 flex items-center justify-center rounded-[12px] shrink-0 font-primary-bold text-text-primary-light dark:text-text-primary-dark text-xs"
    >
      {firstChar}
    </div>
  );
}
