"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import { AppIcon } from "@/components/ui/AppIcon";
import { paths } from "@/utils/paths";
import { app_config } from "@/utils/config";
import { Sun, Moon, X, ChevronDown, ChevronUp, Home } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDrawer } from "@/context/DrawerContext";

import { AnimatedLogo } from "@/components/ui/AnimatedLogo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggleColorMode } = useTheme();
  const { openDrawer } = useDrawer();

  // Local state for expandable submenus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "Bills & Services": false,
    "Giftcards": false,
    "Crypto": false,
  });

  const toggleSubmenu = (menuLabel: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  const navItems = [
    {
      label: "Home",
      route: paths.dashboard.home,
      iconName: "home",
    },
    {
      label: "Wallet",
      route: paths.dashboard.wallet,
      iconName: "wallet",
    },
    {
      label: "Bills & Services",
      iconName: "bill",
      children: [
        { label: "Airtime", drawer: "airtime", icon: "airtime" },
        { label: "Data Plan", drawer: "data", icon: "data" },
        { label: "Cable TV", drawer: "cable", icon: "tv" },
        { label: "Electricity", drawer: "electricity", icon: "elect" },
        { label: "Betting", drawer: "betting", icon: "betting" },
      ],
    },
    {
      label: "Giftcards",
      iconName: "giftcard",
      children: [
        { label: "Buy Giftcard", drawer: "buy-giftcard", icon: "buy-giftcard" },
        { label: "Sell Giftcard", drawer: "sell-giftcard", icon: "sell-giftcard" },
      ],
    },
    {
      label: "Crypto",
      iconName: "crypto",
      children: [
        { label: "Sell Crypto", drawer: "sell-crypto", icon: "crypto" },
      ],
    },
    {
      label: "Calculator",
      route: paths.dashboard.calculator,
      iconName: "calc",
    },
    {
      label: "Transactions",
      route: paths.dashboard.transactionHistory,
      iconName: "history",
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

  const sidebarContent = (
    <>
      {/* Logo Area */}
      <div className="flex items-center justify-between px-2 mb-8">
        {/* <img
                src={isDark ? app_config.LogoLight : app_config.LogoDark}
                alt={app_config.name}
                className="h-7 object-contain"
              /> */}
        <AnimatedLogo />
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-xl hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-none">
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedMenus[item.label];
            return (
              <div key={item.label} className="flex flex-col gap-1 w-full">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-b2 font-primary-medium transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:bg-light-75 dark:hover:bg-dark-800 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <AppIcon
                      name={item.iconName}
                      size={20}
                      color={isDark ? "#8E8E8E" : "#B5B5B5"}
                      noBg
                    />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary-light/70" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary-light/70" />
                  )}
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-1 pl-4 border-l border-border-light dark:border-border-dark ml-6 mt-0.5 mb-1.5 transition-all">
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        onClick={() => {
                          openDrawer(child.drawer as any);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-b3 font-primary-medium text-text-secondary-light/95 dark:text-text-secondary-dark/95 hover:bg-light-75 dark:hover:bg-dark-800/60 transition-colors cursor-pointer text-left"
                      >
                        <AppIcon
                          name={child.icon}
                          size={16}
                          color={isDark ? "#8E8E8E" : "#B5B5B5"}
                          noBg
                        />
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            item.route === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.route || (item.route && pathname.startsWith(item.route + "/"));
          let iconName = item.iconName;
          if (item.iconName === "home") {
            iconName = isActive ? "home_active" : "home_inactive";
          } else if (item.iconName === "history") {
            iconName = "history";
          } else {
            iconName = isActive ? `${item.iconName}-active` : item.iconName;
          }

          return (
            <Link
              key={item.route}
              href={item.route || "#"}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-b2 font-primary-medium transition-colors
                ${isActive
                  ? "bg-light-100 dark:bg-dark-700 text-primary-500 dark:text-primary-400 font-primary-bold"
                  : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-light-75 dark:hover:bg-dark-800"
                }
              `}
            >
              {item.iconName === "home" ? (
                <Home
                  className="w-5 h-5 shrink-0"
                  strokeWidth={1.8}
                  color={isActive ? "var(--color-primary-500)" : (isDark ? "#8E8E8E" : "#B5B5B5")}
                />
              ) : (
                <AppIcon
                  name={iconName}
                  size={20}
                  color={isActive ? "var(--color-primary-500)" : (isDark ? "#8E8E8E" : "#B5B5B5")}
                  noBg
                />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls / Theme Switcher */}
      <div className="border-t border-border-light dark:border-border-dark pt-4 flex items-center justify-between px-2">
        <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
          Theme
        </span>
        <button
          onClick={toggleColorMode}
          className="p-2 rounded-xl bg-light-100 dark:bg-dark-800 hover:bg-light-200 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-dark-900 border-r border-border-light dark:border-border-dark py-6 px-4 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-over drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black"
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="relative w-72 h-full bg-white dark:bg-dark-900 border-r border-border-light dark:border-border-dark py-6 px-4 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
