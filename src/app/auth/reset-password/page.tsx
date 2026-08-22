"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useResetPasswordMutation,
  useVerifyOtpForPasswordResetMutation,
  useResendOtpForgotPasswordMutation,
} from "@/redux/auth/auth_api";
import { useAppSelector } from "@/redux/store";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password must be less than 50 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const sliceEmail = useAppSelector((state: any) => state.auth.email);
  const [verifyOtpForPasswordReset, { isLoading: isVerifyingOtp }] =
    useVerifyOtpForPasswordResetMutation();
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();
  const [resendOtpForgotPassword, { isLoading: isResending }] =
    useResendOtpForgotPasswordMutation();

  const email = searchParams.get("email") || sliceEmail;

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = { otp, password, confirmPassword };
    const validation = resetPasswordSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const token = TokenManager.getToken();

      // Step 1: Verify OTP for Password Reset to get the reset token
      const verifyPayload: Record<string, any> = {
        email,
        otp,
      };
      if (token) verifyPayload.token = token;

      const verifyRes = await verifyOtpForPasswordReset({
        data: verifyPayload,
      }).unwrap();

      const resetToken =
        verifyRes?.token || verifyRes?.data?.token || token || undefined;

      // Step 2: Call reset password with reset token and new password
      const resetPayload: Record<string, any> = {
        password,
        confirm: confirmPassword,
        token: resetToken,
      };
      if (email) resetPayload.email = email;

      const response = await resetPassword({ data: resetPayload }).unwrap();

      showToast(
        response?.data?.message ||
          response?.message ||
          "Password reset successful! Please login.",
        "success"
      );

      setTimeout(() => {
        router.push(paths.auth.login);
      }, 500);
    } catch (err: any) {
      const errMsg =
        err?.data?.message ||
        err?.message ||
        "An error occurred during password reset.";
      showToast(errMsg, "error");
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const token = TokenManager.getToken();
      const payload: Record<string, any> = { email };
      if (token) payload.token = token;

      const response = await resendOtpForgotPassword({
        data: payload,
      }).unwrap();

      showToast(
        response?.data?.message ||
          response?.message ||
          "Reset code resent successfully!",
        "success"
      );
      setTimer(60);
    } catch (err: any) {
      showToast(
        err?.data?.message || err?.message || "Failed to resend code.",
        "error"
      );
    }
  };

  const isLoading = isVerifyingOtp || isResettingPassword;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Reset password
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Enter the 6-digit OTP sent to {email} and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 items-center">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark self-start">
            Verification Code
          </label>
          <OtpInput value={otp} onChange={setOtp} error={errors.otp} />
        </div>

        <PasswordInput
          label="New Password"
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isLoading}
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Retype password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Reset Password
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
        <span>Didn't receive code?</span>
        <button
          type="button"
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
