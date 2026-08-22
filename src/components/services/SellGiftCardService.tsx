"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useFindGiftCardMutation, useFindSubCategoryMutation, useTradeGiftCardMutation, useFetchGiftCardRateMutation } from "@/redux/giftcards/giftcards_api";
import { useToast } from "@/context/ToastProvider";
import { CenterModal } from "@/components/modals/CenterModal";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { PinEntryModal } from "./shared/PinEntryModal";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { BillSuccessModal } from "./shared/BillSuccessModal";
import { SellGiftCardSuccessModal } from "@/components/modals/SellGiftCardSuccessModal";
import { ChevronDown, Upload, Trash2, Search, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";
import { app_config } from "@/utils/config";

export function SellGiftCardService() {
  const { showToast } = useToast();
  const router = useRouter();
  const { closeDrawer, drawerData } = useDrawer();

  // API Mutations
  const [findGiftCard, { isLoading: loadingGC }] = useFindGiftCardMutation();
  const [findSubCategory, { isLoading: loadingSub }] = useFindSubCategoryMutation();
  const [fetchRate, { isLoading: loadingRate }] = useFetchGiftCardRateMutation();
  const [tradeGC, { isLoading: trading }] = useTradeGiftCardMutation();

  // Redux User Info
  const userState = useAppSelector((state: any) => state.auth.user);
  const user = userState?.user || userState || {};

  // Form states
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [selectedGC, setSelectedGC] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [selectedCardType, setSelectedCardType] = useState<any>(null);

  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [referralCode, setReferralCode] = useState("");
  const [speed, setSpeed] = useState("");
  const [note, setNote] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [fetchedRateResponse, setFetchedRateResponse] = useState<any>(null);

  // File Upload states
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState("");

  // UI/Modal states
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search filter states
  const [brandSearch, setBrandSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  const [transactionId, setTransactionId] = useState("");
  const [pinError, setPinError] = useState("");

  const paramCardName = drawerData?.cardName;
  const paramCardId = drawerData?.cardId;

  console.log("[DEBUG] SellGiftCardService rendering. drawerData:", drawerData, "paramCardId:", paramCardId, "paramCardName:", paramCardName);

  // Load Gift Cards Brand List on mount
  useEffect(() => {
    const fetchGC = async () => {
      try {
        const response = await findGiftCard({ data: {} }).unwrap();
        const categories = response?.categories || response?.data?.categories || response?.giftcards || response?.data?.giftcards || [];
        setGiftCards(categories);
        console.log("[DEBUG] fetchGC loaded categories:", categories.length);
        console.log("[DEBUG] category names:", categories.map((c: any) => c.name));

        if (paramCardId || paramCardName) {
          const normalize = (str: string) => String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
          const normParamName = paramCardName ? normalize(paramCardName) : "";

          const matched = categories.find((c: any) => {
            if (paramCardId && c.id && String(c.id) === String(paramCardId)) return true;
            if (!normParamName) return false;
            
            const normName = normalize(c.name || c.title || "");
            if (!normName) return false;
            
            return (
              normName === normParamName ||
              normName.includes(normParamName) ||
              normParamName.includes(normName)
            );
          });
          console.log("[DEBUG] fetchGC matching check. matched:", matched);
          if (matched) {
            setSelectedGC(matched);
          }
        }
      } catch (err) {
        console.error("[DEBUG] fetchGC error:", err);
        setGiftCards([]);
      }
    };
    fetchGC();
  }, [findGiftCard, paramCardId, paramCardName]);

  // Load subcategories when brand changes
  useEffect(() => {
    if (selectedGC) {
      const preloadedList = selectedGC.countries || selectedGC.sub_category || selectedGC.subcategories || [];
      if (preloadedList.length > 0) {
        setSubCategories(preloadedList);
      } else {
        const fetchSub = async () => {
          try {
            const response = await findSubCategory({
              data: {
                giftcard_id: selectedGC.id,
                name: selectedGC.name || selectedGC.title || selectedGC.productName
              }
            }).unwrap();
            const list = response?.sub_category || response?.data?.sub_category || response?.subcategories || response?.data?.subcategories || [];
            setSubCategories(list);
          } catch (err) {
            setSubCategories([]);
          }
        };
        fetchSub();
      }
    } else {
      setSubCategories([]);
    }
    setSelectedSub(null);
    setSelectedCardType(null);
    setRate(null);
    setSpeed("");
    setFetchedRateResponse(null);
  }, [selectedGC, findSubCategory]);

  const handleSelectGC = (gc: any) => {
    setSelectedGC(gc);
    setShowBrandModal(false);
    setBrandSearch("");
    setFetchedRateResponse(null);
  };

  const handleSelectSub = (sub: any) => {
    setSelectedSub(sub);
    setSelectedCardType(null);
    setRate(sub.rate || null);
    setShowSubModal(false);
    setSubSearch("");
    setFetchedRateResponse(null);

    // Auto-select speed based on availability (mirroring mobile)
    if (sub.slow_enabled === 1) {
      setSpeed("slow");
    } else if (sub.fast_enabled === 1) {
      setSpeed("fast");
    } else {
      setSpeed("");
    }
  };

  const handleSelectType = (typeItem: any) => {
    setSelectedCardType(typeItem);
    setRate(typeItem.rate || null);
    setShowTypeModal(false);
    setTypeSearch("");
    setFetchedRateResponse(null);
  };

  // Fetch Rate dynamically
  const handleFetchRate = async () => {
    if (!selectedGC || !selectedSub || !amount || Number(amount) <= 0 || !selectedCardType
      && (selectedCardType?.type_id !== 'manual' && selectedCardType?.id !== 'manual')) {
      showToast("Please enter an amount first and select card type", "warning");
      return;
    }
    try {
      const response = await fetchRate({
        data: {
          giftcard_id: selectedGC.id,
          subcategory_id: selectedSub.id,
          type_id: selectedCardType?.type_id || selectedCardType?.id,
          amount: parseFloat(amount),
          quantity: quantity,
        },
      }).unwrap();
      const resolvedRate = response?.rate || response?.data?.rate;
      if (resolvedRate) {
        setRate(resolvedRate);
        setFetchedRateResponse(response?.data || response || { rate: resolvedRate });
        showToast("Rate updated!", "success");
      }
    } catch (err: any) {
      showToast(`${err?.message || err?.data?.message || "Failed to fetch current rate"}`, "info");
    }
  };

  const calculateTotal = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const currentRate = rate || 0;
    return amt * currentRate * quantity;
  }, [amount, rate, quantity]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (selectedFiles.length >= 4) {
        showToast("Maximum of 4 images allowed", "warning");
        e.target.value = "";
        return;
      }
      const newFiles = Array.from(files).slice(0, 4 - selectedFiles.length);
      if (files.length > (4 - selectedFiles.length)) {
        showToast("Maximum of 4 images allowed", "warning");
      }
      const newFileObjects = newFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setSelectedFiles((prev) => [...prev, ...newFileObjects]);
      e.target.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGC) {
      showToast("Please select a brand", "warning");
      return;
    }
    if (!selectedSub) {
      showToast("Please select a country sub-category", "warning");
      return;
    }
    const isCreateYourGiftcardOrder = selectedGC?.name === "Create Your Giftcard Order";
    if (!isCreateYourGiftcardOrder && !selectedCardType) {
      showToast("Please select card type", "warning");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (selectedFiles.length === 0) {
      showToast("Please upload at least one photo of the card", "warning");
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

    console.log('selectedCardType', selectedCardType);
    console.log('selectedSub', selectedSub);
    console.log('selectedGC', selectedGC);
    console.log('amount', amount);
    console.log('quantity', quantity);
    console.log('referralCode', referralCode);
    console.log('speed', speed);
    console.log('note', note);
    console.log('rate', rate);
    console.log('fetchedRateResponse', fetchedRateResponse);
    console.log('pin', pin);
    console.log('selectedFiles', selectedFiles);
    try {
      const isCreateYourGiftcardOrder = selectedGC?.name === "Create Your Giftcard Order";
      const form = new FormData();
      form.append("category", selectedGC?.name || "");
      form.append("card_form", isCreateYourGiftcardOrder ? "manual" : (selectedCardType?.type || ""));
      form.append("country", selectedSub?.country || "");
      form.append("referral_code", referralCode);
      form.append("quantity", quantity.toString());
      form.append("card_amount", amount);
      form.append("rate", String(isCreateYourGiftcardOrder ? "0" : (fetchedRateResponse?.rate || "0")));
      form.append("comment", note);
      form.append("speed", speed);
      form.append("type_id", isCreateYourGiftcardOrder ? "manual" : String(selectedCardType?.type_id || selectedCardType?.id || ""));
      form.append("pin", pin);

      selectedFiles.forEach((item) => {
        form.append("files[]", item.file);
      });

      const response = await tradeGC({ data: form }).unwrap();

      if (response?.status === "success" || response?.status === true || response?.success === true) {
        setTransactionId(response?.transid || response?.reference || "REF" + Date.now());
        setShowPin(false);
        showToast("Gift card trade submitted successfully", "success");
        setShowSuccess(true);
      } else {
        showToast(response?.message || "Trade submission failed", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to submit gift card trade.";
      showToast(errMsg, "error");
    }
  };

  // Lists filtered by search query
  const filteredGC = giftCards.filter((gc) =>
    (gc.name || gc.title || "").toLowerCase().includes(brandSearch.toLowerCase())
  );

  const filteredSubs = subCategories.filter((sub) =>
    (sub.country || sub.name || "").toLowerCase().includes(subSearch.toLowerCase())
  );

  const cardTypes = selectedSub?.types || [];
  const filteredTypes = cardTypes.filter((typeItem: any) =>
    (typeItem.type || "").toLowerCase().includes(typeSearch.toLowerCase())
  );

  const getFirstChar = (text: string) => text.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleContinue} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
            Card Category
          </label>
          <button
            type="button"
            onClick={() => setShowBrandModal(true)}
            className="bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark flex items-center justify-between rounded-[20px] p-3.5 w-full text-left cursor-pointer transition-all hover:border-primary-500/50"
          >
            <div className="flex items-center gap-3">
              {selectedGC ? (
                selectedGC.image || (selectedGC.logoUrls && selectedGC.logoUrls[0]) ? (
                  <img
                    src={selectedGC.image || selectedGC.logoUrls[0]}
                    alt=""
                    className="w-8 h-8 object-contain rounded-full bg-white dark:bg-dark-800 border border-border-light/50 dark:border-border-dark/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-xs text-text-primary-light dark:text-text-primary-dark">
                    {getFirstChar(selectedGC.name || selectedGC.title)}
                  </div>
                )
              ) : null}
              <span className={selectedGC ? "text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark" : "text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark"}>
                {selectedGC ? (selectedGC.name || selectedGC.title) : "Select category card"}
              </span>
            </div>
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Country Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
            Country
          </label>
          <button
            type="button"
            onClick={() => {
              if (!selectedGC) {
                showToast("Please select a category first", "warning");
                return;
              }
              setShowSubModal(true);
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
          >
            {selectedSub ? (
              <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark">{selectedSub.country || selectedSub.name}</span>
            ) : (
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Select Country</span>
            )}
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Card Type Selector */}
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
            Card Type
          </label>
          <button
            type="button"
            onClick={() => {
              if (!selectedSub) {
                showToast("Please select a country first", "warning");
                return;
              }
              setShowTypeModal(true);
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-[#FCFCFC] dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[20px] cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
          >
            <div className="flex items-center gap-3">
              {selectedCardType?.type_image ? (
                <img
                  src={selectedCardType.type_image}
                  alt={selectedCardType.type}
                  className="w-8 h-8 object-contain rounded-full bg-white dark:bg-dark-800 p-0.5 border border-border-light/50 dark:border-border-dark/50"
                />
              ) : null}
              <span className="font-primary-semibold text-text-primary-light dark:text-text-primary-dark">
                {selectedCardType ? selectedCardType.type : "Select card type"}
              </span>
            </div>
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Speed Toggle */}
        {selectedSub && (selectedSub.slow_enabled === 1 || selectedSub.fast_enabled === 1) && (
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
              Speed
            </label>
            <div className="flex items-center justify-between bg-light-50 dark:bg-dark-900 rounded-[20px] p-1.5 border border-border-light dark:border-border-dark w-full">
              {["slow", "fast"].map((item) => {
                const isSlowEnabled = selectedSub.slow_enabled === 1;
                const isFastEnabled = selectedSub.fast_enabled === 1;
                const isDisabled = (item === "slow" && !isSlowEnabled) || (item === "fast" && !isFastEnabled);
                const isActive = speed === item;

                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSpeed(item)}
                    className={`flex-1 items-center justify-center rounded-[16px] py-3 transition-all capitalize cursor-pointer text-b3 font-primary-medium disabled:opacity-30 disabled:pointer-events-none ${isActive
                      ? "bg-white dark:bg-dark-700 text-primary-500 shadow-sm"
                      : "bg-transparent text-text-secondary-light dark:text-text-secondary-dark"
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Code Optional Input */}
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
            Referral Code / Gift Card Code (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter gift card code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="w-full bg-[#FCFCFC] dark:bg-dark-950/20 border border-border-light dark:border-border-dark px-4 py-3 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none"
          />
        </div>

        {/* Quantity & Amount Selector */}
        <div className="flex flex-col gap-4 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-3xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Card Amount / Value ($)
            </label>
            <input
              type="text"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                setFetchedRateResponse(null);
                setRate(null);
              }}
              className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark focus:outline-none"
            />
            {fetchedRateResponse?.rate && (
              <span className="text-[11px] font-primary-bold text-primary-500 mt-1 ml-1">
                Rate: ₦{fetchedRateResponse.rate} / $
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuantity(Math.max(1, quantity - 1));
                  setFetchedRateResponse(null);
                }}
                className="w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                -
              </button>
              <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark w-6 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuantity(quantity + 1);
                  setFetchedRateResponse(null);
                }}
                className="w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Fetch Rate Button */}
          <button
            type="button"
            onClick={handleFetchRate}
            disabled={loadingRate}
            className="mt-2 py-2.5 rounded-xl items-center border border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-500 text-b3 font-primary-bold hover:bg-primary-100/50 dark:hover:bg-primary-900/35 transition-all cursor-pointer flex justify-center gap-2"
          >
            {loadingRate && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
            See Rate
          </button>
        </div>

        {/* You'll receive in total */}
        {fetchedRateResponse?.rate && amount && Number(amount) > 0 && (
          <div className="bg-[#FFFCE8] dark:bg-[#1A1909] border border-[#FFECA8] dark:border-[#2C2910] p-4 rounded-2xl flex justify-between items-center text-left">
            <div>
              <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                You will receive in total:
              </p>
              <p className="text-h4 font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-1">
                ₦{calculateTotal.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Upload Card Image */}
        <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-5 rounded-3xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Upload image
            </label>
          </div>

          <div className="flex items-center gap-3 w-full min-w-0">
            {/* Upload Button: Fixed on the left, does NOT scroll */}
            <div className="relative w-28 h-28 flex flex-col items-center justify-center bg-[#F5F5F5] dark:bg-[#232323] border border-dashed border-gray-300 dark:border-gray-700 rounded-[20px] shrink-0 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <Upload className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
            </div>

            {/* Selected Images List: Scrolls horizontally to the right */}
            <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1.5 min-w-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary-500/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {selectedFiles.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPreviewImageSrc(item.preview);
                    setShowImagePreview(true);
                  }}
                  className="relative w-28 h-28 rounded-[20px] overflow-hidden bg-light-100 dark:bg-dark-800 shrink-0 border border-border-light dark:border-border-dark cursor-pointer group"
                >
                  <img
                    src={item.preview}
                    alt={`Upload Preview ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1.5 right-1.5 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center border border-white dark:border-dark-900 text-white hover:scale-105 transition-all cursor-pointer z-20"
                  >
                    <span className="text-[12px] font-bold">✕</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Note / Comment */}
        <div className="flex flex-col gap-2">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Trade Note / Comment (Optional)
          </label>
          <textarea
            placeholder="Tell us anything about the gift cards"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark px-4 py-3 rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none resize-none h-24"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedGC || !selectedSub || (!(selectedGC?.name === "Create Your Giftcard Order") && !selectedCardType) || !amount || selectedFiles.length === 0}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>

      {/* Brand Selector Modal (Select Gift Card) */}
      <CenterModal visible={showBrandModal} onClose={() => { setShowBrandModal(false); setBrandSearch(""); }} title="Select Gift Card">
        <div className="flex flex-col gap-4 max-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search gift cards..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* List of Gift Cards */}
          <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loadingGC ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : filteredGC.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredGC.map((gc, index) => {
                  const isSelected = !!selectedGC && (
                    (selectedGC.id && gc.id && selectedGC.id === gc.id) ||
                    (selectedGC.name && gc.name && selectedGC.name === gc.name) ||
                    (selectedGC.title && gc.title && selectedGC.title === gc.title)
                  );
                  return (
                    <button
                      key={`${gc.id || gc.title || gc.name || 'gc'}-${index}`}
                      type="button"
                      onClick={() => handleSelectGC(gc)}
                      className={`flex items-center justify-between p-4 rounded-[20px] border text-left transition-all w-full cursor-pointer ${isSelected
                        ? "border-primary-500 bg-primary-500"
                        : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#0C0C0C] hover:bg-light-100 dark:hover:bg-dark-700/50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {gc.image || gc.logoUrls?.[0] ? (
                          <img
                            src={gc.image || gc.logoUrls[0]}
                            alt={gc.name || gc.title}
                            className="w-9 h-9 object-contain rounded-full bg-white dark:bg-dark-800 border border-border-light/50 dark:border-border-dark/50"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-xs text-text-primary-light dark:text-text-primary-dark">
                            {getFirstChar(gc.name || gc.title)}
                          </div>
                        )}
                        <span className={`text-b2 font-primary-medium ${isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                          {gc.name || gc.title}
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
            ) : (
              <div className="text-center py-20 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark select-none">
                No gift cards found
              </div>
            )}
          </div>
        </div>
      </CenterModal>

      {/* Country Selector Modal */}
      <CenterModal visible={showSubModal} onClose={() => { setShowSubModal(false); setSubSearch(""); }} title="Select Country">
        <div className="flex flex-col gap-4 max-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search country..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Subcategories (Countries) List */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1">
            {filteredSubs.length > 0 ? (
              filteredSubs.map((sub, index) => {
                const isSelected = !!selectedSub && (
                  (selectedSub.id && sub.id && selectedSub.id === sub.id) ||
                  (selectedSub.country && sub.country && selectedSub.country === sub.country) ||
                  (selectedSub.name && sub.name && selectedSub.name === sub.name)
                );
                return (
                  <button
                    key={`${sub.id}-${index}`}
                    type="button"
                    onClick={() => handleSelectSub(sub)}
                    className={`flex items-center justify-between p-4 rounded-[20px] border text-left transition-all w-full cursor-pointer ${isSelected
                      ? "border-primary-500 bg-primary-500"
                      : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#0C0C0C] hover:bg-light-100 dark:hover:bg-dark-700/50"
                      }`}
                  >
                    <span className={`text-b2 font-primary-medium ${isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                      {sub.country || sub.name}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <span className="text-[10px] text-primary-500 font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                No countries found
              </div>
            )}
          </div>
        </div>
      </CenterModal>

      {/* Card Type Selector Modal */}
      <CenterModal visible={showTypeModal} onClose={() => { setShowTypeModal(false); setTypeSearch(""); }} title="Select Card Type">
        <div className="flex flex-col gap-4 max-h-[500px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              placeholder="Search type..."
              value={typeSearch}
              onChange={(e) => setTypeSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Types List */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1">
            {filteredTypes.length > 0 ? (
              filteredTypes.map((typeItem: any, index: number) => {
                const isSelected = !!selectedCardType && (
                  (selectedCardType.id && typeItem.id && selectedCardType.id === typeItem.id) ||
                  (selectedCardType.type_id && typeItem.type_id && selectedCardType.type_id === typeItem.type_id) ||
                  (selectedCardType.type && typeItem.type && selectedCardType.type === typeItem.type)
                );
                return (
                  <button
                    key={`${typeItem.id}-${index}`}
                    type="button"
                    onClick={() => handleSelectType(typeItem)}
                    className={`flex items-center justify-between p-4 rounded-[20px] border text-left transition-all w-full cursor-pointer ${isSelected
                      ? "border-primary-500 bg-primary-500"
                      : "border-border-light dark:border-border-dark bg-light-50 dark:bg-[#0C0C0C] hover:bg-light-100 dark:hover:bg-dark-700/50"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {typeItem.type_image ? (
                        <img
                          src={typeItem.type_image}
                          alt={typeItem.type}
                          className="w-14 h-10 object-cover rounded-lg bg-white dark:bg-dark-800 border border-border-light/50 dark:border-border-dark/50"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-xs text-text-primary-light dark:text-text-primary-dark select-none">
                          {getFirstChar(typeItem.type)}
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-b2 font-primary-medium ${isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                          {typeItem.type}
                        </span>
                        {typeItem.type_description && (
                          <span className={`text-[11px] font-primary-regular leading-snug ${isSelected ? 'text-white/80' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                            {typeItem.type_description}
                          </span>
                        )}
                        {typeItem.code && (
                          <span className={`text-[10px] font-primary-medium ${isSelected ? 'text-white/70' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                            {typeItem.code}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <span className="text-[10px] text-primary-500 font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                No card types found
              </div>
            )}
          </div>
        </div>
      </CenterModal>

      {/* Confirmation Modal */}
      {selectedGC && selectedSub && selectedCardType && (
        <ConfirmationModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Trade"
          items={[
            { label: "Card Brand", value: selectedGC.name || selectedGC.title },
            { label: "Country", value: selectedSub.country || selectedSub.name },
            { label: "Card Type", value: selectedCardType.type },
            { label: "Value ($)", value: `$${amount}` },
            { label: "Quantity", value: quantity.toString() },
            { label: "Total Recieve", value: `₦${calculateTotal.toLocaleString()}` },
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

      {/* Processing Loader */}
      <ProcessingLoader visible={trading} message="Submitting your trade request..." />

      {/* Success Modal */}
      {selectedGC && (
        <SellGiftCardSuccessModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          onReturnToDashboard={() => {
            setShowSuccess(false);
            closeDrawer();
            router.push("/dashboard");
          }}
          onViewTradeChat={() => {
            setShowSuccess(false);
            closeDrawer();
            const cardName = selectedGC?.name || selectedGC?.title || "Gift Card";
            router.push(
              `/dashboard/messages?tradeId=${transactionId}&cardName=${encodeURIComponent(cardName)}&cardCategory=${encodeURIComponent(cardName)}&amount=${amount}&settlementAmount=${calculateTotal}`
            );
          }}
          data={{
            cardName: selectedGC?.name || selectedGC?.title || "Gift Card",
            cardImage: selectedGC?.image || selectedGC?.logoUrls?.[0] || "",
            country: selectedSub?.country || selectedSub?.name || "",
            amount: amount,
            rate: rate || fetchedRateResponse?.rate || 0,
            settlementAmount: calculateTotal,
            quantity: quantity,
            type: selectedCardType?.type || (selectedGC?.name === "Create Your Giftcard Order" ? "Manual" : "Standard"),
          }}
        />
      )}

      {/* Full-screen Image Previewer Modal */}
      {showImagePreview && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center cursor-zoom-out p-6 backdrop-blur-sm transition-all"
        >
          <button
            type="button"
            onClick={() => setShowImagePreview(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
          >
            <span className="text-xl font-bold">✕</span>
          </button>
          <img
            src={previewImageSrc}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
