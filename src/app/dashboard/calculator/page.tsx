"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useFindGiftCardMutation,
  useFindSubCategoryMutation,
  useFindGiftCardTypeMutation,
  useFetchGiftCardRateMutation,
} from "@/redux/giftcards/giftcards_api";
import { useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { formatCurrency } from "@/utils/formatamount";
import { paths } from "@/utils/paths";
import { Loader2, ChevronDown, Plus, Minus, X, Search } from "lucide-react";
import { TokenManager } from "@/utils/token-manager";

export default function CalculatorPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"crypto" | "giftcard">("crypto");

  // --- CRYPTO STATE ---
  const { data: cryptoData, isLoading: loadingCrypto } = useGetCrptoNetworkQuery({});
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ abbr: "USD", name: "US Dollars" });
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [nairaRate, setNairaRate] = useState<number>(0);

  // Modals for Crypto
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // --- GIFT CARD STATE ---
  const [findGiftCard, { isLoading: loadingGC }] = useFindGiftCardMutation();
  const [findSubCategory, { isLoading: loadingSub }] = useFindSubCategoryMutation();
  const [findGiftCardType, { isLoading: loadingCardTypes }] = useFindGiftCardTypeMutation();
  const [fetchGiftCardRate, { isLoading: loadingRate }] = useFetchGiftCardRateMutation();

  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);

  const [selectedGC, setSelectedGC] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [selectedCardType, setSelectedCardType] = useState<any>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftQuantity, setGiftQuantity] = useState(1);

  // Modals for Gift Card
  const [showGCModal, setShowGCModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Calculated rates returns
  const [fetchedRateResponse, setFetchedRateResponse] = useState<any>(null);

  // Get dynamic crypto naira rate
  useEffect(() => {
    const rate = cryptoData?.all_addresses?.naira_rate || 0;
    setNairaRate(rate);
  }, [cryptoData]);

  // Transform crypto list
  const cryptoList = useMemo(() => {
    if (!cryptoData?.all_addresses?.data) return [];
    return Object.entries(cryptoData.all_addresses.data).map(([symbol, details]: [string, any]) => ({
      symbol,
      name: details.currencyName || symbol,
      image: details.image,
    }));
  }, [cryptoData]);

  // Fetch gift card categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = TokenManager.getToken();
        const response = await findGiftCard({
          data: { token }
        }).unwrap();
        const categories = response?.categories || response?.data?.categories || [];
        setGiftCards(categories);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, [findGiftCard]);

  // Fetch subcategories
  useEffect(() => {
    if (!selectedGC) {
      setSubCategories([]);
      setSelectedSub(null);
      setCardTypes([]);
      setSelectedCardType(null);
      return;
    }
    const preloadedList = selectedGC.countries || selectedGC.sub_category || selectedGC.subcategories || [];
    if (preloadedList.length > 0) {
      setSubCategories(preloadedList);
      setSelectedSub(null);
      setCardTypes([]);
      setSelectedCardType(null);
      setFetchedRateResponse(null);
    } else {
      const fetchSubs = async () => {
        try {
          const token = TokenManager.getToken();
          const response = await findSubCategory({
            data: {
              token,
              giftcard_id: selectedGC.id,
              name: selectedGC.name || selectedGC.title || selectedGC.productName
            }
          }).unwrap();
          const subs = response?.sub_category || response?.data?.sub_category || [];
          setSubCategories(subs);
          setSelectedSub(null);
          setCardTypes([]);
          setSelectedCardType(null);
          setFetchedRateResponse(null);
        } catch (err) {
          console.error("Failed to load subcategories", err);
        }
      };
      fetchSubs();
    }
  }, [selectedGC, findSubCategory]);

  // Fetch card types
  useEffect(() => {
    if (!selectedSub) {
      setCardTypes([]);
      setSelectedCardType(null);
      return;
    }
    if (selectedSub.types && selectedSub.types.length > 0) {
      setCardTypes(selectedSub.types);
      setSelectedCardType(null);
      setFetchedRateResponse(null);
      return;
    }
    const fetchTypes = async () => {
      try {
        const token = TokenManager.getToken();
        const response = await findGiftCardType({
          data: {
            token,
            sub_category: selectedSub.subcategory_id?.toString() || selectedSub.id?.toString()
          },
        }).unwrap();
        const types = response?.type || response?.data?.type || [];
        setCardTypes(types);
        setSelectedCardType(null);
        setFetchedRateResponse(null);
      } catch (err) {
        console.error("Failed to load card types", err);
      }
    };
    fetchTypes();
  }, [selectedSub, findGiftCardType]);

  // Reset calculations when tab switches
  useEffect(() => {
    setFetchedRateResponse(null);
  }, [activeTab]);

  const handleFetchGiftRate = async () => {
    if (!selectedCardType || !giftAmount) {
      showToast("Please select card details and enter amount", "warning");
      return;
    }
    const rawAmt = giftAmount.replace(/,/g, "");
    try {
      const token = TokenManager.getToken();
      const res = await fetchGiftCardRate({
        data: {
          token,
          type_id: selectedCardType.type_id || selectedCardType.id,
          amount: rawAmt,
          quantity: giftQuantity,
        },
      }).unwrap();
      if (res?.status === "success" || res?.data) {
        setFetchedRateResponse(res.data || res);
        showToast("Rate updated successfully!", "success");
      } else {
        showToast(res?.message || "Failed to retrieve rate", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Rate retrieval failed.", "error");
    }
  };

  const calculatedCryptoTotal = useMemo(() => {
    const rawAmt = cryptoAmount.replace(/,/g, "");
    const amt = parseFloat(rawAmt) || 0;
    return amt * nairaRate;
  }, [cryptoAmount, nairaRate]);

  const calculatedGiftTotal = useMemo(() => {
    const rawAmt = giftAmount.replace(/,/g, "");
    const amt = parseFloat(rawAmt) || 0;
    const currentRate = parseFloat(fetchedRateResponse?.rate) || 0;
    return amt * currentRate * giftQuantity;
  }, [giftAmount, fetchedRateResponse, giftQuantity]);

  const formatAmountInput = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    const parts = cleanText.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let finalVal = integerPart;
    if (parts.length > 1) {
      finalVal += "." + parts.slice(1).join("").substring(0, 8);
    }
    return finalVal;
  };
  const displayedTypes = (selectedSub?.types && selectedSub.types.length > 0) ? selectedSub.types : (cardTypes || []);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Rates Calculator
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Live conversion rates and estimated payouts for trades.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-border-light dark:border-[#232323] p-5 rounded-[30px] flex flex-col gap-6">
        {/* Tab switch header */}
        <div className="flex bg-[#F8F8F8] dark:bg-[#0C0C0C] p-1 rounded-[20px]">
          <button
            onClick={() => setActiveTab("crypto")}
            className={`flex-1 py-3.5 text-b2 font-primary-medium rounded-xl transition-all cursor-pointer ${activeTab === "crypto"
                ? "bg-white dark:bg-[#111111] text-primary-500 dark:text-primary-400 font-primary-semibold shadow-xs"
                : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
              }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setActiveTab("giftcard")}
            className={`flex-1 py-3.5 text-b2 font-primary-medium rounded-xl transition-all cursor-pointer ${activeTab === "giftcard"
                ? "bg-white dark:bg-[#111111] text-primary-500 dark:text-primary-400 font-primary-semibold shadow-xs"
                : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
              }`}
          >
            Gift card
          </button>
        </div>

        {/* --- CRYPTO TAB VIEW --- */}
        {activeTab === "crypto" ? (
          <div className="flex flex-col gap-4">
            {/* Select Crypto button trigger */}
            <button
              onClick={() => setShowCryptoModal(true)}
              className="w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-border-dark px-4 py-4 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {selectedCrypto?.image ? (
                  <img src={selectedCrypto.image} alt="" className="w-8 h-8 rounded-full object-contain" />
                ) : null}
                <span>{selectedCrypto ? `${selectedCrypto.name} (${selectedCrypto.symbol.toUpperCase()})` : "Select crypto"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
            </button>

            {/* Select Currency button trigger */}
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-border-dark px-4 py-4 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer"
            >
              <span>{selectedCurrency.abbr} ({selectedCurrency.name})</span>
              <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
            </button>

            {/* Amount input */}
            <Input
              placeholder="Enter amount"
              value={cryptoAmount}
              onChange={(e) => setCryptoAmount(formatAmountInput(e.target.value))}
              leadingIcon={<span className="font-primary-bold text-b1 text-text-secondary-light dark:text-text-secondary-dark">{selectedCurrency.abbr === "USD" ? "$" : "₦"}</span>}
            />

            {/* Calculated box results */}
            <div className="w-full bg-primary-500/[0.04] dark:bg-primary-500/[0.04] border border-primary-500/25 rounded-[20px] px-4 py-5 flex flex-col items-center text-center gap-1">
              <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                You’ll receive in total
              </span>
              <span className="text-[28px] font-primary-bold text-primary-500 dark:text-primary-400">
                ₦{Number(calculatedCryptoTotal.toFixed(2)).toLocaleString()}
              </span>
              <span className="text-[12px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Rate: $1 ~ ₦{Number(nairaRate).toLocaleString()}
              </span>
            </div>

            <Button
              disabled={!selectedCrypto || !cryptoAmount}
              onClick={() => router.push(`/dashboard?drawer=sell-crypto&symbol=${selectedCrypto.symbol}`)}
              fullWidth
              className="mt-2 h-14 rounded-full text-b1 font-primary-bold"
            >
              Deposit Now
            </Button>
          </div>
        ) : (
          /* --- GIFT CARD TAB VIEW --- */
          <div className="flex flex-col gap-4">
            {/* Category selection */}
            <button
              onClick={() => setShowGCModal(true)}
              className="w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-border-dark px-4 py-4 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {selectedGC?.image ? (
                  <img src={selectedGC.image} alt="" className="w-8 h-8 rounded-full object-contain" />
                ) : null}
                <span>{selectedGC?.title || selectedGC?.name || "Select category"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
            </button>

            {/* Country/Subcategory selection */}
            <button
              disabled={!selectedGC}
              onClick={() => setShowSubModal(true)}
              className={`w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-border-dark px-4 py-4 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer ${!selectedGC ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <span>{selectedSub?.country || "Select Country / Currency"}</span>
              <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
            </button>

            {/* Card Type selection */}
            <button
              disabled={!selectedSub}
              onClick={() => setShowTypeModal(true)}
              className={`w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-border-dark px-4 py-4 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer ${!selectedSub ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <span>{selectedCardType?.type || "Select card type"}</span>
              <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
            </button>

            {/* Input Amount */}
            <Input
              placeholder="Enter amount"
              value={giftAmount}
              onChange={(e) => {
                setGiftAmount(formatAmountInput(e.target.value));
                setFetchedRateResponse(null);
              }}
              leadingIcon={<span className="font-primary-bold text-b1 text-text-secondary-light dark:text-text-secondary-dark">$</span>}
            />

            {/* Quantity Selector block */}
            <div className="flex items-center gap-4 justify-between">
              <button
                type="button"
                onClick={() => setGiftQuantity((q) => Math.max(1, q - 1))}
                className="items-center justify-center h-14 flex-1 bg-light-100 dark:bg-[#232323] hover:opacity-85 rounded-[20px] flex text-h6 font-primary-bold cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 h-14 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] flex items-center justify-center text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                {giftQuantity}
              </div>
              <button
                type="button"
                onClick={() => setGiftQuantity((q) => q + 1)}
                className="items-center justify-center h-14 bg-light-100 dark:bg-[#232323] hover:opacity-85 flex-1 rounded-[20px] flex text-h6 font-primary-bold cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Calculate rates button */}
            <button
              onClick={handleFetchGiftRate}
              disabled={loadingRate}
              className="py-3 rounded-[20px] items-center justify-center border border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-500 font-primary-semibold flex cursor-pointer text-b2"
            >
              {loadingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : "See Rate"}
            </button>

            {/* Estimated Receive Box */}
            <div className="w-full bg-primary-500/[0.04] dark:bg-primary-500/[0.04] border border-primary-500/25 rounded-[20px] px-4 py-5 flex flex-col items-center text-center gap-1">
              <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                You’ll receive in total
              </span>
              <span className="text-[28px] font-primary-bold text-primary-500 dark:text-primary-400">
                ₦{Number(calculatedGiftTotal.toFixed(2)).toLocaleString()}
              </span>
              <span className="text-[12px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Rate: $1 ~ ₦{Number(fetchedRateResponse?.rate || 0).toLocaleString()}
              </span>
            </div>

            <Button
              disabled={!selectedGC || !selectedSub || !selectedCardType || !giftAmount}
              onClick={() => router.push(`/dashboard?drawer=sell-giftcard&cardName=${encodeURIComponent(selectedGC.name)}&cardId=${selectedGC.id}`)}
              fullWidth
              className="mt-2 h-14 rounded-full text-b1 font-primary-bold"
            >
              Sell Gift card
            </Button>
          </div>
        )}
      </div>

      {/* --- SELECTION OVERLAY MODALS --- */}

      {/* Crypto Selector Modal */}
      {showCryptoModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Crypto Currency
              </h4>
              <button onClick={() => setShowCryptoModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingCrypto ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-14 bg-light-200 dark:bg-dark-300 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : cryptoList.length > 0 ? (
                cryptoList.map((coin: any) => (
                  <button
                    key={coin.symbol}
                    onClick={() => {
                      setSelectedCrypto(coin);
                      setShowCryptoModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                  >
                    {coin.image ? (
                      <img src={coin.image} alt="" className="w-8 h-8 rounded-full object-contain bg-light-100" />
                    ) : null}
                    <span className="uppercase">{coin.name} ({coin.symbol})</span>
                  </button>
                ))
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No cryptocurrencies found</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Currency Selector Modal */}
      {showCurrencyModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Currency
              </h4>
              <button onClick={() => setShowCurrencyModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { abbr: "USD", name: "US Dollars" },
                { abbr: "NGN", name: "Naira" },
              ].map((curr) => (
                <button
                  key={curr.abbr}
                  onClick={() => {
                    setSelectedCurrency(curr);
                    setShowCurrencyModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                >
                  <span>{curr.abbr} ({curr.name})</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Gift Card Category selector Modal */}
      {showGCModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Category
              </h4>
              <button onClick={() => setShowGCModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingGC ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-14 bg-light-200 dark:bg-dark-300 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : giftCards.length > 0 ? (
                giftCards.map((gc: any) => (
                  <button
                    key={gc.id}
                    onClick={() => {
                      setSelectedGC(gc);
                      setShowGCModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                  >
                    {gc.image ? (
                      <img src={gc.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-light-100" />
                    ) : null}
                    <span>{gc.title || gc.name}</span>
                  </button>
                ))
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No categories found</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Gift Card Country selector Modal */}
      {showSubModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Country / Currency
              </h4>
              <button onClick={() => setShowSubModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingSub ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-14 bg-light-200 dark:bg-dark-300 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : subCategories.length > 0 ? (
                subCategories.map((sub: any) => (
                  <button
                    key={sub.subcategory_id || sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setShowSubModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                  >
                    <span>{sub.country || sub.name} ({sub.currency || "USD"})</span>
                  </button>
                ))
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No countries found</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Gift Card Type selector Modal */}
      {showTypeModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Card Type
              </h4>
              <button onClick={() => setShowTypeModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loadingCardTypes && (!selectedSub?.types || selectedSub.types.length === 0) ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-14 bg-light-200 dark:bg-dark-300 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : displayedTypes.length > 0 ? (
                displayedTypes.map((type: any) => {
                  const isSelected = selectedCardType?.type_id === type.type_id || selectedCardType?.type === type.type;
                  return (
                    <button
                      key={type.type_id || type.id}
                      onClick={() => {
                        setSelectedCardType(type);
                        setShowTypeModal(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-colors ${isSelected
                          ? "bg-[#E8F5E9] dark:bg-[#0B2E02] border-primary-500"
                          : "border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800"
                        }`}
                    >
                      {/* Type image */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-light-100 dark:bg-dark-700">
                        {type.type_image ? (
                          <img src={type.type_image} alt={type.type} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-primary-bold text-text-secondary-light dark:text-text-secondary-dark">
                            {(type.type || "T").charAt(0)}
                          </span>
                        )}
                      </div>
                      {/* Type name + description */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={`text-b2 font-primary-bold ${isSelected ? "text-primary-700 dark:text-white" : "text-text-primary-light dark:text-text-primary-dark"}`}>
                          {type.type}
                        </span>
                        {type.type_description && (
                          <span className={`text-b3 font-primary-regular mt-0.5 ${isSelected ? "text-primary-600/70 dark:text-white/60" : "text-text-secondary-light dark:text-text-secondary-dark"}`}>
                            {type.type_description}
                          </span>
                        )}
                        {/* <span className={`text-b3 font-primary-medium mt-0.5 ${isSelected ? "text-primary-600 dark:text-white/80" : "text-text-tertiary-light dark:text-text-tertiary-dark"}`}>
                          Rate: ₦{Number(type.type_description).toLocaleString() || ''}
                        </span> */}
                      </div>
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-white font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No card types found</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
