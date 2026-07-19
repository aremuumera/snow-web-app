"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { logout, setSelectedAvatarId } from "@/redux/auth/auth_slice";
import { clearSession } from "@/redux/auth/session";
import { useDeleteAccountMutation } from "@/redux/settings/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastProvider";
import { ArrowLeft, Trash2, Mail, Phone, UserCircle, AtSign, Camera } from "lucide-react";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { CenterModal } from "@/components/modals/CenterModal";

interface Avatar {
  id: string;
  name: string;
  gender: "male" | "female";
  path: string;
}

const AVATARS: Avatar[] = [
  { id: "boy1", name: "Boy Avatar 1", gender: "male", path: "/images/african-man-avatar.png" },
  { id: "boy2", name: "Boy Avatar 2", gender: "male", path: "/images/man-avatar.png" },
  { id: "boy3", name: "Boy Avatar 3", gender: "male", path: "/images/bussiness-man-avatar.png" },
  { id: "boy4", name: "Boy Avatar 4", gender: "male", path: "/images/black-avatar.png" },
  { id: "boy5", name: "Boy Avatar 5", gender: "male", path: "/images/gamer-avatar.png" },
  { id: "boy6", name: "Boy Avatar 6", gender: "male", path: "/images/profile.png" },
  { id: "girl1", name: "Girl Avatar 1", gender: "female", path: "/images/lady-avatar.png" },
  { id: "girl2", name: "Girl Avatar 2", gender: "female", path: "/images/avatar-girl.png" },
  { id: "girl3", name: "Girl Avatar 3", gender: "female", path: "/images/black-girl-avatar.png" },
  { id: "girl4", name: "Girl Avatar 4", gender: "female", path: "/images/woman-avatar.png" },
  { id: "girl5", name: "Girl Avatar 5", gender: "female", path: "/images/arab-woman-avatar.png" },
];

export default function AccountInfoPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const authUser = useAppSelector((state: any) => state.auth.user);
  const selectedAvatarId = useAppSelector((state: any) => state.auth.selectedAvatarId);
  const userInfo = authUser?.user || authUser || {};

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const [filter, setFilter] = useState<"all" | "male" | "female">("all");
  const [tempSelectedAvatarId, setTempSelectedAvatarId] = useState<string | null>(selectedAvatarId);

  const selectedAvatar = AVATARS.find((av) => av.id === selectedAvatarId) || AVATARS[9]; // girl6/boy6 or default
  const previewAvatar = AVATARS.find((av) => av.id === tempSelectedAvatarId) || selectedAvatar;

  const filteredAvatars = AVATARS.filter((avatar) => {
    if (filter === "all") return true;
    return avatar.gender === filter;
  });

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount({ data: {} }).unwrap();
      showToast("Account deleted successfully.", "info");
      TokenManager.removeToken();
      dispatch(logout());
      dispatch(clearSession());
      router.push(paths.auth.login);
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to delete account.", "error");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const handleConfirmAvatar = () => {
    if (tempSelectedAvatarId) {
      dispatch(setSelectedAvatarId(tempSelectedAvatarId));
      showToast("Profile avatar updated!", "success");
    }
    setAvatarModalOpen(false);
  };

  const infoFields = [
    { label: "Full Name", value: userInfo?.full_name || userInfo?.name || "", icon: <UserCircle className="w-5 h-5" /> },
    { label: "Email Address", value: userInfo?.email || "", icon: <Mail className="w-5 h-5" /> },
    { label: "Phone Number", value: userInfo?.phone || "", icon: <Phone className="w-5 h-5" /> },
    { label: "Username", value: userInfo?.username || "", icon: <AtSign className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Account Information
        </h3>
      </div>

      {/* Profile Avatar Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex items-center gap-4">
        <div className="relative cursor-pointer" onClick={() => { setTempSelectedAvatarId(selectedAvatarId); setAvatarModalOpen(true); }}>
          <div className="w-20 h-20 rounded-full overflow-hidden bg-light-100 dark:bg-dark-800 border-2 border-primary-500/20 shrink-0">
            <img src={selectedAvatar.path} alt={selectedAvatar.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-1.5 border-2 border-surface-light dark:border-surface-dark">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            {userInfo?.full_name || userInfo?.name || userInfo?.username || "User"}
          </h4>
          <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            {userInfo?.email || ""}
          </p>
          <button
            onClick={() => { setTempSelectedAvatarId(selectedAvatarId); setAvatarModalOpen(true); }}
            className="text-b3 font-primary-semibold text-primary-500 hover:text-primary-600 transition-colors text-left mt-1"
          >
            Change avatar
          </button>
        </div>
      </div>

      {/* Info Fields */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-5">
        {infoFields.map((field) => (
          <div key={field.label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-700 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark shrink-0">
              {field.icon}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-b3 font-primary-medium text-text-tertiary-light dark:text-text-tertiary-dark">
                {field.label}
              </span>
              <span className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                {field.value || "Not set"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="bg-danger-500/10 border border-danger-500/20 p-6 rounded-[24px] flex flex-col gap-4">
        <h4 className="text-b1 font-primary-bold text-danger-500 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <span>Danger Zone</span>
        </h4>
        <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Permanently delete your account and all associated transactions, gift cards, and wallet balance data. This action is irreversible.
        </p>
        <Button onClick={() => setDeleteConfirmOpen(true)} variant="danger" className="self-start">
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <CenterModal visible={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Account">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            Are you sure you want to delete your account? This action is permanent and cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setDeleteConfirmOpen(false)} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button onClick={handleDeleteAccount} variant="danger" fullWidth loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </CenterModal>

      {/* Avatar Selection Modal */}
      <CenterModal visible={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} title="Choose Avatar">
        <div className="flex flex-col gap-5 overflow-visible">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-2 py-4 bg-light-50 dark:bg-dark-800 rounded-2xl">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500 bg-light-100 dark:bg-dark-700">
              <img src={previewAvatar.path} alt={previewAvatar.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              {previewAvatar.name}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(["all", "male", "female"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFilter(gender)}
                className={`flex-1 py-2 rounded-xl text-b3 font-primary-bold capitalize border transition-all ${
                  filter === gender
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark border-border-light dark:border-border-dark hover:bg-light-100 dark:hover:bg-dark-700"
                }`}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
            {filteredAvatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setTempSelectedAvatarId(avatar.id)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 bg-light-50 dark:bg-dark-800 ${
                  tempSelectedAvatarId === avatar.id
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-transparent hover:border-light-200 dark:hover:border-dark-700"
                }`}
              >
                <img src={avatar.path} alt={avatar.name} className="w-full h-full object-cover rounded-xl" />
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setAvatarModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" fullWidth onClick={handleConfirmAvatar}>
              Save Avatar
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
