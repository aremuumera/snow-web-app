"use client";

import React, { useState, useEffect } from "react";
import { useGetNotificationMutation } from "@/redux/auth/auth_api";
import { AppIcon } from "@/components/ui/AppIcon";
import { Loader2, BellOff, Info } from "lucide-react";
import { TokenManager } from "@/utils/token-manager";

export default function NotificationsPage() {
  const [getNotifications, { isLoading }] = useGetNotificationMutation();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = TokenManager.getToken();
        const res = await getNotifications({ data: { token } }).unwrap();
        if (res?.data?.notifications) {
          setNotifications(res.data.notifications);
        } else if (res?.notifications) {
          setNotifications(res.notifications);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    fetchNotifs();
  }, [getNotifications]);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h3 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Notifications
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Stay updated with your account activity, transactions, and offers.
        </p>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif: any) => (
            <div key={notif.id} className="p-5 flex gap-4 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                  {notif.message || notif.title}
                </h4>
                {notif.description && notif.description !== notif.message && (
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    {notif.description}
                  </p>
                )}
                <span className="text-[10px] font-primary-regular text-text-disabled-light dark:text-text-disabled-dark">
                  {notif.date || (notif.created_at || notif.timestamp ? new Date(notif.created_at || notif.timestamp).toLocaleString() : "")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <BellOff className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary-dark" />
            <div>
              <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                No notifications yet
              </p>
              <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                We'll notify you here when there's news about your account.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
