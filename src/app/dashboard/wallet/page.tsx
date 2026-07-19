"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { AppIcon } from "@/components/ui/AppIcon";
import { paths } from "@/utils/paths";
import { formatCurrency } from "@/utils/formatamount";
import { useToast } from "@/context/ToastProvider";
import { useDrawer } from "@/context/DrawerContext";
import { useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { useFindGiftCardMutation } from "@/redux/giftcards/giftcards_api";
import { FundModal } from "@/components/modals/FundModal";
import { Eye, EyeOff, Loader2, Landmark, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { openDrawer } = useDrawer();
  const { theme, isDark } = useTheme();
  const themeColors = colorThemes[theme];

  const user = useAppSelector((state: any) => state.auth.user);
  const walletBalance = user?.user?.bal || user?.balance || 0;

  // Toggle state matching RN `isToggle` balance visibility
  const [isToggle, setIsToggle] = useState(true);
  const [activeTab, setActiveTab] = useState<"crypto" | "giftcard">("crypto");
  const [showFundModal, setShowFundModal] = useState(false);

  // API hooks
  const { data: cryptoData, isLoading: isCryptoLoading, refetch: refetchCrypto } = useGetCrptoNetworkQuery({});
  const [findGiftCard, { isLoading: isGiftLoading }] = useFindGiftCardMutation();

  const [giftCards, setGiftCards] = useState<any[]>([]);

  // Fetch gift card categories
  useEffect(() => {
    if (activeTab === "giftcard") {
      const fetchGC = async () => {
        try {
          const res = await findGiftCard({ data: {} }).unwrap();
          const categories = res?.categories || res?.data?.categories || [];
          setGiftCards(categories);
        } catch (err) {
          console.error("Failed to load gift cards", err);
        }
      };
      fetchGC();
    }
  }, [activeTab, findGiftCard]);

  // Transform crypto data matching mobile entry
  const transformedCryptoData = useMemo(() => {
    if (!cryptoData?.all_addresses?.data) return [];
    return Object.entries(cryptoData.all_addresses.data).map(([symbol, details]: [string, any]) => ({
      symbol,
      currencyName: details.currencyName || symbol,
      image: details.image,
      address: details.address,
      networks: details.networks,
    }));
  }, [cryptoData]);

  const handleToggle = () => setIsToggle(!isToggle);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Header balance card with background image matching the mobile wallet page */}
      <div
        className="rounded-[30px] p-6 text-white flex flex-col justify-between h-[160px] relative overflow-hidden shadow-sm bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${isDark ? "/images/walletbg-brep-dark.png" : "/images/walletbg-brep.png"})`,
        }}
      >
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-b3 font-primary-medium text-white/80">Account Balance</span>
            <h2 className="text-h3 font-primary-bold tracking-tight mt-1">
              {isToggle ? `₦${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "**********"}
            </h2>
          </div>

          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 bg-black/40 hover:bg-black/50 text-white rounded-full px-3 py-1.5 text-[11px] font-primary-bold transition-colors cursor-pointer"
          >
            <span>{isToggle ? "Hide" : "Show"}</span>
            {isToggle ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Actions row matching mobile card wrap */}
      <div className="bg-white dark:bg-[#111111] border border-[#EFEFEF] dark:border-[#232323] px-3 py-3 rounded-[30px] flex items-center gap-2">
        {/* Withdraw cash */}
        <button
          onClick={() => router.push(paths.dashboard.withdrawal)}
          className="flex h-[52px] flex-1 items-center justify-between rounded-[60px] bg-[#F8F8F8] dark:bg-[#0C0C0C] px-4 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Withdraw
          </span>
          <div className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white dark:bg-[#1A1A1A] text-primary-500 shadow-xs">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </button>

        {/* Deposit cash */}
        <button
          onClick={() => setShowFundModal(true)}
          className="flex h-[52px] flex-1 items-center justify-between rounded-[60px] bg-[#F8F8F8] dark:bg-[#0C0C0C] px-4 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Deposit
          </span>
          <div className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white dark:bg-[#1A1A1A] text-primary-500 shadow-xs">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </button>

        {/* Transaction History icon link */}
        <button
          onClick={() => router.push(paths.dashboard.transactionHistory)}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F8F8F8] dark:bg-[#0C0C0C] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <AppIcon name="history" size={20} color="var(--color-primary-500)" />
        </button>
      </div>

      {/* Main Content card containing tabs */}
      <div className="bg-white dark:bg-[#111111] border border-border-light dark:border-border-dark rounded-[24px] p-4 flex flex-col gap-4">
        {/* Tab switcher background matching RN container */}
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

        {/* Tab Content lists matching RN vertical rows layout */}
        <div className="pt-1 flex flex-col gap-3">
          {activeTab === "crypto" ? (
            isCryptoLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-2xl bg-light-75 dark:bg-dark-700 px-4 py-4 border border-border-light dark:border-border-dark/20 animate-pulse">
                    <div className="w-10 h-10 bg-light-200 dark:bg-dark-300 rounded-full" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-1/3" />
                      <div className="h-3 bg-light-200 dark:bg-dark-300 rounded w-1/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transformedCryptoData.length > 0 ? (
              <div className="flex flex-col gap-3">
                {transformedCryptoData.map((coin: any) => (
                  <div
                    key={coin.symbol}
                    onClick={() => openDrawer("sell-crypto", { symbol: coin.symbol })}
                    className="flex items-center gap-4 rounded-2xl bg-light-75 dark:bg-dark-700 px-4 py-4 hover:opacity-90 transition-opacity cursor-pointer justify-between border border-border-light dark:border-border-dark/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-dark-800 overflow-hidden shrink-0">
                        {coin.image ? (
                          <img
                            src={coin.image}
                            alt=""
                            className="w-8 h-8 object-contain rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-primary-bold uppercase">
                            {coin.symbol.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                          {coin.currencyName}
                        </h4>
                        <p className="text-[11px] font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase mt-0.5">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary-light" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <AppIcon name="no-trans" size={40} />
                <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  No Cryptocurrencies found
                </p>
              </div>
            )
          ) : isGiftLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl bg-light-75 dark:bg-dark-700 px-4 py-4 border border-border-light dark:border-border-dark/20 animate-pulse">
                  <div className="w-10 h-10 bg-light-200 dark:bg-dark-300 rounded-full" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : giftCards.length > 0 ? (
            <div className="flex flex-col gap-3">
              {giftCards.map((gc: any) => (
                <div
                  key={gc.id}
                  onClick={() => openDrawer("sell-giftcard", { cardName: gc.name, cardId: gc.id })}
                  className="flex items-center gap-4 rounded-2xl bg-light-75 dark:bg-dark-700 px-4 py-4 hover:opacity-90 transition-opacity cursor-pointer justify-between border border-border-light dark:border-border-dark/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-dark-800 overflow-hidden shrink-0">
                      {gc.image ? (
                        <img
                          src={gc.image}
                          alt=""
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-primary-bold uppercase">
                          {gc.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h4 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                      {gc.name}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary-light" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <AppIcon name="no-trans" size={40} />
              <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                No Gift Cards found
              </p>
            </div>
          )}
        </div>
      </div>
      <FundModal visible={showFundModal} onClose={() => setShowFundModal(false)} />
    </div>
  );
}
