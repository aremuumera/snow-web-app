"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/store";
import { useRegisterMutation } from "@/redux/auth/auth_api";
import { setUserEmail } from "@/redux/auth/auth_slice";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/token-manager";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(/^[0-9\s-]+$/, "Phone number can only contain numbers"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password must be less than 50 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const countryOptions = [
    { value: "+234", label: "🇳🇬 +234" },
    { value: "+1", label: "🇺🇸 +1" },
    { value: "+44", label: "🇬🇧 +44" },
    { value: "+233", label: "🇬🇭 +233" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      name,
      email,
      phone,
      username,
      password,
      confirmPassword,
      agreeToTerms,
    };

    const validation = registerSchema.safeParse(formData);
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
        name,
        email,
        username,
        phone: `${phone}`,
        dial_code: countryCode,
        password,
        confirm: confirmPassword,
        ref: "",
      };

      const response = await registerUser({ data: payload }).unwrap();

      const tokenReceived =
        response?.token || response?.data?.token || response?.data?.user?.token;
      if (tokenReceived) {
        TokenManager.setToken(tokenReceived);
      }
      dispatch(setUserEmail(email));

      showToast(
        response?.data?.message ||
          response?.message ||
          "Registration successful! Verify your account.",
        "success"
      );

      setTimeout(() => {
        router.push(`${paths.auth.verify}?email=${encodeURIComponent(email)}`);
      }, 500);
    } catch (err: any) {
      const errMsg =
        err?.data?.message ||
        err?.message ||
        "An error occurred during registration.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          Create account
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Enter your details below to register an account with us.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          disabled={isLoading}
        />

        <Input
          label="Email Address"
          placeholder="e.g. john@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1 w-full">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Phone Number
          </label>
          <div className="flex gap-2 w-full">
            <div className="w-1/3">
              <Select
                options={countryOptions}
                value={countryCode}
                onChange={setCountryCode}
              />
            </div>
            <div className="w-2/3">
              <Input
                placeholder="e.g. 8012345678"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Input
          label="Username"
          placeholder="e.g. johndoe1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isLoading}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Retype password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={isLoading}
        />

        <Checkbox
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          label={
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-primary-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary-500 hover:underline">
                Privacy Policy
              </Link>
            </span>
          }
          error={errors.agreeToTerms}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="flex justify-center items-center gap-1.5 text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
        <span>Already have an account?</span>
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
