"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPasswordMutation } from "@/redux/auth/auth_api";
import { useAppSelector } from "@/redux/store";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
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
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const email = searchParams.get("email") || sliceEmail;

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const payload = {
        email,
        otp,
        password,
        confirmPassword,
      };

      const response = await resetPassword({ data: payload }).unwrap();

      if (response?.status === true || response?.success === true) {
        showToast("Password reset successful! Please login.", "success");
        router.push(paths.auth.login);
      } else {
        showToast(response?.message || "Password reset failed. Please verify your OTP.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "An error occurred during password reset.";
      showToast(errMsg, "error");
    }
  };

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
    </div>
  );
}
