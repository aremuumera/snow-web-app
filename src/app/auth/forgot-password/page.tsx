"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForgotPasswordMutation } from "@/redux/auth/auth_api";
import { useAppDispatch } from "@/redux/store";
import { setUserEmail } from "@/redux/auth/auth_slice";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    try {
      const response = await forgotPassword({ data: { email } }).unwrap();
      if (response?.status === true || response?.success === true) {
        showToast("OTP sent to your email!", "success");
        dispatch(setUserEmail(email));
        router.push(`${paths.auth.resetPassword}?email=${encodeURIComponent(email)}`);
      } else {
        showToast(response?.message || "Something went wrong. Please check your email.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to process request.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Forgot password
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Please enter your email address to receive a password reset OTP.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Email Address"
          placeholder="e.g. user@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Send OTP
        </Button>
      </form>

      <div className="flex justify-center items-center gap-1.5 text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
        <span>Remembered password?</span>
        <Link
          href={paths.auth.login}
          className="font-primary-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
