"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateUserPinMutation } from "@/redux/auth/auth_api";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { paths } from "@/utils/paths";

export default function CreatePinPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [createUserPin, { isLoading }] = useCreateUserPinMutation();

  const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN code");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (confirmPin.length !== 4) {
      setError("Please enter confirm 4-digit PIN code");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setStep(1);
      setPin("");
      setConfirmPin("");
      return;
    }

    try {
      const response = await createUserPin({ data: { pin } }).unwrap();

      if (response?.status === true || response?.success === true) {
        showToast("PIN created successfully!", "success");
        router.push(paths.dashboard.home);
      } else {
        showToast(response?.message || "Failed to create PIN code.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to create PIN.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-h6 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
          {step === 1 ? "Create transaction PIN" : "Confirm PIN"}
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          {step === 1
            ? "Create a 4-digit transaction PIN for withdrawals and bill payments."
            : "Confirm your 4-digit transaction PIN to proceed."}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 items-center">
            <OtpInput length={4} value={pin} onChange={setPin} error={error} />
          </div>

          <Button type="submit" fullWidth>
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 items-center">
            <OtpInput length={4} value={confirmPin} onChange={setConfirmPin} error={error} />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setStep(1);
                setConfirmPin("");
              }}
            >
              Back
            </Button>
            <Button type="submit" fullWidth loading={isLoading}>
              Submit PIN
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
