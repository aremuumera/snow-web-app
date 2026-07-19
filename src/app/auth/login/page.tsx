"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/store";
import { useLoginMutation } from "@/redux/auth/auth_api";
import { setLoginSuccess, setUserEmail, setUser } from "@/redux/auth/auth_slice";
import { setLoginSuccess as setSessionSuccess } from "@/redux/auth/session";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { signInWithCustomToken } from "firebase/auth";
import { auth as fbAuth } from "@/lib/firebase";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be less than 50 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
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
      const response = await login({ data: { email, password } }).unwrap();
      const res = response?.data || response || {};
      const token = res?.token || response?.token;
      const firebaseToken = res?.firebase_token || response?.firebase_token;

      if (res?.status === "unverify") {
        // Account not verified yet
        dispatch(setUserEmail(email));
        dispatch(setUser(res));
        if (token) TokenManager.setToken(token);
        showToast(res?.message || "Please verify your account", "info");
        router.push(paths.auth.verify);
        return;
      }

      if (token) {
        // Save token
        TokenManager.setToken(token);
        if (firebaseToken) {
          TokenManager.setFirebaseToken(firebaseToken);
          // Sign into Firebase immediately so chat is ready (matches mobile)
          try {
            await signInWithCustomToken(fbAuth, firebaseToken);
            console.log("Firebase auth successful on login");
          } catch (fbError) {
            console.error("Firebase auth failed on login:", fbError);
          }
        }

        // Save full user data to Redux (matches mobile: dispatch(setUser(res)))
        dispatch(setUser(res));
        dispatch(setUserEmail(email));

        // Update auth state
        dispatch(setLoginSuccess({ token }));
        dispatch(setSessionSuccess());

        showToast("Login successful!", "success");
        router.push(paths.dashboard.home);
      } else {
        showToast(response?.message || "Invalid credentials. Please try again.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "An error occurred during login.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Welcome back
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Please enter your credentials to login to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Email Address"
          placeholder="e.g. user@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Link
              href={paths.auth.forgotPassword}
              className="text-b3 font-primary-semibold text-primary-500 hover:text-primary-600 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          Log In
        </Button>
      </form>

      <div className="flex justify-center items-center gap-1.5 text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
        <span>Don't have an account?</span>
        <Link
          href={paths.auth.register}
          className="font-primary-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
