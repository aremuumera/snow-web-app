"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useBuyAirtimeMutation } from "@/redux/bills/bills_api";
import { useToast } from "@/context/ToastProvider";
import { NetworkSelector } from "./shared/NetworkSelector";
import { AmountPills } from "./shared/AmountPills";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { addPhoneBeneficiary, removePhoneBeneficiary } from "@/redux/beneficiary/bene_slice";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";
import { AppIcon } from "@/components/ui/AppIcon";

const quickAmounts = ["100", "150", "200", "500", "1000", "2000"];

export function BuyAirtimeService() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();
  const [buyAirtime, { isLoading }] = useBuyAirtimeMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  const phoneBeneficiaries = useAppSelector((state: any) => state.beneficiary.phoneBeneficiaries) || [];

  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);

  // Modal control states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (quickAmounts.includes(val)) {
      setSelectedAmount(val);
    } else {
      setSelectedAmount("");
    }
  };

  const handleSelectBeneficiary = (bene: any) => {
    setPhoneNumber(bene.number);
    if (bene.network) {
      setSelectedNetwork(bene.network.toLowerCase());
    }
    setIsBeneficiaryExpanded(false);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) {
      showToast("Please select a network operator", "warning");
      return;
    }
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      showToast("Phone number must be 10 or 11 digits", "warning");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (balance < numAmount) {
      showToast("Insufficient balance to perform this transaction", "error");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setShowPin(true);
  };

  const handlePinSubmit = async (pin: string) => {
    setPinError("");
    try {
      const payload = {
        network: selectedNetwork.toUpperCase(),
        phone: phoneNumber,
        amount: Number(amount),
        pin,
        plan_type: "vtu",
      };

      const response = await buyAirtime({ data: payload }).unwrap();

      if (response.status === "success" || response.status === true || response.success === true) {
        setTransactionId(response?.data?.transid || response?.transid || "TXN" + Date.now());
        setShowPin(false);
        showToast("Airtime purchase successful", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Airtime purchase failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to purchase airtime.";
      showToast(errMsg, "error");
    }
  };

  const activeNetworkObj = [
    { id: "mtn", name: "MTN" },
    { id: "airtel", name: "Airtel" },
    { id: "glo", name: "Glo" },
    { id: "mobile9", name: "9Mobile" },
  ].find((n) => n.id === selectedNetwork) || { id: "mtn", name: "MTN" };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
        
        {/* Network & Phone input wrapper */}
        <div className="flex flex-col gap-4 p-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-3xl">
          {/* Phone input with inline dropdown selector */}
          <div className="flex items-center gap-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-[20px] px-3 py-2">
            <NetworkSelector
              selectedNetwork={selectedNetwork}
              onChange={setSelectedNetwork}
              phoneNumber={phoneNumber}
            />
            <input
              type="text"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 bg-transparent text-text-primary-light dark:text-text-primary-dark font-primary-medium text-b2 border-0 outline-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* Collapsible Beneficiaries Accordion */}
          {phoneBeneficiaries.length > 0 && (
            <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl p-2.5">
              <button
                type="button"
                onClick={() => setIsBeneficiaryExpanded(!isBeneficiaryExpanded)}
                className="flex items-center justify-between w-full text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark px-1 cursor-pointer"
              >
                <span>Recent Beneficiaries</span>
                {isBeneficiaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isBeneficiaryExpanded && (
                <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto">
                  {phoneBeneficiaries.slice(0, 5).map((bene: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectBeneficiary(bene)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-light-100 dark:hover:bg-dark-700/50 transition-colors w-full cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                          {bene.number}
                        </span>
                        {bene.network && (
                          <span className="text-[10px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark uppercase">
                            {bene.network}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount Input Card */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Enter Amount
            </label>
            <input
              type="text"
              placeholder="₦ 0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Quick Amount Pills */}
          <AmountPills
            amounts={quickAmounts}
            selectedAmount={selectedAmount}
            onChange={handleAmountChange}
          />
        </div>

        <button
          type="submit"
          disabled={!phoneNumber || !amount}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Purchase"
        items={[
          { label: "Network", value: activeNetworkObj.name },
          { label: "Phone Number", value: phoneNumber },
          { label: "Amount", value: `₦${Number(amount).toLocaleString()}` },
        ]}
        onConfirm={handleConfirm}
      />

      {/* Transaction PIN Modal */}
      <PinEntryModal
        visible={showPin}
        onClose={() => setShowPin(false)}
        onSubmit={handlePinSubmit}
        error={pinError}
      />

      {/* Loading Blocker */}
      <ProcessingLoader visible={isLoading} />

      {/* Success Modal */}
      <BillSuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        billType="airtime"
        amount={amount}
        recipient={phoneNumber}
        recipientName={activeNetworkObj.name}
        referenceId={transactionId}
        onSaveBeneficiaryChange={(save) => {
          if (save) {
            dispatch(
              addPhoneBeneficiary({
                id: phoneNumber,
                number: phoneNumber,
                network: selectedNetwork,
                name: activeNetworkObj.name,
              })
            );
          } else {
            dispatch(removePhoneBeneficiary({ id: phoneNumber }));
          }
        }}
        onViewReceipt={() => {
          closeDrawer();
          router.push(`/dashboard/transactions/${transactionId}?type=airtime`);
        }}
      />
    </div>
  );
}
