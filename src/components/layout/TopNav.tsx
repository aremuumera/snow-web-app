"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Loader2, Info } from "lucide-react";
import { ProfileDropdown } from "./ProfileDropdown";
import { Dropdown } from "@/components/modals/Dropdown";
import { useGetNotificationMutation } from "@/redux/auth/auth_api";
import { TokenManager } from "@/utils/token-manager";
import { paths } from "@/utils/paths";

interface TopNavProps {
  onToggleSidebar: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [getNotifications, { isLoading }] = useGetNotificationMutation();
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;
      const res = await getNotifications({ data: { token } }).unwrap();
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
      } else if (res?.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications in top nav", err);
    }
  }, [getNotifications]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs, pathname]); // Re-fetch on pathname change in case they view / dismiss notifs

  // Simple logic to parse page title from route
  const getPageTitle = () => {
    if (pathname === paths.dashboard.home) return "Dashboard";
    if (pathname.startsWith(paths.dashboard.wallet)) return "My Wallet";
    if (pathname.startsWith(paths.dashboard.calculator)) return "Calculator";
    if (pathname.startsWith(paths.dashboard.messages)) return "Messages";
    if (pathname.startsWith(paths.settings.base)) return "Settings";
    if (pathname.startsWith(paths.dashboard.notifications)) return "Notifications";
    if (pathname.startsWith(paths.dashboard.transactionHistory)) return "Transactions";
    if (pathname.startsWith("/dashboard/bills")) return "Pay Bills";
    if (pathname.startsWith("/dashboard/giftcards")) return "Gift Cards";
    if (pathname.startsWith("/dashboard/crypto")) return "Crypto Assets";
    return "Dashboard";
  };

  const notificationTrigger = (
    <div className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-800 transition-colors text-text-primary-light dark:text-text-primary-dark relative cursor-pointer">
      <Bell className="w-5 h-5" />
      {notifications.length > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 border border-white dark:border-dark-900 animate-pulse" />
      )}
    </div>
  );

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white dark:bg-dark-900 border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        {/* Hamburger menu — visible only on mobile */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-light-100 dark:hover:bg-dark-800 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-h7 md:text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <Dropdown trigger={notificationTrigger} align="right" className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:w-96 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Notifications
            </span>
            {notifications.length > 0 && (
              <span className="text-[10px] bg-primary-100 dark:bg-primary-950/40 text-primary-500 px-2 py-0.5 rounded-full font-primary-bold">
                {notifications.length} new
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border-light dark:divide-border-dark [scrollbar-width:thin]">
            {isLoading ? (
              <div className="py-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.slice(0, 4).map((notif: any) => (
                <div key={notif.id} className="p-4 flex gap-3 hover:bg-light-100 dark:hover:bg-dark-700/50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <p className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate">
                      {notif.message || notif.title}
                    </p>
                    {notif.description && notif.description !== notif.message && (
                      <p className="text-[11px] font-primary-regular text-text-secondary-light dark:text-text-secondary-dark line-clamp-2 leading-snug">
                        {notif.description}
                      </p>
                    )}
                    <span className="text-[9px] font-primary-regular text-text-tertiary-light dark:text-text-tertiary-dark mt-0.5">
                      {notif.date || (notif.created_at || notif.timestamp ? new Date(notif.created_at || notif.timestamp).toLocaleString() : "")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center px-4">
                <p className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                  No notifications yet
                </p>
                <p className="text-[11px] font-primary-regular text-text-secondary-light dark:text-text-secondary-dark max-w-[200px]">
                  We'll notify you here when there's news about your account.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border-light dark:border-border-dark p-2 bg-light-50 dark:bg-dark-900/50">
            <button
              onClick={() => router.push(paths.dashboard.notifications)}
              className="w-full text-center py-2 text-b3 font-primary-bold text-primary-500 hover:text-primary-600 transition-colors cursor-pointer block"
            >
              View all
            </button>
          </div>
        </Dropdown>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
export default TopNav;
