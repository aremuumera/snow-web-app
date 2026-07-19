"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useBuyCableMutation, useGetCableMutation, useGetCableNameMutation } from "@/redux/bills/bills_api";
import { useToast } from "@/context/ToastProvider";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { addCableBeneficiary, removeCableBeneficiary } from "@/redux/beneficiary/bene_slice";
import { ChevronDown, ChevronUp, User, Search, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { CenterModal } from "@/components/modals/CenterModal";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";

// Types matching the mobile app's API response structure
interface CablePlan {
  plan_id: string;
  plan_name: string;
  name?: string;
  plan_price?: string;
  price?: string;
  amount?: string;
  description?: string;
  unique_identifier?: string;
}

interface CableProvider {
  name: string;
  image: string;
  plans: CablePlan[];
}

export function CableTvService() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();

  const [getCable, { isLoading: isFetchingCable }] = useGetCableMutation();
  const [getCableName, { isLoading: isVerifying }] = useGetCableNameMutation();
  const [buyCable, { isLoading: isBuying }] = useBuyCableMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  const cableBeneficiaries = useAppSelector((state: any) => state.beneficiary.cableBeneficiaries) || [];

  // API-fetched providers (like mobile app)
  const [allCableData, setAllCableData] = useState<CableProvider[]>([]);
  const [providerSearch, setProviderSearch] = useState("");

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<CableProvider | null>(null);
  const [smartcard, setSmartcard] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [accountName, setAccountName] = useState("");

  // UI states
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);

  // Modal flow states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  // Fetch all cable data from API (providers + plans) — exactly like mobile's selectCableProviderModal
  const fetchCableData = useCallback(async () => {
    try {
      const response = await getCable({ data: {} }).unwrap();
      if (response.status === "success" && response.data) {
        const transformedData: CableProvider[] = Object.entries(response.data).map(
          ([key, value]: [string, any]) => ({
            name: key,
            image: value.image || "",
            plans: value.plans || [],
          })
        );
        setAllCableData(transformedData);
      } else {
        setAllCableData([]);
      }
    } catch (error) {
      setAllCableData([]);
    }
  }, [getCable]);

  // Fetch cable data when provider modal opens (like mobile)
  useEffect(() => {
    if (showProviderModal) {
      fetchCableData();
    }
  }, [showProviderModal, fetchCableData]);

  // Filter providers by search
  const filteredProviders = useMemo(() => {
    if (!providerSearch) return allCableData;
    return allCableData.filter((p) =>
      p.name.toLowerCase().includes(providerSearch.toLowerCase())
    );
  }, [allCableData, providerSearch]);

  // Packages derived from selected provider
  const packages = useMemo(() => {
    if (!selectedProvider) return [];
    return selectedProvider.plans || [];
  }, [selectedProvider]);

  // Verify IUC/smartcard when provider, package and smartcard (>= 10 digits) are entered
  useEffect(() => {
    if (selectedProvider && selectedPackage && smartcard.length >= 10) {
      const verifyIuc = async () => {
        try {
          const res = await getCableName({
            data: {
              cable: selectedProvider.name,
              iuc: smartcard,
              unique_identifier: selectedPackage?.unique_identifier || selectedPackage?.plan_id || selectedPackage?.id || "",
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
      const delayDebounce = setTimeout(verifyIuc, 600);
      return () => clearTimeout(delayDebounce);
    } else {
      setAccountName("");
    }
  }, [selectedProvider, selectedPackage, smartcard, getCableName]);

  const handleSelectProvider = (provider: CableProvider) => {
    setSelectedProvider(provider);
    setSelectedPackage(null);
    setAccountName("");
    setShowProviderModal(false);
    setProviderSearch("");
  };

  const handleSelectBeneficiary = (bene: any) => {
    setSmartcard(bene.cablenumber || bene.id);
    // Try to match from already-loaded data
    const matched = allCableData.find(
      (p) => p.name.toLowerCase() === (bene.cableNetwork || "").toLowerCase()
    );
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
    if (smartcard.length < 10 || smartcard.length > 11) {
      showToast("Smartcard/IUC number must be 10 or 11 digits", "warning");
      return;
    }
    if (!selectedPackage) {
      showToast("Please select a package", "warning");
      return;
    }
    if (!accountName) {
      showToast("Please verify customer details first", "error");
      return;
    }
    const cost = Number(selectedPackage.plan_price || selectedPackage.price || selectedPackage.amount);
    if (balance < cost) {
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
        cable_name: selectedProvider!.name,
        iuc: smartcard,
        pin,
        cable_plan: selectedPackage.unique_identifier || selectedPackage.plan_id || selectedPackage.id,
      };

      const response = await buyCable({ data: payload }).unwrap();

      if (response.status === "success" || response.status === true || response.success === true) {
        setTransactionId(response?.data?.transid || response?.transid || "TXN" + Date.now());
        setShowPin(false);
        showToast("Cable payment successful", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Cable purchase failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to process Cable TV purchase.";
      showToast(errMsg, "error");
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    (pkg.plan_name || pkg.name || "").toLowerCase().includes(packageSearch.toLowerCase())
  );

  const getFirstChar = (text: string) => text.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">

        {/* Provider Selection Card */}
        <div className="flex flex-col gap-2">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Select Cable Provider
          </label>
          <button
            type="button"
            onClick={() => setShowProviderModal(true)}
            className="flex items-center justify-between w-full px-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
          >
            {selectedProvider ? (
              <span className="font-primary-bold flex items-center gap-2.5">
                {selectedProvider.image ? (
                  <img
                    src={selectedProvider.image}
                    alt={selectedProvider.name}
                    className="w-7 h-7 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-[10px] text-text-primary-light dark:text-text-primary-dark">
                    {getFirstChar(selectedProvider.name)}
                  </div>
                )}
                {selectedProvider.name}
              </span>
            ) : (
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Select Cable Provider</span>
            )}
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Package Selector */}
        {selectedProvider && (
          <div className="flex flex-col gap-2">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Choose Package
            </label>
            <button
              type="button"
              onClick={() => setShowPackageModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
            >
              {selectedPackage ? (
                <span className="font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {selectedPackage.plan_name || selectedPackage.name} - ₦{Number(selectedPackage.plan_price || selectedPackage.price || selectedPackage.amount).toLocaleString()}
                </span>
              ) : (
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  Choose Package
                </span>
              )}
              <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
          </div>
        )}

        {/* Smartcard & Account Verification Card */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Smart Card / IUC Number
            </label>
            <input
              type="text"
              placeholder="e.g. 1023456789"
              value={smartcard}
              onChange={(e) => setSmartcard(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Account Verification Box */}
          {isVerifying ? (
            <div className="flex items-center gap-2 text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span>Verifying customer details...</span>
            </div>
          ) : accountName ? (
            <div className="flex items-center gap-2 text-[#26A408] text-b3 font-primary-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Customer Name: {accountName}</span>
            </div>
          ) : smartcard.length >= 10 && selectedProvider && selectedPackage && !isVerifying ? (
            <div className="flex items-center gap-2 text-warning-500 text-b3 font-primary-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Unable to verify details. Please double check the card number.</span>
            </div>
          ) : null}

          {/* Beneficiaries Accordion */}
          {cableBeneficiaries.length > 0 && (
            <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl p-2.5">
              <button
                type="button"
                onClick={() => setIsBeneficiaryExpanded(!isBeneficiaryExpanded)}
                className="flex items-center justify-between w-full text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark px-1 cursor-pointer"
              >
                <span>Recent beneficiary</span>
                {isBeneficiaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isBeneficiaryExpanded && (
                <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto">
                  {cableBeneficiaries.slice(0, 3).map((bene: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectBeneficiary(bene)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors w-full cursor-pointer text-left ${
                        smartcard === (bene.cablenumber || bene.id)
                          ? "border border-primary-500 bg-light-50 dark:bg-primary-900/20"
                          : "hover:bg-light-100 dark:hover:bg-dark-700/50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                          {bene.cablenumber || bene.id}
                        </span>
                        {bene.cableNetwork && (
                          <span className="text-[10px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark uppercase">
                            {bene.cableNetwork}
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

        <button
          type="submit"
          disabled={!selectedProvider || !smartcard || !selectedPackage || !accountName}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Provider Selector Modal — fetched from API like mobile */}
      <CenterModal visible={showProviderModal} onClose={() => { setShowProviderModal(false); setProviderSearch(""); }} title="Select Cable Provider">
        <div className="flex flex-col gap-4 max-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search cable provider"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Providers List */}
          <div className={`flex-1 flex flex-col gap-2.5 pr-1 ${isFetchingCable ? "overflow-hidden" : "overflow-y-auto"}`}>
            {isFetchingCable ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider, index) => {
                const isSelected = selectedProvider?.name === provider.name;
                return (
                  <button
                    key={`${provider.name}-${index}`}
                    type="button"
                    onClick={() => handleSelectProvider(provider)}
                    className={`flex items-center justify-between p-4 rounded-[20px] border text-left transition-all w-full cursor-pointer ${
                      isSelected
                        ? "border-primary-500 bg-[#E8F5E9] dark:bg-[#0B2E02]"
                        : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#0C0C0C] hover:bg-light-100 dark:hover:bg-dark-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {provider.image ? (
                        <img
                          src={provider.image}
                          alt={provider.name}
                          className="w-9 h-9 rounded-full object-contain"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center">
                          <span className="text-xs font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                            {getFirstChar(provider.name)}
                          </span>
                        </div>
                      )}
                      <span className="text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark">
                        {provider.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                {providerSearch ? "No matches found" : "No providers available"}
              </div>
            )}
          </div>
        </div>
      </CenterModal>

      {/* Cable Package Selector Modal */}
      {selectedProvider && (
        <CenterModal visible={showPackageModal} onClose={() => setShowPackageModal(false)} title="Select Package">
          <div className="flex flex-col gap-4 max-h-[500px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
              <input
                type="text"
                placeholder="Search plan..."
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Packages List */}
            <div className="flex-1 flex flex-col gap-2 pr-1 overflow-y-auto">
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg: any) => {
                  const isSelected = !!selectedPackage && (
                    (pkg.plan_id !== undefined && selectedPackage.plan_id === pkg.plan_id) ||
                    (pkg.id !== undefined && selectedPackage.id === pkg.id)
                  );
                  return (
                    <button
                      key={pkg.plan_id || pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowPackageModal(false);
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all w-full cursor-pointer ${
                        isSelected
                          ? "border-primary-500 bg-[#E8F5E9] dark:bg-[#0B2E02]"
                          : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#111111] hover:bg-light-100 dark:hover:bg-dark-700/50"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 flex-1 mr-4">
                        <span className="text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark">
                          {pkg.plan_name || pkg.name}
                        </span>
                        {pkg.description && (
                          <span className="text-[11px] font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                            {pkg.description}
                          </span>
                        )}
                      </div>
                      <span className="text-b2 font-primary-bold text-primary-500">
                        ₦{Number(pkg.plan_price || pkg.price || pkg.amount).toLocaleString()}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  No packages found
                </div>
              )}
            </div>
          </div>
        </CenterModal>
      )}

      {/* Confirmation Modal */}
      {selectedPackage && selectedProvider && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Purchase"
          items={[
            { label: "Provider", value: selectedProvider.name },
            { label: "Smart Card / IUC", value: smartcard },
            { label: "Customer Name", value: accountName },
            { label: "Plan", value: selectedPackage.plan_name || selectedPackage.name },
            { label: "Amount", value: `₦${Number(selectedPackage.plan_price || selectedPackage.price || selectedPackage.amount).toLocaleString()}` },
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
      {selectedPackage && selectedProvider && (
        <BillSuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          billType="Cable TV"
          amount={selectedPackage.plan_price || selectedPackage.price || selectedPackage.amount}
          recipient={smartcard}
          recipientName={selectedProvider.name}
          referenceId={transactionId}
          onSaveBeneficiaryChange={(save) => {
            if (save) {
              dispatch(
                addCableBeneficiary({
                  id: smartcard,
                  name: accountName,
                  cablenumber: smartcard,
                  cableNetwork: selectedProvider.name,
                })
              );
            } else {
              dispatch(removeCableBeneficiary({ id: smartcard }));
            }
          }}
          onViewReceipt={() => {
            closeDrawer();
            router.push(`/dashboard/transactions/${transactionId}?type=cable`);
          }}
        />
      )}
    </div>
  );
}
