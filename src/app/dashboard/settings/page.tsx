"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { logout, setUser } from "@/redux/auth/auth_slice";
import { clearSession } from "@/redux/auth/session";
import { useToggleNotificationMutation } from "@/redux/settings/settings";
import { AppIcon } from "@/components/ui/AppIcon";
import { CenterModal } from "@/components/modals/CenterModal";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { ChevronRight, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { app_config } from "@/utils/config";

export default function SettingsHubPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const authUser = useAppSelector((state: any) => state.auth.user);
  const userInfo = authUser?.user || authUser || {};
  const username = userInfo?.username || `${app_config.name} User`;
  const email = userInfo?.email || "user@example.com";
  const verifyAccountStatus = userInfo?.verify_account ?? 0;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toggleNotification, { isLoading: isToggling }] = useToggleNotificationMutation();

  const isNotificationEnabled = userInfo?.notify_send === 1;
  const [localNotificationEnabled, setLocalNotificationEnabled] = useState(isNotificationEnabled);

  useEffect(() => {
    setLocalNotificationEnabled(isNotificationEnabled);
  }, [isNotificationEnabled]);

  const handleNotificationToggle = async () => {
    const newValue = !localNotificationEnabled;
    setLocalNotificationEnabled(newValue);

    try {
      await toggleNotification({
        switch: newValue ? 1 : 0,
      }).unwrap();

      // Update Redux state with new notify_send status
      if (authUser) {
        dispatch(
          setUser({
            ...authUser,
            user: {
              ...(authUser.user || authUser),
              notify_send: newValue ? 1 : 0,
            },
          })
        );
      }
      showToast(newValue ? "Notifications enabled" : "Notifications disabled", "success");
    } catch (error) {
      // Revert UI on error
      setLocalNotificationEnabled(!newValue);
      showToast("Failed to update notification settings", "error");
    }
  };

  const handleLogout = () => {
    TokenManager.removeToken();
    dispatch(logout());
    dispatch(clearSession());
    router.push(paths.auth.login);
  };

  const selectedAvatarId = useAppSelector((state: any) => state.auth.selectedAvatarId);

  const getAvatarPath = (id: string | null) => {
    if (!id) return null;
    const paths: Record<string, string> = {
      boy1: "/images/african-man-avatar.png",
      boy2: "/images/man-avatar.png",
      boy3: "/images/bussiness-man-avatar.png",
      boy4: "/images/black-avatar.png",
      boy5: "/images/gamer-avatar.png",
      boy6: "/images/profile.png",
      girl1: "/images/lady-avatar.png",
      girl2: "/images/avatar-girl.png",
      girl3: "/images/black-girl-avatar.png",
      girl4: "/images/woman-avatar.png",
      girl5: "/images/arab-woman-avatar.png",
    };
    return paths[id] || null;
  };

  const avatarPath = getAvatarPath(selectedAvatarId);

  const menuItems = [
    {
      label: "Account Information",
      icon: "profile",
      action: () => router.push(paths.settings.account),
    },
    {
      label: "KYC Level",
      icon: "kyc",
      extra: verifyAccountStatus === 1 ? "Verified" : "Unverified",
      action: () => router.push(paths.settings.kyc),
    },
    {
      label: "Theme Settings",
      icon: "theme",
      action: () => router.push(paths.settings.theme),
    },
    {
      label: "Security",
      icon: "security",
      action: () => router.push(paths.settings.security),
    },
    {
      label: "Notifications",
      icon: "notification",
      isSwitch: true,
    },
    {
      label: "Payment Bank",
      icon: "payment",
      action: () => router.push(paths.settings.banks),
    },
    {
      label: "Refer Friends",
      icon: "refer",
      action: () => router.push(paths.settings.referrals),
    },
    {
      label: "Leaderboard Rank",
      icon: "rank",
      iconType: "container" as const,
      action: () => router.push(paths.settings.rank),
    },
    {
      label: "Support Chats",
      icon: "chat",
      iconType: "container" as const,
      action: () => router.push("/dashboard/messages"),
    },
    {
      label: "Contact Support",
      icon: "support",
      action: () => router.push(paths.settings.support),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark px-1">
        Settings
      </h3>

      {/* User Info Header Summary */}
      <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-6 rounded-[24px] flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white dark:bg-dark-800 flex items-center justify-center text-primary-500 font-primary-bold text-h6 border border-border-light dark:border-border-dark shrink-0">
          {avatarPath ? (
            <img src={avatarPath} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              {username}
            </h4>
            {verifyAccountStatus === 1 ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-success-500/10 text-success-500 font-primary-bold px-2 py-0.5 rounded-full border border-success-500/20">
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-danger-500/10 text-danger-500 font-primary-bold px-2 py-0.5 rounded-full border border-danger-500/20">
                Unverified
              </span>
            )}
          </div>
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            {email}
          </p>
        </div>
      </div>

      {/* Settings Options List */}
      <div className="flex flex-col gap-3">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={item.isSwitch ? undefined : item.action}
            className={`w-full flex items-center justify-between bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[20px] p-2 ${
              item.isSwitch ? "" : "cursor-pointer hover:bg-light-75 dark:hover:bg-dark-700/50 transition-colors"
            }`}
          >
            <div className="flex items-center gap-3">
              {item.iconType === "container" ? (
                <div className="w-[46px] h-[46px] rounded-2xl bg-[#efefefa1] dark:bg-[#000000] flex items-center justify-center shrink-0">
                  <AppIcon name={item.icon} size={22} color="var(--color-primary-500)" />
                </div>
              ) : (
                <div className="flex items-center justify-center shrink-0">
                  <AppIcon name={item.icon} size={46} color="var(--color-primary-500)" />
                </div>
              )}
              <span className="text-b1 font-primary-medium text-text-primary-light dark:text-text-primary-dark ml-1">
                {item.label}
              </span>
            </div>

            {item.isSwitch ? (
              <button
                disabled={isToggling}
                onClick={handleNotificationToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  localNotificationEnabled ? "bg-primary-500" : "bg-light-300 dark:bg-dark-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                    localNotificationEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            ) : (
              <div className="flex items-center gap-2 pr-1">
                {item.extra && (
                  <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                    {item.extra}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
              </div>
            )}
          </div>
        ))}

        {/* Logout Row */}
        <div
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[20px] p-2 cursor-pointer hover:bg-danger-500/5 hover:border-danger-500/20 dark:hover:bg-danger-500/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0 w-11 h-11">
              <AppIcon name="logout" size={46} />
            </div>
            <span className="text-b1 font-primary-medium text-text-primary-light dark:text-text-primary-dark ml-1">
              Logout
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <CenterModal visible={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Logout">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            Are you sure you want to log out of your account?
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setShowLogoutModal(false)} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button onClick={handleLogout} variant="danger" fullWidth>
              Logout
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
