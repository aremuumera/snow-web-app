"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { usePayBillMutation, useGetBillPlanMutation, useGetCustomerNameMutation } from "@/redux/bills/bills_api";
import { useToast } from "@/context/ToastProvider";
import { ProviderSelector, ProviderItem } from "./shared/ProviderSelector";
import { AmountPills } from "./shared/AmountPills";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { addElectricityBeneficiary, removeElectricityBeneficiary } from "@/redux/beneficiary/bene_slice";
import { ChevronDown, ChevronUp, User, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";

const quickAmounts = ["1000", "2000", "3000", "4000", "5000", "10000"];

export function ElectricityService() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();

  const [getBillPlan] = useGetBillPlanMutation();
  const [getCustomerName, { isLoading: isVerifying }] = useGetCustomerNameMutation();
  const [payBill, { isLoading: isBuying }] = usePayBillMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  const electricityBeneficiaries = useAppSelector((state: any) => state.beneficiary.electricityBeneficiaries) || [];

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [accountName, setAccountName] = useState("");

  // UI/Modal states
  const [discos, setDiscos] = useState<ProviderItem[]>([]);
  const [isLoadingDiscos, setIsLoadingDiscos] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);

  // Modal flow states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  // Fetch electricity providers (discos) on mount
  useEffect(() => {
    const fetchDiscos = async () => {
      setIsLoadingDiscos(true);
      try {
        const res = await getBillPlan({ data: {} }).unwrap();
        if (res?.status === "success" && Array.isArray(res.data)) {
          const items: ProviderItem[] = res.data.map((d: any) => ({
            id: d.unique_identifier,
            name: d.name,
            image: d.image,
            discoId: d.unique_identifier,
          }));
          setDiscos(items);
        }
      } catch (err) {
        setDiscos([]);
      } finally {
        setIsLoadingDiscos(false);
      }
    };
    fetchDiscos();
  }, [getBillPlan]);

  // Verify meter number
  useEffect(() => {
    if (selectedProvider && meterNumber.length >= 10) {
      const verifyMeter = async () => {
        try {
          const res = await getCustomerName({
            data: {
              meter_number: meterNumber,
              meter_type: meterType,
              disco: selectedProvider.id,
            },
          }).unwrap();

          if (res?.status === "success" && res.customer_name) {
            setAccountName(res.customer_name);
            showToast("Customer verified successfully", "success");
          } else {
            setAccountName("");
          }
        } catch (err: any) {
          setAccountName("");
        }
      };
      const delayDebounce = setTimeout(verifyMeter, 600);
      return () => clearTimeout(delayDebounce);
    } else {
      setAccountName("");
    }
  }, [selectedProvider, meterNumber, meterType, getCustomerName]);

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (quickAmounts.includes(val)) {
      setSelectedAmount(val);
    } else {
      setSelectedAmount("");
    }
  };

  const handleSelectBeneficiary = (bene: any) => {
    setMeterNumber(bene.meternumber || bene.id);
    const matched = discos.find((d) => d.id === bene.provider);
    if (matched) {
      setSelectedProvider(matched);
    }
    setIsBeneficiaryExpanded(false);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      showToast("Please select a distribution company", "warning");
      return;
    }
    if (meterNumber.length < 10 || meterNumber.length > 12) {
      showToast("Meter number must be between 10 and 12 digits", "warning");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (!accountName) {
      showToast("Please verify customer details first", "error");
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
        meter_number: meterNumber,
        pin,
        meter_type: meterType,
        amount: Number(amount),
        disco: selectedProvider!.id,
      };

      const response = await payBill({ data: payload }).unwrap();

      if (response.status === "success" || response.status === true || response.success === true) {
        setTransactionId(response?.data?.transid || response?.transid || "TXN" + Date.now());
        setShowPin(false);
        showToast("Electricity bill payment successful", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Bill payment failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to pay electricity bill.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
        
        {/* Provider Selector Card */}
        <div className="flex flex-col gap-2">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Select Distribution Company (Disco)
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
                  <div className="w-6 h-6 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-[10px] text-text-primary-light dark:text-text-primary-dark">
                    {selectedProvider.name.charAt(0)}
                  </div>
                )}
                {selectedProvider.name}
              </span>
            ) : (
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Select disco company...</span>
            )}
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Meter Type Tabs */}
        <div className="flex gap-2 p-1.5 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl w-full">
          <button
            type="button"
            onClick={() => setMeterType("prepaid")}
            className={`flex-1 py-2.5 text-b3 font-primary-bold text-center rounded-xl transition-all cursor-pointer ${
              meterType === "prepaid"
                ? "bg-primary-500 text-white shadow-md"
                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-light-100 dark:hover:bg-dark-800"
            }`}
          >
            Prepaid
          </button>
          <button
            type="button"
            onClick={() => setMeterType("postpaid")}
            className={`flex-1 py-2.5 text-b3 font-primary-bold text-center rounded-xl transition-all cursor-pointer ${
              meterType === "postpaid"
                ? "bg-primary-500 text-white shadow-md"
                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-light-100 dark:hover:bg-dark-800"
            }`}
          >
            Postpaid
          </button>
        </div>

        {/* Meter Number Box */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Meter Number
            </label>
            <input
              type="text"
              placeholder="Enter 10-12 digit meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Account Verification indicator */}
          {isVerifying ? (
            <div className="flex items-center gap-2 text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span>Verifying meter number...</span>
            </div>
          ) : accountName ? (
            <div className="flex items-center gap-2 text-[#26A408] text-b3 font-primary-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Customer Name: {accountName}</span>
            </div>
          ) : meterNumber.length >= 10 && !isVerifying ? (
            <div className="flex items-center gap-2 text-warning-500 text-b3 font-primary-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Unable to verify meter details. Please check the number.</span>
            </div>
          ) : null}

          {/* Beneficiary accordion */}
          {electricityBeneficiaries.length > 0 && (
            <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl p-2.5">
              <button
                type="button"
                onClick={() => setIsBeneficiaryExpanded(!isBeneficiaryExpanded)}
                className="flex items-center justify-between w-full text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark px-1 cursor-pointer"
              >
                <span>Recent Meters</span>
                {isBeneficiaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isBeneficiaryExpanded && (
                <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto">
                  {electricityBeneficiaries.slice(0, 5).map((bene: any, index: number) => (
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
                          {bene.meternumber || bene.id}
                        </span>
                        {bene.name && (
                          <span className="text-[10px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                            {bene.name}
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

        {/* Amount Box */}
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

          {/* Quick Amounts */}
          <AmountPills
            amounts={quickAmounts}
            selectedAmount={selectedAmount}
            onChange={handleAmountChange}
          />
        </div>

        <button
          type="submit"
          disabled={!selectedProvider || !meterNumber || !amount || !accountName}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Provider Selector Modal */}
      <ProviderSelector
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title="Select Disco"
        providers={discos}
        onSelect={setSelectedProvider}
        selectedValue={selectedProvider?.id}
        isLoading={isLoadingDiscos}
      />

      {/* Confirmation Modal */}
      {selectedProvider && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Payment"
          items={[
            { label: "Provider", value: selectedProvider.name },
            { label: "Meter Type", value: meterType.toUpperCase() },
            { label: "Meter Number", value: meterNumber },
            { label: "Customer Name", value: accountName },
            { label: "Amount", value: `₦${Number(amount).toLocaleString()}` },
          ]}
          onConfirm={handleConfirm}
        />
      )}

      {/* Transaction PIN Modal */}
      <PinEntryModal
        visible={showPin}
        onClose={() => setShowPin(false)}
        onSubmit={handlePinSubmit}
        error={pinError}
      />

      {/* Loading Blocker */}
      <ProcessingLoader visible={isBuying} />

      {/* Success Modal */}
      {selectedProvider && (
        <BillSuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          billType="Electricity"
          amount={amount}
          recipient={meterNumber}
          recipientName={selectedProvider.name}
          referenceId={transactionId}
          onSaveBeneficiaryChange={(save) => {
            if (save) {
              dispatch(
                addElectricityBeneficiary({
                  id: meterNumber,
                  name: accountName,
                  meternumber: meterNumber,
                  provider: selectedProvider.id,
                })
              );
            } else {
              dispatch(removeElectricityBeneficiary({ id: meterNumber }));
            }
          }}
          onViewReceipt={() => {
            closeDrawer();
            router.push(`/dashboard/transactions/${transactionId}?type=electricity`);
          }}
        />
      )}
    </div>
  );
}
