"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useBuyDataMutation, useGetPlanTypeMutation } from "@/redux/bills/bills_api";
import { useToast } from "@/context/ToastProvider";
import { NetworkSelector } from "./shared/NetworkSelector";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { addPhoneBeneficiary, removePhoneBeneficiary } from "@/redux/beneficiary/bene_slice";
import { ChevronDown, ChevronUp, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";

const planTypes = ["Daily", "Weekly", "Monthly", "Yearly"];

export function BuyDataService() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();
  const [buyData, { isLoading: isBuying }] = useBuyDataMutation();
  const [getPlanType, { isLoading: isFetchingPlans }] = useGetPlanTypeMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  const phoneBeneficiaries = useAppSelector((state: any) => state.beneficiary.phoneBeneficiaries) || [];

  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  const [activePlanType, setActivePlanType] = useState("Weekly");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState(false);

  // Modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  // Fetch plan types when network or plan duration tab changes
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getPlanType({
          data: {
            network: selectedNetwork.toLowerCase(),
            time: activePlanType,
          },
        }).unwrap();

        if (res?.status === "success") {
          setPlans(res.data_plans || res.packages || []);
          setSelectedPlan(null); // Reset selection
        } else {
          setPlans([]);
        }
      } catch (err) {
        setPlans([]);
      }
    };
    fetchPlans();
  }, [selectedNetwork, activePlanType, getPlanType]);

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
    if (!selectedPlan) {
      showToast("Please select a data plan", "warning");
      return;
    }
    const planCost = Number(selectedPlan.amount);
    if (balance < planCost) {
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
        planId: selectedPlan.plan_id || selectedPlan.id,
        pin,
      };

      const response = await buyData({ data: payload }).unwrap();

      if (response.status === "success" || response.status === true || response.success === true) {
        setTransactionId(response?.data?.transid || response?.transid || "TXN" + Date.now());
        setShowPin(false);
        showToast("Data plan purchased successfully", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Data purchase failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to purchase data plan.";
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

          {/* Beneficiary Accordion */}
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

        {/* Plan Select Wrapper */}
        <div className="flex flex-col gap-4">
          <label className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Select Plan Type
          </label>

          {/* Plan Duration Tabs */}
          <div className="flex gap-2 p-1.5 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl w-full">
            {planTypes.map((type) => {
              const isActive = activePlanType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivePlanType(type)}
                  className={`flex-1 py-2 text-b3 font-primary-bold text-center rounded-xl transition-all cursor-pointer ${isActive
                    ? "bg-primary-500 text-white shadow-md"
                    : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-light-100 dark:hover:bg-dark-800"
                    }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Plans List */}
          <div className={`bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl min-h-[160px] max-h-[300px] flex flex-col gap-2 ${isFetchingPlans ? "overflow-hidden" : "overflow-y-auto"
            }`}>
            {isFetchingPlans ? (
              <div className="flex flex-col gap-2 w-full">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`ske-${idx}`}
                    className="flex justify-between items-center p-3.5 rounded-2xl border border-border-light/60 dark:border-border-dark bg-background-light dark:bg-background-dark animate-pulse select-none"
                  >
                    <div className="flex flex-col gap-1.5 w-2/3">
                      <div className="h-4 bg-light-200 dark:bg-dark-800 rounded w-full animate-pulse" />
                      <div className="h-3 bg-light-200 dark:bg-dark-800 rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-4 bg-light-200 dark:bg-dark-800 rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : plans.length > 0 ? (
              plans.map((plan) => {
                const isSelected = !!selectedPlan && (
                  (plan.id !== undefined && selectedPlan.id === plan.id) ||
                  (plan.plan_id !== undefined && selectedPlan.plan_id === plan.plan_id)
                );
                return (
                  <button
                    key={plan.id || plan.plan_id}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex justify-between items-center p-3 rounded-2xl border text-left transition-colors w-full cursor-pointer ${isSelected
                      ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                      : "border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-light-100 dark:hover:bg-dark-800"
                      }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                        {plan.size || plan.name || plan.plan_name || "Data Plan"}
                      </span>
                      <span className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                        {plan.duration || plan.validity || "Validity: N/A"}
                      </span>
                    </div>
                    <span className="text-b2 font-primary-bold text-primary-500">
                      ₦{Number(plan.amount || plan.price).toLocaleString()}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center py-8 text-center text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                No data plans found for {activePlanType}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!phoneNumber || !selectedPlan}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Purchase"
          items={[
            { label: "Network", value: activeNetworkObj.name },
            { label: "Phone Number", value: phoneNumber },
            { label: "Plan Selected", value: selectedPlan.name || selectedPlan.plan_name },
            { label: "Amount", value: `₦${Number(selectedPlan.amount || selectedPlan.price).toLocaleString()}` },
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
      {/* {selectedPlan && ( */}
      <BillSuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        billType="data"
        amount={selectedPlan?.amount || selectedPlan?.price || 0}
        recipient={phoneNumber}
        recipientName={activeNetworkObj?.name}
        referenceId={transactionId}
        onSaveBeneficiaryChange={(save) => {
          if (save) {
            dispatch(
              addPhoneBeneficiary({
                id: phoneNumber,
                number: phoneNumber,
                network: selectedNetwork,
                name: activeNetworkObj?.name,
              })
            );
          } else {
            dispatch(removePhoneBeneficiary({ id: phoneNumber }));
          }
        }}
        onViewReceipt={() => {
          closeDrawer();
          router.push(`/dashboard/transactions/${transactionId}?type=data`);
        }}
      />
      {/* )} */}
    </div>
  );
}
