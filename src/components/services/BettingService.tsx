"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useGetBettingListQuery, useVeryBettingNumberMutation, usePayBettingMutation } from "@/redux/bills/bills_api";
import { useToast } from "@/context/ToastProvider";
import { ProviderSelector, ProviderItem } from "./shared/ProviderSelector";
import { AmountPills } from "./shared/AmountPills";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { addBettingBeneficiary, removeBettingBeneficiary } from "@/redux/beneficiary/bene_slice";
import { ChevronDown, ChevronUp, User, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";

const quickAmounts = ["1000", "2000", "5000", "10000", "20000"];

export function BettingService() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();

  const { data: providersData, isLoading: isLoadingProviders } = useGetBettingListQuery({});
  const [veryBettingNumber, { isLoading: isVerifying }] = useVeryBettingNumberMutation();
  const [payBetting, { isLoading: isPaying }] = usePayBettingMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  const bettingBeneficiaries = useAppSelector((state: any) => state.beneficiary.bettingBeneficiaries) || [];

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [accountName, setAccountName] = useState("");

  // UI/Modal states
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);

  // Modal flow states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  // Map API bet_providers to ProviderItem format
  const providersList: ProviderItem[] = React.useMemo(() => {
    const rawList = providersData?.bet_providers || [];
    return rawList.map((p: any) => ({
      id: p.unique_identifier,
      name: p.name,
      discoId: p.unique_identifier,
      image: p.image || "",
    }));
  }, [providersData]);

  // Verify Betting ID
  useEffect(() => {
    if (selectedProvider && userId.length >= 5) {
      const verifyId = async () => {
        try {
          const res = await veryBettingNumber({
            data: {
              betting_account: userId,
              unique_identifier: selectedProvider.id,
            },
          }).unwrap();

          if (res?.status === "success") {
            // Note: If API doesn't return account name, mock user verification success
            setAccountName(res.customer_name || res.customer || "Validated User");
            showToast("Betting account verified", "success");
          } else {
            setAccountName("");
          }
        } catch (err: any) {
          setAccountName("");
        }
      };
      const delayDebounce = setTimeout(verifyId, 600);
      return () => clearTimeout(delayDebounce);
    } else {
      setAccountName("");
    }
  }, [selectedProvider, userId, veryBettingNumber]);

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (quickAmounts.includes(val)) {
      setSelectedAmount(val);
    } else {
      setSelectedAmount("");
    }
  };

  const handleSelectBeneficiary = (bene: any) => {
    setUserId(bene.id);
    const matched = providersList.find((p) => p.name === bene.provider);
    if (matched) {
      setSelectedProvider(matched);
    }
    setIsBeneficiaryExpanded(false);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      showToast("Please select a provider", "warning");
      return;
    }
    if (userId.length < 5) {
      showToast("Betting ID must be at least 5 characters", "warning");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      showToast("Minimum purchase is ₦100", "warning");
      return;
    }
    if (!accountName) {
      showToast("Please verify account details first", "error");
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
        betting_account: userId,
        unique_identifier: selectedProvider!.id,
        amount: Number(amount),
        pin,
      };

      const response = await payBetting({ data: payload }).unwrap();

      if (response.status === "success" || response.status === true || response.success === true) {
        setTransactionId(response?.data?.transid || response?.transid || "TXN" + Date.now());
        setShowPin(false);
        showToast("Betting wallet funded successfully", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Betting payment failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to fund betting account.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
        
        {/* Provider Selection Card */}
        <div className="flex flex-col gap-2">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Select Betting Provider
          </label>
          <button
            type="button"
            onClick={() => setShowProviderModal(true)}
            className="flex items-center justify-between w-full px-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
          >
            {selectedProvider ? (
              <span className="font-primary-bold flex items-center gap-2.5">
                {selectedProvider.image ? (
                  <img src={selectedProvider.image} alt={selectedProvider.name} className="w-6 h-6 object-contain rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-[10px] text-text-primary-light dark:text-text-primary-dark animate-pulse">
                    {selectedProvider.name.charAt(0)}
                  </div>
                )}
                {selectedProvider.name}
              </span>
            ) : (
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Select provider...</span>
            )}
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* User Account Details */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              User ID / Customer ID
            </label>
            <input
              type="text"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Account Verification Details */}
          {isVerifying ? (
            <div className="flex items-center gap-2 text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span>Verifying User ID...</span>
            </div>
          ) : accountName ? (
            <div className="flex items-center gap-2 text-[#26A408] text-b3 font-primary-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Account Name: {accountName}</span>
            </div>
          ) : userId.length >= 5 && !isVerifying ? (
            <div className="flex items-center gap-2 text-warning-500 text-b3 font-primary-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Unable to verify betting ID. Please check the ID.</span>
            </div>
          ) : null}

          {/* Beneficiary Accordion */}
          {bettingBeneficiaries.length > 0 && (
            <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl p-2.5">
              <button
                type="button"
                onClick={() => setIsBeneficiaryExpanded(!isBeneficiaryExpanded)}
                className="flex items-center justify-between w-full text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark px-1 cursor-pointer"
              >
                <span>Recent Accounts</span>
                {isBeneficiaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isBeneficiaryExpanded && (
                <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto">
                  {bettingBeneficiaries.slice(0, 5).map((bene: any, index: number) => (
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
                          {bene.id}
                        </span>
                        {bene.provider && (
                          <span className="text-[10px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark capitalize">
                            {bene.provider}
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

        {/* Amount Card */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Enter Amount (Min ₦100)
            </label>
            <input
              type="text"
              placeholder="₦ 0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Quick Amounts */}
          <AmountPills
            amounts={quickAmounts}
            selectedAmount={selectedAmount}
            onChange={handleAmountChange}
          />
        </div>

        <button
          type="submit"
          disabled={!selectedProvider || !userId || !amount || !accountName}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Provider Selector Modal */}
      <ProviderSelector
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title="Select Provider"
        providers={providersList}
        onSelect={setSelectedProvider}
        selectedValue={selectedProvider?.id}
        isLoading={isLoadingProviders}
      />

      {/* Confirmation Modal */}
      {selectedProvider && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Fund Wallet"
          items={[
            { label: "Betting Operator", value: selectedProvider.name },
            { label: "User ID", value: userId },
            { label: "Account Name", value: accountName },
            { label: "Amount", value: `₦${Number(amount).toLocaleString()}` },
          ]}
          onConfirm={handleConfirm}
        />
      )}

      {/* PIN entry */}
      <PinEntryModal
        visible={showPin}
        onClose={() => setShowPin(false)}
        onSubmit={handlePinSubmit}
        error={pinError}
      />

      {/* Loading Blocker */}
      <ProcessingLoader visible={isPaying} />

      {/* Success Modal */}
      {selectedProvider && (
        <BillSuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          billType="Betting Wallet"
          amount={amount}
          recipient={userId}
          recipientName={selectedProvider.name}
          referenceId={transactionId}
          onSaveBeneficiaryChange={(save) => {
            if (save) {
              dispatch(
                addBettingBeneficiary({
                  id: userId,
                  name: accountName,
                  provider: selectedProvider.name,
                })
              );
            } else {
              dispatch(removeBettingBeneficiary({ id: userId, provider: selectedProvider.name }));
            }
          }}
          onViewReceipt={() => {
            closeDrawer();
            router.push(`/dashboard/transactions/${transactionId}?type=betting`);
          }}
        />
      )}
    </div>
  );
}
