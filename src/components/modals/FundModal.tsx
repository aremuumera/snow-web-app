"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CenterModal } from "./CenterModal";
import { paths } from "@/utils/paths";
import { AppIcon } from "@/components/ui/AppIcon";
import { Landmark, Coins, ChevronRight } from "lucide-react";

interface FundModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FundModal({ visible, onClose }: FundModalProps) {
  const router = useRouter();

  const handleSelect = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <CenterModal visible={visible} onClose={onClose} title="Fund Wallet">
      <div className="flex flex-col gap-4 p-2 w-full">
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark text-center mb-2">
          Select your preferred payment type to fund your account.
        </p>

        {/* Naira deposit option */}
        <button
          onClick={() => handleSelect(paths.dashboard.deposit)}
          className="w-full flex items-center justify-between p-4 rounded-[20px] border border-border-light dark:border-[#232323] bg-light-50 dark:bg-dark-900 hover:bg-light-75 dark:hover:bg-dark-800 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Naira Deposit
              </h4>
              <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                Fund via instant virtual bank transfer.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary-light" />
        </button>

        {/* Crypto deposit option */}
        <button
          onClick={() => handleSelect(paths.crypto.deposit)}
          className="w-full flex items-center justify-between p-4 rounded-[20px] border border-border-light dark:border-[#232323] bg-light-50 dark:bg-dark-900 hover:bg-light-75 dark:hover:bg-dark-800 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Crypto Deposit
              </h4>
              <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                Generate wallet addresses for BTC, ETH, USDT.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary-light" />
        </button>
      </div>
    </CenterModal>
  );
}
