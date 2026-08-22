"use client";

import React from "react";
import { CenterModal } from "@/components/modals/CenterModal";
import { Button } from "@/components/ui/Button";

interface SellGiftCardSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onReturnToDashboard: () => void;
  onViewTradeChat: () => void;
  data: {
    cardName: string;
    cardImage?: string;
    country: string;
    amount: string; // Unit value USD
    rate: string | number;
    settlementAmount: number; // Total Naira
    quantity: number;
    type: string;
  };
}

export function SellGiftCardSuccessModal({
  visible,
  onClose,
  onReturnToDashboard,
  onViewTradeChat,
  data,
}: SellGiftCardSuccessModalProps) {
  const formatNumber = (num: number | string) => {
    const val = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(val)) return "0.00";
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <CenterModal visible={visible} onClose={onClose} title="Trade Submitted">
      <div className="flex flex-col items-center text-center gap-5 w-full">
        {/* Success Header */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/success-tick.png"
            alt="Success"
            className="w-20 h-20 object-contain mb-1"
          />
          <h3 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Happy Trade
          </h3>
          <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark max-w-sm px-2">
            Your Gift card has been submitted for trade. Keep an eye out for our notification once your order is complete.
          </p>
        </div>

        {/* Double Container Wrapper */}
        <div className="bg-[#FCFCFC] dark:bg-[#111111] rounded-[30px] p-2 border border-border-light dark:border-border-dark w-full">
          {/* Top Details Card */}
          <div className="bg-white dark:bg-dark-900 rounded-[20px] p-4 border border-border-light dark:border-border-dark flex flex-col gap-3">
            <DetailRow label="Card name" value={data.cardName} image={data.cardImage} />
            <DetailRow label="Country" value={data.country} />
            <DetailRow label="Unit Value" value={`$${data.amount}`} />
            <DetailRow label="Current rate" value={`$1~₦${formatNumber(data.rate)}`} />
            <DetailRow label="Quantity" value={`${data.quantity} Qty`} />
            <DetailRow label="Type" value={data.type} isLast />
          </div>

          {/* Settlement Amount Row */}
          <div className="bg-white dark:bg-dark-900 rounded-[20px] mt-2 p-4 border border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Settlement amount
            </span>
            <span className="text-b2 font-primary-bold text-primary-500">
              ₦{formatNumber(data.settlementAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onReturnToDashboard}
            className="border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 h-13 rounded-2xl text-b2 font-primary-semibold capitalize"
          >
            Return to dashboard
          </Button>

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={onViewTradeChat}
            className="h-13 rounded-2xl text-b2 font-primary-bold capitalize"
          >
            View trade chat
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  image?: string;
  isLast?: boolean;
}

function DetailRow({ label, value, image, isLast }: DetailRowProps) {
  return (
    <div className={`flex justify-between items-center ${isLast ? "" : "pb-3 border-b border-dashed border-border-light/60 dark:border-border-dark/60"}`}>
      <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {image && (
          <img
            src={image}
            alt=""
            className="w-5 h-5 object-contain rounded-full bg-white dark:bg-dark-800 border border-border-light/50 dark:border-border-dark/50"
          />
        )}
        <span className="text-b3 font-primary-semibold text-text-primary-light dark:text-text-primary-dark capitalize">
          {value}
        </span>
      </div>
    </div>
  );
}

export default SellGiftCardSuccessModal;
