"use client";

import React from "react";
import { CenterModal } from "./CenterModal";
import { ArrowRight } from "lucide-react";
import { useDrawer, DrawerType } from "@/context/DrawerContext";
import { AppIcon } from "@/components/ui/AppIcon";

interface PickServiceModalProps {
  visible: boolean;
  onClose: () => void;
  type: "giftcard" | "crypto" | null;
}

export function PickServiceModal({ visible, onClose, type }: PickServiceModalProps) {
  const { openDrawer } = useDrawer();

  if (!type) return null;

  const isGiftcard = type === "giftcard";

  const handleSelect = (drawerType: DrawerType) => {
    onClose();
    openDrawer(drawerType);
  };

  return (
    <CenterModal
      visible={visible}
      onClose={onClose}
      title={isGiftcard ? "Gift Card Options" : "Crypto Options"}
    >
      <div className="flex flex-col gap-4">
        {isGiftcard ? (
          <>
            {/* Sell Gift Card Option */}
            <button
              type="button"
              onClick={() => handleSelect("sell-giftcard")}
              className="flex items-center justify-between p-4.5 rounded-[24px] bg-[#F8F8F8] dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:bg-light-100 dark:hover:bg-dark-900 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <AppIcon name="sell-giftcard" size={28} color="var(--color-primary-500)" />
                </div>
                <div>
                  <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    Sell Gift Card
                  </h4>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Convert your gift cards to instant cash at the best rates.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark group-hover:translate-x-1 group-hover:text-primary-500 transition-all" />
            </button>

            {/* Buy Gift Card Option */}
            <button
              type="button"
              onClick={() => handleSelect("buy-giftcard")}
              className="flex items-center justify-between p-4.5 rounded-[24px] bg-[#F8F8F8] dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:bg-light-100 dark:hover:bg-dark-900 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <AppIcon name="buy-giftcard" size={28} color="var(--color-primary-500)" />
                </div>
                <div>
                  <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    Buy Gift Card
                  </h4>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Purchase gift cards from top brands worldwide using wallet balance.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark group-hover:translate-x-1 group-hover:text-primary-500 transition-all" />
            </button>
          </>
        ) : (
          <>
            {/* Sell Crypto Option */}
            <button
              type="button"
              onClick={() => handleSelect("sell-crypto")}
              className="flex items-center justify-between p-4.5 rounded-[24px] bg-[#F8F8F8] dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:bg-light-100 dark:hover:bg-dark-900 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <AppIcon name="crypto" size={28} color="var(--color-primary-500)" />
                </div>
                <div>
                  <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    Sell Crypto
                  </h4>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Sell Bitcoin, Ethereum, USDT, and more for instant Naira payout.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark group-hover:translate-x-1 group-hover:text-primary-500 transition-all" />
            </button>

            {/* Buy Crypto Option (Inactive) */}
            <div
              className="flex items-center justify-between p-4.5 rounded-[24px] bg-[#F8F8F8]/50 dark:bg-[#0C0C0C]/50 border border-border-light dark:border-[#232323] opacity-65 text-left select-none relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-light-200 dark:bg-dark-800 flex items-center justify-center">
                  <AppIcon name="crypto" size={28} color="var(--color-primary-500)" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                      Buy Crypto
                    </h4>
                    <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full font-primary-bold">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Purchase blockchain digital assets directly with cash.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CenterModal>
  );
}
