"use client";

import React, { useState } from "react";
import { CenterModal } from "@/components/modals/CenterModal";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { paths } from "@/utils/paths";

interface PinEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  error?: string;
}

export function PinEntryModal({
  visible,
  onClose,
  onSubmit,
  title = "Enter PIN",
  error = "",
}: PinEntryModalProps) {
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setLocalError("Please enter your 4-digit PIN");
      return;
    }
    setLocalError("");
    onSubmit(pin);
    setPin("");
  };

  return (
    <CenterModal visible={visible} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-center">
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Enter your 4-digit transaction PIN to authorize this transaction.
        </p>

        <div className="flex flex-col gap-2 items-center">
          <OtpInput length={4} value={pin} onChange={setPin} error={error || localError} />
        </div>

        <div className="flex justify-center mt-1">
          <Link
            href={paths.settings.changePin}
            className="text-b3 font-primary-bold text-primary-500 hover:underline cursor-pointer"
            onClick={onClose}
          >
            Forgot Transaction PIN?
          </Link>
        </div>

        <div className="flex gap-4 mt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={pin.length !== 4}>
            Confirm
          </Button>
        </div>
      </form>
    </CenterModal>
  );
}
