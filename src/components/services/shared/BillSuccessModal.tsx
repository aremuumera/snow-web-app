"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check } from "lucide-react";
import { CenterModal } from "@/components/modals/CenterModal";
import { Button } from "@/components/ui/Button";

interface BillSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  billType: string;
  amount: string;
  recipient: string;
  recipientName: string;
  referenceId: string;
  onSaveBeneficiaryChange?: (save: boolean) => void;
  onViewReceipt?: () => void;
}

export function BillSuccessModal({
  visible,
  onClose,
  billType,
  amount,
  recipient,
  recipientName,
  referenceId,
  onSaveBeneficiaryChange,
  onViewReceipt,
}: BillSuccessModalProps) {
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBeneficiary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSaveBeneficiary(checked);
    if (onSaveBeneficiaryChange) {
      onSaveBeneficiaryChange(checked);
    }
  };

  return (
    <CenterModal visible={visible} onClose={onClose} title="Success">
      <div className="flex flex-col items-center text-center gap-5 w-full">
        {/* Animated Check */}
        <img src="/icons/success-tick.png" alt="Success" className="w-24 h-24 object-contain animate-bounce" />

        {/* Amount Box */}
        <div className="bg-[#E8FFE4] dark:bg-[#111111] border border-[#B4FFA8] dark:border-[#232323] px-6 py-4 rounded-[30px] flex flex-col items-center gap-1 w-full">
          <span className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark capitalize">
            {billType} Payment Successful
          </span>
          <span className="text-h4 font-primary-bold text-[#26A408]">
            ₦{Number(amount).toLocaleString()}
          </span>
        </div>

        {/* Recipient Details */}
        <div className="flex flex-col gap-1">
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            Your payment has been sent to{" "}
            <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark capitalize">
              {recipientName}
            </span>
          </p>
          <p className="text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark">
            {recipient}
          </p>
        </div>

        {/* Reference Box */}
        <div className="w-full bg-light-100 dark:bg-dark-700 p-4 rounded-2xl text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark flex justify-between items-center border border-border-light dark:border-border-dark">
          <span>Reference:</span>
          <div className="flex items-center gap-2">
            <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark select-all">
              {referenceId || "N/A"}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-light-200 dark:hover:bg-dark-600 transition-colors text-text-secondary-light dark:text-text-secondary-dark cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Save Beneficiary Toggle commented out as requested */}
        {/*
        {onSaveBeneficiaryChange && (
          <div className="flex items-center justify-between w-full p-4 bg-light-50 dark:bg-dark-900/50 border border-border-light dark:border-border-dark rounded-2xl">
            <span className="text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark">
              Save as Beneficiary
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={saveBeneficiary}
                onChange={handleToggleBeneficiary}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-light-300 peer-focus:outline-none dark:bg-dark-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-light-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
        )}
        */}

        {/* Buttons */}
        <div className="flex flex-col gap-2 w-full mt-2">
          {onViewReceipt && (
            <Button type="button" variant="secondary" fullWidth onClick={onViewReceipt}>
              View Receipt
            </Button>
          )}
          <Button type="button" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}
