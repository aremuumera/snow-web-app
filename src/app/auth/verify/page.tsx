"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyOtpMutation, useResendOtpMutation } from "@/redux/auth/auth_api";
import { useAppSelector } from "@/redux/store";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const sliceEmail = useAppSelector((state: any) => state.auth.email);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const email = searchParams.get("email") || sliceEmail;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    try {
      const token = TokenManager.getToken();
      const payload: Record<string, any> = { otp };
      if (token) payload.token = token;
      if (email) payload.email = email;

      const response = await verifyOtp({ data: payload }).unwrap();

      if (response?.status === true || response?.success === true || response?.token) {
        showToast("Email verification successful!", "success");
        if (response?.token || response?.data?.token) {
          TokenManager.setToken(response?.token || response?.data?.token);
        }
        router.push(paths.auth.createPin);
      } else {
        showToast(response?.message || "Verification failed. Invalid OTP code.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Verification failed.";
      showToast(errMsg, "error");
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const token = TokenManager.getToken();
      const payload: Record<string, any> = {};
      if (token) payload.token = token;
      if (email) payload.email = email;

      const response = await resendOtp({ data: payload }).unwrap();
      if (response?.status === true || response?.success === true) {
        showToast("OTP resent successfully!", "success");
        setTimer(60);
      } else {
        showToast(response?.message || "Resend failed.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to resend OTP.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Verify account
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Enter the 6-digit verification code sent to {email}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 items-center">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
            Verification Code
          </label>
          <OtpInput value={otp} onChange={setOtp} error={error} />
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          Verify Account
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
        <span>Didn't receive code?</span>
        <button
          onClick={handleResend}
          disabled={timer > 0 || isResending}
          className={`font-primary-semibold text-primary-500 hover:text-primary-600 transition-colors ${
            timer > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
        </button>
      </div>
    </div>
  );
}
