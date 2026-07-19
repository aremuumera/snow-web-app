"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { AppIcon } from "@/components/ui/AppIcon";
import { ArrowLeft, Copy, Info, AlertTriangle } from "lucide-react";

const formatDepositLimit = (limit: string | number | undefined | null): string => {
  if (limit === undefined || limit === null || limit === "") return "N/A";
  const limitStr = String(limit).trim();
  if (!/\d/.test(limitStr)) return limitStr;

  const formatNumberWithCommas = (numStr: string) => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return numStr;
    const hasDecimals = numStr.includes(".");
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(num);
  };

  if (limitStr.includes("-")) {
    return limitStr
      .split("-")
      .map((part) => {
        const trimmed = part.trim();
        if (!/\d/.test(trimmed)) return trimmed;
        const currencySymbol = trimmed.includes("$") ? "$" : "₦";
        const rawNumStr = trimmed.replace(/[^0-9.]/g, "");
        return `${currencySymbol}${formatNumberWithCommas(rawNumStr)}`;
      })
      .join(" - ");
  } else {
    const currencySymbol = limitStr.includes("$") ? "$" : "₦";
    const rawNumStr = limitStr.replace(/[^0-9.]/g, "");
    return `${currencySymbol}${formatNumberWithCommas(rawNumStr)}`;
  }
};

export default function FundWalletPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const user = useAppSelector((state: any) => state.auth.user);
  const userInfo = user?.user || user || {};
  const isVerified = userInfo?.verify_account === 1;

  const handleCopy = (text: string, label: string) => {
    if (!text || text === "----------") return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, "success");
  };

  const renderInfoItem = (label: string, value: string, isMain?: boolean) => (
    <div
      className={`relative mb-3 py-3 px-4 rounded-[20px] bg-light-50 dark:bg-dark-900 border border-border-light dark:border-[#232323] flex flex-col justify-center ${
        isMain ? "items-center py-5" : ""
      }`}
    >
      <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
        {label}
      </span>
      <span
        className={`font-primary-bold text-text-primary-light dark:text-text-primary-dark select-all ${
          isMain ? "text-h5 text-primary-500" : "text-b1"
        }`}
      >
        {!isVerified && label !== "Fee" && label !== "Deposit limit" ? "----------" : value}
      </span>

      {isVerified && ["Account number", "Bank name", "Account name"].includes(label) && (
        <button
          onClick={() => handleCopy(value, label)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 text-text-secondary-light hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Deposit NGN
        </h3>
      </div>

      {/* Intro info text */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
          Make a transfer to your account details below.
        </p>
      </div>

      {/* Account Info Box */}
      <div className="bg-white dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] rounded-[24px] p-4 flex flex-col gap-1">
        {renderInfoItem("Account number", userInfo?.unique_account || "----------", true)}
        {renderInfoItem("Bank name", userInfo?.unique_account_bank || "----------")}
        {renderInfoItem("Account name", userInfo?.unique_account_name || "----------")}
        {renderInfoItem("Fee", userInfo?.fee || "₦0")}
        {renderInfoItem("Deposit limit", formatDepositLimit(userInfo?.deposit_limit))}
      </div>

      {/* Legal Warnings & Info */}
      <div className="flex flex-col p-4 rounded-[20px] bg-white dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] gap-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark shrink-0 mt-0.5" />
          <p className="text-b3 leading-relaxed font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Make your deposit from a bank account that shows your legal name as provided to us during your KYC to prevent fund reversal or withholding of funds.
          </p>
        </div>
        <div className="flex items-start gap-3 border-t border-border-light dark:border-border-dark pt-3">
          <Info className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark shrink-0 mt-0.5" />
          <p className="text-b3 leading-relaxed font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Third-party transactions are not permitted.
          </p>
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <Button
        onClick={() => handleCopy(userInfo?.unique_account || "", "Account number")}
        disabled={!isVerified}
        fullWidth
        className="h-14 rounded-full text-b1 font-primary-bold"
      >
        <div className="flex items-center justify-center gap-2">
          <span>Copy account number</span>
          <Copy className="w-4 h-4" />
        </div>
      </Button>

      {/* KYC Lock Modal overlay */}
      {!isVerified && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] p-6 rounded-[30px] w-full max-w-md flex flex-col items-center text-center shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            {/* Lock avatar wrapper matching RN lock illustration */}
            <div className="mb-6 mt-4 w-20 h-20 bg-danger-500/10 rounded-full flex items-center justify-center text-danger-500">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark mb-2 px-2 leading-snug">
              Verify your account to deposit Naira.
            </h3>
            <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mb-8 px-4 leading-relaxed">
              Account verification is required to enable naira deposit functionality. Complete KYC for more freedom and flexibility.
            </p>

            <Button
              onClick={() => {
                router.push(paths.settings.kyc);
              }}
              className="w-full h-14 rounded-full text-b1 font-primary-bold"
            >
              Verify Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
