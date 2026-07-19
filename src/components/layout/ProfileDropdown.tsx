"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { logout } from "@/redux/auth/auth_slice";
import { clearSession } from "@/redux/auth/session";
import { Dropdown } from "@/components/modals/Dropdown";
import { AppIcon } from "@/components/ui/AppIcon";
import { paths } from "@/utils/paths";
import { User, LogOut, Shield, Landmark, HelpCircle } from "lucide-react";
import { TokenManager } from "@/utils/token-manager";
import { CenterModal } from "@/components/modals/CenterModal";
import { Button } from "@/components/ui/Button";

export function ProfileDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const user = useAppSelector((state: any) => state.auth.user);

  const handleLogout = () => {
    TokenManager.removeToken();
    dispatch(logout());
    dispatch(clearSession());
    router.push(paths.auth.login);
  };

  const username = user?.user?.username || user?.username || user?.full_name || "User";
  const email = user?.user?.email || user?.email || "user@example.com";

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
  const isVerified = user?.user?.verify_account === 1 || user?.verify_account === 1;

  const trigger = (
    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="relative">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white dark:bg-dark-800 flex items-center justify-center text-primary-500 font-primary-bold text-b1 border border-border-light dark:border-border-dark shrink-0">
          {avatarPath ? (
            <img src={avatarPath} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        {isVerified && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 rounded-full border border-white dark:border-dark-900 flex items-center justify-center text-white text-[7px] font-extrabold select-none">
            ✓
          </span>
        )}
      </div>
      <div className="hidden md:flex flex-col text-left">
        <span className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          {username}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <Dropdown trigger={trigger} align="right">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex flex-col gap-0.5">
          <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate">
            {username}
          </p>
          <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark truncate">
            {email}
          </p>
        </div>

        <div className="py-1">
          <Link
            href={paths.settings.account}
            className="flex items-center gap-3 px-4 py-2.5 text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
          >
            <User className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <span>Account Info</span>
          </Link>
          <Link
            href={paths.settings.security}
            className="flex items-center gap-3 px-4 py-2.5 text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Shield className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <span>Security</span>
          </Link>
          <Link
            href={paths.settings.banks}
            className="flex items-center gap-3 px-4 py-2.5 text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Landmark className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <span>Payment Banks</span>
          </Link>
          <Link
            href={paths.settings.support}
            className="flex items-center gap-3 px-4 py-2.5 text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <span>Support</span>
          </Link>
        </div>

        <div className="border-t border-border-light dark:border-border-dark py-1">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-b2 font-primary-bold text-danger-500 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </Dropdown>

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
    </>
  );
}
export default ProfileDropdown;
