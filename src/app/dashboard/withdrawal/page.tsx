"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWithdrawMutation, useGetAccountNameMutation } from "@/redux/settings/settings";
import { useGetBanksQuery } from "@/redux/transaction/banks";
import { paths } from "@/utils/paths";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { CenterModal } from "@/components/modals/CenterModal";
import { useToast } from "@/context/ToastProvider";
import { ArrowLeft, CheckCircle, Landmark, Check, Clock, Search, X, ChevronRight, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatamount";

export default function CashWithdrawalPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [withdrawCash, { isLoading: isWithdrawing }] = useWithdrawMutation();

  const user = useAppSelector((state: any) => state.auth.user);
  const walletBalance = user?.user?.bal || user?.balance || 0;
  const savedBeneficiaries = user?.beneficiaries || user?.user?.beneficiaries || [];

  // API mutations & queries
  const { data: banksData, isLoading: isBanksLoading } = useGetBanksQuery({});
  const [getAccountName, { isLoading: isResolvingName }] = useGetAccountNameMutation();

  // Wizard state: "first" (account & bank), "second" (amount)
  const [step, setStep] = useState<"first" | "second">("first");
  const [activeTab, setActiveTab] = useState<"recent" | "saved">("saved");

  // Form states
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Bank selection modal
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  // Security pin and receipt modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  const banksList = banksData?.banks?.data || [];

  // Filter banks by search term
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banksList;
    return banksList.filter((bank: any) =>
      bank.bankName.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [bankSearch, banksList]);

  // Resolve account name automatically when account number is 10 digits and bank is selected
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      const resolveName = async () => {
        try {
          const res = await getAccountName({
            data: {
              bankCode: selectedBank.bankCode,
              bankName: selectedBank.bankName,
              account_number: accountNumber,
            },
          }).unwrap();
          if (res?.status === "success" || res?.account_name) {
            setAccountName(res?.data?.account_name || res?.account_name || "");
          } else {
            showToast(res?.message || "Failed to resolve account name", "error");
            setAccountName("");
          }
        } catch (err) {
          console.error("Error resolving name", err);
          showToast("Error fetching account name", "error");
          setAccountName("");
        }
      };
      resolveName();
    } else {
      setAccountName("");
    }
  }, [accountNumber, selectedBank, getAccountName]);

  const handleSelectBeneficiary = (bene: any) => {
    setAccountNumber(bene.account_number || bene.accountnumber || "");
    setAccountName(bene.account_name || bene.accountname || "");
    const matchingBank = banksList.find((b: any) => b.bankCode === (bene.bank_code || bene.bankcode));
    if (matchingBank) {
      setSelectedBank(matchingBank);
    } else {
      setSelectedBank({
        bankCode: bene.bank_code || bene.bankcode,
        bankName: bene.bank_name || bene.bankname,
        bankUrl: bene.image || bene.bankUrl || "",
      });
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.length !== 10) {
      showToast("Please enter a valid 10-digit account number", "warning");
      return;
    }
    if (!selectedBank) {
      showToast("Please select a payout bank", "warning");
      return;
    }
    if (!accountName) {
      showToast("Could not verify account name. Please check details.", "warning");
      return;
    }
    setStep("second");
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (numAmount < 1000) {
      showToast("Minimum withdrawal is ₦1,000", "warning");
      return;
    }
    if (numAmount > parseFloat(walletBalance.toString())) {
      showToast("Insufficient wallet balance", "error");
      return;
    }
    setPinModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (pin.length !== 4) {
      setPinError("Please enter your 4-digit PIN");
      return;
    }

    try {
      const payload = {
        amount: parseFloat(amount),
        bankCode: selectedBank.bankCode,
        account_number: accountNumber,
        account_name: accountName,
        bankName: selectedBank.bankName,
        description: description || "Nil",
        pin,
      };

      const response = await withdrawCash({ data: payload }).unwrap();

      if (response?.status === "success" || response?.success === true) {
        setSuccessDetails({
          amount,
          accountNumber,
          accountName,
          bankName: selectedBank.bankName,
          ref: response?.data?.transid || response?.transid || "REF" + Date.now().toString().slice(-6),
        });
        setPinModalOpen(false);
        setPin("");
        setSuccessModalOpen(true);
      } else {
        showToast(response?.message || "Cash withdrawal failed.", "error");
        setPin("");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Withdrawal failed.";
      showToast(errMsg, "error");
      setPin("");
    }
  };

  const presets = ["1000", "2000", "3000", "4000"];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "second") {
              setStep("first");
            } else {
              router.back();
            }
          }}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          {step === "first" ? "Withdraw" : "Enter Amount"}
        </h3>
      </div>

      {step === "first" ? (
        <form onSubmit={handleNextStep} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
          {/* Account number input */}
          <Input
            label="Account number"
            placeholder="Enter 10 digit account number"
            maxLength={10}
            type="text"
            value={accountNumber}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "");
              setAccountNumber(cleaned);
            }}
          />

          {/* Bank selection trigger */}
          <div className="flex flex-col gap-1.5">
            <label className="text-b3 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
              Payout Bank
            </label>
            <button
              type="button"
              onClick={() => setBankModalOpen(true)}
              className="w-full flex items-center justify-between border border-border-light dark:border-[#232323] bg-light-50 dark:bg-dark-900 rounded-[20px] px-4 py-3.5 text-left text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {selectedBank?.bankUrl ? (
                  <img src={selectedBank.bankUrl} alt="" className="w-6 h-6 rounded-full object-contain" />
                ) : (
                  <Landmark className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
                )}
                <span>{selectedBank?.bankName || "Choose bank"}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-tertiary-light" />
            </button>
          </div>

          {/* Account name display (dynamic verification resolver) */}
          {(isResolvingName || accountName) && (
            <div className="flex flex-col gap-1.5 p-4 rounded-[20px] bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark animate-pulse-once">
              <span className="text-[10px] uppercase font-primary-bold tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Verified Account Name
              </span>
              {isResolvingName ? (
                <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark text-b2 font-primary-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  <span>Verifying details...</span>
                </div>
              ) : (
                <span className="text-b2 font-primary-bold text-success-600 dark:text-success-400 uppercase select-all">
                  {accountName}
                </span>
              )}
            </div>
          )}

          {/* Beneficiaries Tab switcher */}
          <div className="flex flex-col gap-3 border-t border-border-light dark:border-border-dark pt-4">
            <h4 className="text-b3 font-primary-bold text-text-secondary-light dark:text-text-secondary-dark px-1">
              Quick Beneficiaries
            </h4>
            {savedBeneficiaries.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {savedBeneficiaries.map((bene: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectBeneficiary(bene)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Landmark className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark shrink-0" />
                      <div>
                        <h5 className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                          {bene.bank_name || bene.bankname}
                        </h5>
                        <p className="text-[10px] font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                          {bene.account_number || bene.accountnumber} • {bene.account_name || bene.accountname}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border-light dark:border-border-dark p-6 rounded-xl text-center">
                <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                  No saved payment accounts found.
                </p>
              </div>
            )}
          </div>

          <Button type="submit" fullWidth disabled={!accountNumber || !selectedBank || !accountName}>
            Proceed to Amount
          </Button>
        </form>
      ) : (
        <form onSubmit={handleProceed} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
          {/* Wallet Balance Hero Info */}
          <div className="flex justify-between items-center bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-xl">
            <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Available Balance:
            </span>
            <span className="text-b2 font-primary-bold text-primary-500">
              {formatCurrency(walletBalance)}
            </span>
          </div>

          {/* Amount input */}
          <Input
            label="Amount to Withdraw"
            placeholder="Min ₦1,000"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Preset amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-2.5 rounded-xl border text-center text-b3 font-primary-bold cursor-pointer transition-colors ${amount === val
                  ? "border-primary-500 bg-primary-500/10 text-primary-500"
                  : "border-border-light dark:border-border-dark hover:bg-light-75 dark:hover:bg-dark-800 text-text-primary-light dark:text-text-primary-dark"
                  }`}
              >
                ₦{Number(val).toLocaleString()}
              </button>
            ))}
          </div>

          {/* Optional notes/description description */}
          <Input
            label="Notes / Description (Optional)"
            placeholder="Add withdrawal description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button type="submit" fullWidth disabled={!amount}>
            Authorize Withdrawal
          </Button>
        </form>
      )}

      {/* Choose Bank Modal overlay */}
      {bankModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[80vh] shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="flex items-center justify-between mb-4 pb-2">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Bank
              </h4>
              <button
                type="button"
                onClick={() => setBankModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4 relative">
              <Input
                placeholder="Search bank name..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                leadingIcon={<Search className="w-4 h-4 text-text-tertiary-light" />}
              />
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isBanksLoading ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-14 bg-light-200 dark:bg-dark-300 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredBanks.length > 0 ? (
                filteredBanks.map((bank: any) => (
                  <button
                    key={bank.bankCode}
                    type="button"
                    onClick={() => {
                      setSelectedBank(bank);
                      setBankModalOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-colors ${selectedBank?.bankCode === bank.bankCode
                      ? "border-primary-500 bg-primary-500/10 text-primary-500"
                      : "border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-text-primary-light dark:text-text-primary-dark"
                      }`}
                  >
                    {bank.bankUrl ? (
                      <img src={bank.bankUrl} alt="" className="w-7 h-7 rounded-full object-contain" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-b3 font-primary-bold">
                        {bank.bankName.charAt(0)}
                      </div>
                    )}
                    <span className="text-b2 font-primary-bold">{bank.bankName}</span>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-b3 text-text-secondary-light dark:text-text-secondary-dark">
                  No banks found matching search criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation PIN Modal */}
      <CenterModal visible={pinModalOpen} onClose={() => setPinModalOpen(false)} title="Confirm Withdrawal">
        <form onSubmit={handleConfirmPayment} className="flex flex-col gap-5 text-center p-2">
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            Enter your 4-digit transaction PIN to authorize cash withdrawal of ₦{Number(amount).toLocaleString()}.
          </p>
          <div className="flex flex-col gap-2 items-center my-3">
            <OtpInput length={4} value={pin} onChange={setPin} error={pinError} />
          </div>
          <div className="flex gap-4 mt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setPinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={isWithdrawing}>
              Confirm
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* Success Modal overlay showing receipt style background */}
      {successModalOpen && successDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-[#EFEFEF] dark:border-[#232323] p-6 rounded-[30px] w-full max-w-md flex flex-col items-center text-center shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle className="w-16 h-16 text-success-500 mb-4 animate-bounce" />

            <div className="bg-[#E8FFE4] dark:bg-[#111111] border border-[#B4FFA8] dark:border-[#232323] px-6 py-4 rounded-[30px] flex flex-col items-center gap-1 w-full mb-6">
              <span className="text-b3 font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
                Withdrawal Successful
              </span>
              <span className="text-h4 font-primary-bold text-[#26A408]">
                ₦{Number(successDetails.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full border-t border-dashed border-border-light dark:border-border-dark pt-4 text-left text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mb-6">
              <div className="flex justify-between items-center">
                <span>Bank Name:</span>
                <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark">{successDetails.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Account Number:</span>
                <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark select-all">{successDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Account Name:</span>
                <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark uppercase select-all">{successDetails.accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reference ID:</span>
                <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark select-all">{successDetails.ref}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                setSuccessModalOpen(false);
                router.push(paths.dashboard.home);
              }}
              fullWidth
              className="h-14 rounded-full text-b1 font-primary-bold"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
