"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetChangePasswordOtpMutation, useChangePasswordMutation, useGetChangePinOtpMutation, useChangePinMutation } from "@/redux/settings/settings";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { OtpInput } from "@/components/ui/OtpInput";
import { useToast } from "@/context/ToastProvider";
import { ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";
import { paths } from "@/utils/paths";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const user = useAppSelector((state: any) => state.auth.user);
  const email = user?.email || "";

  const [getPassOtp, { isLoading: sendingPassOtp }] = useGetChangePasswordOtpMutation();
  const [changePass, { isLoading: changingPass }] = useChangePasswordMutation();

  const [getPinOtp, { isLoading: sendingPinOtp }] = useGetChangePinOtpMutation();
  const [changePin, { isLoading: changingPin }] = useChangePinMutation();

  const [workflow, setWorkflow] = useState<"hub" | "password" | "pin">("hub");

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passOtp, setPassOtp] = useState("");
  const [passStep, setPassStep] = useState(1); // 1: Send OTP, 2: Enter details & submit

  // Change PIN state
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinOtp, setPinOtp] = useState("");
  const [pinStep, setPinStep] = useState(1); // 1: Enter details, 2: Enter OTP & submit

  const handlePasswordNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("All fields are required", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      const response = await getPassOtp({ data: { email } }).unwrap();
      if (response?.status === "success" || response?.status === true || response?.success === true) {
        showToast(response?.message || "OTP sent to your email!", "success");
        setPassStep(2);
      } else {
        showToast(response?.message || "Failed to send OTP.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to send OTP.", "error");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword || !passOtp) {
      showToast("All fields are required", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      const response = await changePass({
        data: {
          email,
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
          otp: passOtp,
        },
      }).unwrap();

      if (response?.status === "success" || response?.status === true || response?.success === true) {
        showToast(response?.message || "Password updated successfully!", "success");
        setWorkflow("hub");
        setPassStep(1);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPassOtp("");
      } else {
        showToast(response?.message || "Failed to update password.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to update password.", "error");
    }
  };

  const handlePinNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin || !newPin) {
      showToast("All fields are required", "warning");
      return;
    }
    if (oldPin.length !== 4 || newPin.length !== 4) {
      showToast("PIN must be 4 digits", "warning");
      return;
    }
    try {
      const response = await getPinOtp({ data: { email } }).unwrap();
      if (response?.status === "success" || response?.status === true || response?.success === true) {
        showToast(response?.message || "OTP sent to your email!", "success");
        setPinStep(2);
      } else {
        showToast(response?.message || "Failed to send OTP.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to send OTP.", "error");
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin || !newPin || !pinOtp) {
      showToast("All fields are required", "warning");
      return;
    }
    try {
      const response = await changePin({
        data: {
          email,
          old_pin: oldPin,
          new_pin: newPin,
          otp: pinOtp,
        },
      }).unwrap();

      if (response?.status === "success" || response?.status === true || response?.success === true) {
        showToast(response?.message || "Transaction PIN updated successfully!", "success");
        setWorkflow("hub");
        setPinStep(1);
        setOldPin("");
        setNewPin("");
        setPinOtp("");
      } else {
        showToast(response?.message || "Failed to update PIN.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to update PIN.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (workflow === "hub") {
              router.back();
            } else {
              setWorkflow("hub");
            }
          }}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          {workflow === "hub" && "Security Settings"}
          {workflow === "password" && "Change Password"}
          {workflow === "pin" && "Change PIN"}
        </h3>
      </div>

      {workflow === "hub" && (
        <div className="flex flex-col gap-4">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
            <button
              onClick={() => setWorkflow("password")}
              className="w-full flex items-center justify-between p-5 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-700 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    Account Password
                  </h4>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                    Change password used to access dashboard
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setWorkflow("pin")}
              className="w-full flex items-center justify-between p-5 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-700 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    Transaction PIN
                  </h4>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                    Change PIN code used to confirm wallet payouts
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => router.push(paths.settings.account)}
            className="w-full text-center text-danger-500 font-primary-bold py-4 hover:opacity-80 transition-opacity cursor-pointer mt-4"
          >
            Delete Account
          </button>
        </div>
      )}

      {workflow === "password" && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px]">
          {passStep === 1 ? (
            <form onSubmit={handlePasswordNext} className="flex flex-col gap-5">
              <PasswordInput
                label="Current Password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={sendingPassOtp}
              />

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={sendingPassOtp}
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={sendingPassOtp}
              />

              <Button type="submit" fullWidth loading={sendingPassOtp}>
                Request OTP Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-5">
              <p className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark text-center leading-relaxed">
                We sent an OTP code to <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">{email}</span>. Enter it below to authorize changing password.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
                  Email Verification Code
                </label>
                <OtpInput value={passOtp} onChange={setPassOtp} />
              </div>

              <Button type="submit" fullWidth loading={changingPass}>
                Update Password
              </Button>

              <button
                type="button"
                onClick={() => setPassStep(1)}
                className="text-b3 font-primary-bold text-primary-500 hover:text-primary-600 transition-colors self-center cursor-pointer mt-1"
              >
                Back to details
              </button>
            </form>
          )}
        </div>
      )}

      {workflow === "pin" && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px]">
          {pinStep === 1 ? (
            <form onSubmit={handlePinNext} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 items-center w-full">
                <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
                  Current 4-Digit PIN
                </label>
                <OtpInput length={4} value={oldPin} onChange={setOldPin} />
              </div>

              <div className="flex flex-col gap-2 items-center w-full">
                <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
                  New 4-Digit PIN
                </label>
                <OtpInput length={4} value={newPin} onChange={setNewPin} />
              </div>

              <Button type="submit" fullWidth loading={sendingPinOtp}>
                Request OTP Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangePinSubmit} className="flex flex-col gap-5">
              <p className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark text-center leading-relaxed">
                We sent an OTP code to <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">{email}</span>. Enter it below to authorize changing transaction PIN.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
                  Email Verification Code
                </label>
                <OtpInput value={pinOtp} onChange={setPinOtp} />
              </div>

              <Button type="submit" fullWidth loading={changingPin}>
                Update Transaction PIN
              </Button>

              <button
                type="button"
                onClick={() => setPinStep(1)}
                className="text-b3 font-primary-bold text-primary-500 hover:text-primary-600 transition-colors self-center cursor-pointer mt-1"
              >
                Back to details
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
