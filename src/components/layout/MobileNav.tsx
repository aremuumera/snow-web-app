"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { paths } from "@/utils/paths";
import { useTheme } from "@/context/ThemeProvider";

export function MobileNav() {
  const pathname = usePathname();
  const { isDark } = useTheme();

  const navItems = [
    {
      label: "Home",
      route: paths.dashboard.home,
      iconName: "home",
    },
    {
      label: "Calculator",
      route: paths.dashboard.calculator,
      iconName: "calc",
    },
    {
      label: "Wallet",
      route: paths.dashboard.wallet,
      iconName: "wallet",
    },
    {
      label: "Messages",
      route: paths.dashboard.messages,
      iconName: "chat-tab",
    },
    {
      label: "Settings",
      route: paths.settings.base,
      iconName: "setting",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-dark-900 border-t border-border-light dark:border-border-dark flex items-center justify-around z-40 pb-safe">
      {navItems.map((item) => {
        const isActive =
          item.route === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.route || pathname.startsWith(item.route + "/");
        let iconName = item.iconName;
        if (item.iconName === "home") {
          iconName = isActive ? "home_active" : "home_inactive";
        } else {
          iconName = isActive ? `${item.iconName}-active` : item.iconName;
        }

        return (
          <Link
            key={item.route}
            href={item.route}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-1 text-center select-none cursor-pointer"
          >
            <AppIcon
              name={iconName}
              size={22}
              color={isActive ? "var(--color-primary-500)" : (isDark ? "#8E8E8E" : "#B5B5B5")}
            />
            <span
              className={`text-[10px] font-primary-medium transition-colors ${
                isActive ? "text-primary-500 dark:text-primary-400 font-primary-bold" : "text-text-secondary-light dark:text-text-secondary-dark"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
export default MobileNav;
