"use client";

import React from "react";
import { CenterModal } from "@/components/modals/CenterModal";
import { Button } from "@/components/ui/Button";

interface ConfirmationItem {
  label: string;
  value: string;
}

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: ConfirmationItem[];
  onConfirm: () => void;
  confirmText?: string;
  confirmLoading?: boolean;
}

export function ConfirmationModal({
  visible,
  onClose,
  title,
  items,
  onConfirm,
  confirmText = "Proceed to Pay",
  confirmLoading = false,
}: ConfirmationModalProps) {
  return (
    <CenterModal visible={visible} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark text-center">
          Please confirm the details of your transaction before proceeding.
        </p>

        <div className="bg-light-50 dark:bg-dark-900/50 border border-border-light dark:border-border-dark rounded-2xl p-4 flex flex-col gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center text-b2 border-b border-border-light/40 dark:border-border-dark/40 pb-2.5 last:border-0 last:pb-0"
            >
              <span className="font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                {item.label}
              </span>
              <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" fullWidth onClick={onConfirm} loading={confirmLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}
