"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useGetAllGiftCardsMutation, useBuyGiftCardMutation } from "@/redux/giftcards/giftcards_api";
import { useToast } from "@/context/ToastProvider";
import { CenterModal } from "@/components/modals/CenterModal";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { ChevronDown, Loader2, Mail, User, Search, Check, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";
import { COUNTRIES, POPULAR_COUNTRY_CODES } from "@/utils/countries";

interface CountryItem {
  name: string;
  code: string;
  flag: string;
}

const buyCountries = COUNTRIES;


export function BuyGiftCardService() {
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer } = useDrawer();

  const [getAllGiftCards, { isLoading: loadingGC }] = useGetAllGiftCardsMutation();
  const [buyGC, { isLoading: purchasing }] = useBuyGiftCardMutation();

  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};
  const balance = Number(user?.bal || 0);

  // Selected states
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(
    buyCountries.find((c) => c.code === "US") || buyCountries[0]
  );
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [selectedGC, setSelectedGC] = useState<any>(null);

  // Form inputs
  const [activeRecipientTab, setActiveRecipientTab] = useState<"myself" | "someone">("myself");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Modal/Search/Search UI states
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search filter states
  const [countrySearch, setCountrySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // Result details
  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  // Sync recipient details when "myself" tab is selected or user changes
  useEffect(() => {
    if (activeRecipientTab === "myself" && user) {
      setRecipientName(user.name || user.full_name || "");
      setRecipientEmail(user.email || "");
    } else if (activeRecipientTab === "someone") {
      setRecipientName("");
      setRecipientEmail("");
    }
  }, [activeRecipientTab, user]);

  // Load Gift Cards dynamically based on the selected country
  const fetchGiftCards = useCallback(async () => {
    try {
      const res = await getAllGiftCards({
        data: {
          country_letter: selectedCountry.code,
        },
      }).unwrap();
      const items = res?.data || res || [];
      setGiftCards(Array.isArray(items) ? items : []);
    } catch (err) {
      setGiftCards([]);
    }
  }, [selectedCountry, getAllGiftCards]);

  useEffect(() => {
    fetchGiftCards();
    setSelectedGC(null);
  }, [selectedCountry, fetchGiftCards]);

  const handleSelectCountry = (country: CountryItem) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    setCountrySearch("");
  };

  const handleSelectGC = (gc: any) => {
    setSelectedGC(gc);
    setShowBrandModal(false);
    setBrandSearch("");
  };

  // Rates are calculated locally using selectedGC.exchangeRate / selectedGC.rate
  const exchangeRate = useMemo(() => {
    if (!selectedGC) return 0;
    return Number(selectedGC.exchangeRate || selectedGC.rate || 0);
  }, [selectedGC]);

  const calculatedValue = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return amt * exchangeRate * quantity;
  }, [amount, exchangeRate, quantity]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGC) {
      showToast("Please select a gift card", "warning");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (!recipientEmail || !recipientName) {
      showToast("Please fill in recipient details", "warning");
      return;
    }
    if (calculatedValue > balance) {
      showToast("Insufficient wallet balance to buy this card", "error");
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
        pin,
        countryCode: selectedGC.countryCode || selectedCountry.code,
        productId: (selectedGC.id || selectedGC.productId).toString(),
        unitPrice: amount,
        senderName: activeRecipientTab === "myself" ? (user.name || "Myself") : recipientName,
        recipientEmail: activeRecipientTab === "myself" ? user.email : recipientEmail,
        quantity: quantity.toString(),
      };

      const response = await buyGC({ data: payload }).unwrap();

      if (response?.status === "success" || response?.status === true || response?.success === true) {
        setTransactionId(response?.transid || response?.reference || "REF" + Date.now());
        setShowPin(false);
        showToast("Gift card purchased successfully", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Purchase failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to buy gift card.";
      showToast(errMsg, "error");
    }
  };

  // Filters
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) {
      const popular = buyCountries.filter((c) =>
        POPULAR_COUNTRY_CODES.includes(c.code)
      );
      const others = buyCountries.filter(
        (c) => !POPULAR_COUNTRY_CODES.includes(c.code)
      );
      return [...popular, ...others];
    }
    return buyCountries.filter((c) =>
      c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  const filteredGC = giftCards.filter((gc) =>
    (gc.name || gc.title || gc.productName || "").toLowerCase().includes(brandSearch.toLowerCase())
  );

  const getFirstChar = (text: string) => text.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      {/* Top Search & Country bar matching mobile layout */}
      {!selectedGC && (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search gift card"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCountryModal(true)}
            className="bg-light-50 dark:bg-dark-900 px-4 py-3 rounded-[20px] border border-border-light dark:border-border-dark flex items-center justify-center gap-1.5 text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 transition-all cursor-pointer min-w-[76px]"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span>{selectedCountry.code}</span>
          </button>
        </div>
      )}

      {selectedGC ? (
        // Second Screen: Form purchase setup (mirroring buyGiftCards.tsx)
        <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
          {/* Header Card Brand Select */}
          <div className="flex justify-between items-center bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-3.5 rounded-[20px]">
            <div className="flex items-center gap-3">
              {selectedGC.image || (selectedGC.logoUrls && selectedGC.logoUrls[0]) ? (
                <img
                  src={selectedGC.image || selectedGC.logoUrls[0]}
                  alt={selectedGC.name || selectedGC.productName}
                  className="w-8 h-8 object-contain rounded-full bg-white dark:bg-dark-800 border border-border-light/50 dark:border-border-dark/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-xs text-text-primary-light dark:text-text-primary-dark">
                  {getFirstChar(selectedGC.name || selectedGC.productName)}
                </div>
              )}
              <span className="font-primary-semibold text-b2 text-text-primary-light dark:text-text-primary-dark truncate">
                {selectedGC.name || selectedGC.productName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGC(null)}
              className="text-b3 font-primary-bold text-primary-500 hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* Recipient Details Tab Toggle */}
          <div className="flex items-center justify-between bg-light-50 dark:bg-dark-900 rounded-[20px] p-1.5 border border-border-light dark:border-border-dark w-full">
            <button
              type="button"
              onClick={() => setActiveRecipientTab("myself")}
              className={`flex-1 items-center justify-center rounded-[16px] py-3 transition-all cursor-pointer text-b3 font-primary-medium ${activeRecipientTab === "myself" ? "bg-white dark:bg-dark-700 text-primary-500 shadow-sm" : "bg-transparent text-text-secondary-light dark:text-text-secondary-dark"}`}
            >
              Myself
            </button>
            <button
              type="button"
              onClick={() => setActiveRecipientTab("someone")}
              className={`flex-1 items-center justify-center rounded-[16px] py-3 transition-all cursor-pointer text-b3 font-primary-medium ${activeRecipientTab === "someone" ? "bg-white dark:bg-dark-700 text-primary-500 shadow-sm" : "bg-transparent text-text-secondary-light dark:text-text-secondary-dark"}`}
            >
              Someone
            </button>
          </div>

          {/* Recipient Details Card */}
          <div className="flex flex-col gap-4 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl">
            {activeRecipientTab === "myself" ? (
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Recipient Name: <strong className="text-primary-500 font-primary-bold ml-1">{user.name || user.full_name || "Myself"}</strong>
                </span>
                <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Recipient Email: <strong className="text-primary-500 font-primary-bold ml-1">{user.email}</strong>
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-[#FCFCFC] dark:bg-dark-950/20 border border-border-light dark:border-border-dark px-4 py-3 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-[#FCFCFC] dark:bg-dark-950/20 border border-border-light dark:border-border-dark px-4 py-3 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Card value and Quantity selection */}
          <div className="flex flex-col gap-4 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                Card Amount / Value ($)
              </label>
              <input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-[#FCFCFC] dark:bg-dark-950/20 border border-border-light dark:border-border-dark px-4 py-3 rounded-[20px] text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 cursor-pointer"
                >
                  -
                </button>
                <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Live Calculation Display */}
          {amount && Number(amount) > 0 && (
            <div className="bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 p-4 rounded-3xl flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-b3 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
                <span>Exchange Rate:</span>
                <span className="text-primary-500 font-primary-bold">₦{exchangeRate.toLocaleString()} / $</span>
              </div>
              <div className="border-t border-primary-500/10 pt-2.5 flex justify-between items-center text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                <span>Total Price (NGN):</span>
                <span className="text-primary-500 text-b1">₦{calculatedValue.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!amount || !recipientEmail || !recipientName}
            className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue
          </button>
        </form>
      ) : (
        // First Screen: List of dynamically loaded Brands based on country, filterable by Search Input
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-4">
          <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark select-none">
            Popular Gift Cards
          </h4>

          {loadingGC ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filteredGC.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filteredGC.map((gc, index) => (
                <button
                  key={`${gc.id || gc.productId || gc.name || gc.productName || 'gc'}-${index}`}
                  type="button"
                  onClick={() => handleSelectGC(gc)}
                  className="flex flex-col items-center gap-3 p-4 rounded-[20px] border border-border-light dark:border-border-dark bg-light-50 dark:bg-dark-900 hover:bg-light-100 dark:hover:bg-dark-800 hover:border-primary-500/50 hover:scale-[1.02] transition-all cursor-pointer text-center group"
                >
                  {gc.image || (gc.logoUrls && gc.logoUrls[0]) ? (
                    <img
                      src={gc.image || gc.logoUrls[0]}
                      alt={gc.name || gc.productName}
                      className="w-14 h-14 object-contain rounded-2xl bg-white dark:bg-dark-800 p-1 border border-border-light/60 dark:border-border-dark/60"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-light-200 dark:bg-dark-800 flex items-center justify-center font-primary-bold text-b1 text-text-primary-light dark:text-text-primary-dark uppercase">
                      {getFirstChar(gc.name || gc.productName)}
                    </div>
                  )}
                  <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark group-hover:text-primary-500 transition-colors line-clamp-1">
                    {gc.name || gc.productName}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark select-none">
              No gift cards found
            </div>
          )}
        </div>
      )}

      {/* Country Selector Modal */}
      <CenterModal visible={showCountryModal} onClose={() => { setShowCountryModal(false); setCountrySearch(""); }} title="Select Country">
        <div className="flex flex-col gap-4 max-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search country..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Countries List */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredCountries.map((country, index) => {
              const isSelected = !!selectedCountry && selectedCountry.code === country.code;
              return (
                <button
                  key={`${country.code || 'country'}-${index}`}
                  type="button"
                  onClick={() => handleSelectCountry(country)}
                  className={`flex items-center justify-between p-4 rounded-[20px] border text-left transition-all w-full cursor-pointer ${isSelected
                    ? "border-primary-500 bg-primary-500"
                    : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#0C0C0C] hover:bg-light-100 dark:hover:bg-dark-700/50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className={`text-b2 font-primary-medium ${isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                      {country.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <span className="text-[10px] text-primary-500 font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CenterModal>

      {/* Confirmation Modal */}
      {selectedGC && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Purchase"
          items={[
            { label: "Card Brand", value: selectedGC.name || selectedGC.productName },
            { label: "Card Value ($)", value: `$${amount}` },
            { label: "Quantity", value: quantity.toString() },
            { label: "Recipient Name", value: recipientName },
            { label: "Recipient Email", value: recipientEmail },
            { label: "Total Cost", value: `₦${calculatedValue.toLocaleString()}` },
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

      {/* Processing loader */}
      <ProcessingLoader visible={purchasing} />

      {/* Success Modal */}
      {selectedGC && (
        <BillSuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          billType="Gift Card"
          amount={calculatedValue.toString()}
          recipient={recipientEmail}
          recipientName={`${selectedGC.name || selectedGC.productName} ($${amount})`}
          referenceId={transactionId}
          onViewReceipt={() => {
            closeDrawer();
            router.push(`/dashboard/transactions/${transactionId}?type=giftcard`);
          }}
        />
      )}
    </div>
  );
}
