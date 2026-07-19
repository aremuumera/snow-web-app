"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useGetAllTransactionMutation } from "@/redux/transaction/transaction_history";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { AppIcon } from "@/components/ui/AppIcon";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { FundModal } from "@/components/modals/FundModal";
import { MoreServicesModal } from "@/components/modals/MoreServicesModal";
import { PickServiceModal } from "@/components/modals/PickServiceModal";
import { paths } from "@/utils/paths";
import { formatCurrency } from "@/utils/formatamount";
import { Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDrawer } from "@/context/DrawerContext";
import { app_config } from "@/utils/config";

export default function DashboardHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawerParam = searchParams.get("drawer");
  const { theme, isDark } = useTheme();
  const themeColors = colorThemes[theme];
  const { showToast } = useToast();
  const { openDrawer, activeDrawer } = useDrawer();

  const user = useAppSelector((state: any) => state.auth.user);
  const [getAllTransactions, { isLoading }] = useGetAllTransactionMutation();
  const [transactions, setTransactions] = useState<any[]>([]);

  const [hideBalance, setHideBalance] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [pickType, setPickType] = useState<"giftcard" | "crypto" | null>(null);

  const walletBalance = user?.user?.bal || user?.balance || 0;
  const username = user?.user?.username || user?.username || `${app_config.name} User`;
  const flyers = user?.flyers || [];

  // Filter flyers matching mobile index.tsx logic
  const withText = flyers?.filter((r: any) => r?.is_flyer === 0) || [];
  const withoutText = flyers?.filter((r: any) => r?.is_flyer === 1) || [];

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const allBanners = withoutText.length > 0 ? withoutText : withText;

  useEffect(() => {
    if (allBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allBanners]);

  useEffect(() => {
    if (drawerParam && activeDrawer !== drawerParam) {
      const paramsData: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        if (key !== "drawer") {
          paramsData[key] = val;
        }
      });
      console.log("[DEBUG] Dashboard page opening drawer. type:", drawerParam, "data:", paramsData);
      openDrawer(drawerParam as any, paramsData);
      // Clean up the URL query params via Next.js router to avoid drawer reopen loops
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [drawerParam, activeDrawer, searchParams, openDrawer, router]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await getAllTransactions({ data: { limit: 5, page: 1 } }).unwrap();
        if (res?.data?.transactions) {
          setTransactions(res.data.transactions);
        } else if (res?.transactions) {
          setTransactions(res.transactions);
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }
    };
    fetchTransactions();
  }, [getAllTransactions]);

  const quickServices = [
    {
      title: "Gift Card",
      iconName: "giftcard",
      route: paths.giftcards.sell,
      description: "Buy & sell gift cards",
    },
    {
      title: "Crypto",
      iconName: "crypto",
      route: paths.crypto.sell,
      description: "Trade crypto assets",
    },
    {
      title: "Airtime",
      iconName: "airtime",
      route: paths.bills.airtime,
      description: "Top up airtime instantly",
    },
    {
      title: "More",
      iconName: "bill",
      route: paths.dashboard.more,
      description: "Cable, power, betting",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h5 font-primary-bold  text-text-primary-light dark:text-text-primary-dark">
            Hello, {username}!
          </h2>
          <p className="text-b4 font-primary-regular pt-2 text-text-secondary-light dark:text-text-secondary-dark">
            What would you like to do today?
          </p>
        </div>
      </div>

      {/* Top Split Layout: Balance Card and Slideshow Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Wallet Balance Card */}
        <div
          className="relative overflow-hidden rounded-[24px] p-6 text-white flex flex-col justify-between min-h-[220px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${isDark ? "/images/background-brep-dark.png" : "/images/background-brep-light.png"})`,
          }}
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 opacity-90 text-b2 font-primary-medium">
              <span>Wallet Balance</span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-white hover:opacity-85 focus:outline-none cursor-pointer"
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <h2 className="text-h2 font-primary-bold tracking-tight pt-2">
              {hideBalance ? "**********" : formatCurrency(walletBalance)}
            </h2>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowFundModal(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 transition-all py-3 rounded-full flex items-center justify-center gap-2 text-b2 font-primary-semibold select-none cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <Link
              href={paths.dashboard.withdrawal}
              className="flex-1 bg-white hover:bg-zinc-100 transition-all py-3 rounded-full flex items-center justify-center gap-2 text-b2 font-primary-semibold text-primary-600 select-none cursor-pointer block text-center"
              style={{ color: themeColors[600] }}
            >
              <div className="flex items-center justify-center gap-2 h-full w-full">
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Promotional Image Slider / Banner */}
        <div className="relative rounded-[24px] overflow-hidden min-h-[220px] flex flex-col justify-between">
          {allBanners.length > 0 ? (
            <div className="relative w-full h-full flex flex-col justify-between flex-1">
              <div className="w-full h-full relative overflow-hidden flex-1 rounded-[24px]">
                {allBanners.map((banner: any, index: number) => {
                  const isCurrent = index === currentSlide;
                  return (
                    <div
                      key={banner?.id || index}
                      className={`absolute inset-0 transition-opacity duration-500 flex items-center ${isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                    >
                      {banner.image ? (
                        <img
                          src={banner.image}
                          alt={banner.text || "Promo Banner"}
                          className="w-full h-full object-cover rounded-[24px]"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-[24px] p-6 text-white flex flex-col justify-center gap-2"
                          style={{
                            background: `linear-gradient(135deg, ${themeColors[400]} 0%, ${themeColors[600]} 100%)`,
                          }}
                        >
                          <h4 className="text-b1 font-primary-bold">{banner.text}</h4>
                          <p className="text-b3 opacity-80">{banner.extra_text}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dot Indicators - Overlaid on bottom */}
              {allBanners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-25 bg-black/20 px-2 py-1.5 rounded-full backdrop-blur-xs">
                  {allBanners.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide
                        ? "w-5 bg-white"
                        : "w-1.5 bg-white/40"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Premium Fallback Slide matching Breppo aesthetics
            <div
              className="w-full h-full rounded-[20px] p-6 text-white flex flex-col justify-between min-h-[170px]"
              style={{
                background: `linear-gradient(135deg, ${themeColors[400]} 0%, ${themeColors[600]} 100%)`,
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider opacity-85 font-primary-bold">Welcome Promo</span>
                <h3 className="text-b1 font-primary-bold">Trade Instantly with Best Rates</h3>
                <p className="text-b3 opacity-80 leading-relaxed max-w-sm mt-1">
                  Enjoy zero funding fees and lightning fast settlements on all giftcard & crypto transactions.
                </p>
              </div>
              <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full w-max font-primary-semibold self-start">
                Active Support 24/7
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Services */}
      <div className="flex flex-col gap-4">
        <h3 className="text-h7 font-primary-sbold text-text-primary-light dark:text-text-primary-dark">
          Quick Services
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-[#111111] border border-border-light dark:border-[#232323] p-4 rounded-[30px]">
          {quickServices.map((service) => {
            const isMore = service.title === "More";
            const content = (
              <div
                className="flex items-center gap-3.5 px-4 h-[56px] bg-[#F8F8F8] dark:bg-[#0C0C0C] rounded-full hover:opacity-90 transition-opacity select-none cursor-pointer w-full"
              >
                <div className="shrink-0 flex items-center justify-center">
                  <AppIcon name={service.iconName} size={38} color="var(--color-primary-500)" />
                </div>
                <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate">
                  {service.title}
                </span>
              </div>
            );

            if (isMore) {
              return (
                <div key={service.title} onClick={() => setShowMoreModal(true)} className="w-full">
                  {content}
                </div>
              );
            }

            const getDrawerType = (title: string): any => {
              if (title === "Airtime") return "airtime";
              return null;
            };

            return (
              <button
                key={service.title}
                type="button"
                onClick={() => {
                  const drawerType = getDrawerType(service.title);
                  if (service.title === "Gift Card") {
                    setPickType("giftcard");
                  } else if (service.title === "Crypto") {
                    setPickType("crypto");
                  } else if (drawerType) {
                    openDrawer(drawerType);
                  }
                }}
                className="w-full block text-left"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-h7 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Recent Transactions
          </h3>
          <Link
            href={paths.dashboard.transactionHistory}
            className="text-b2 font-primary-semibold text-primary-500 hover:text-primary-600 flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dashboard table wrapper */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-x-auto shadow-xs scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isLoading ? (
            <Skeleton variant="table" count={6} cols={8} />
          ) : transactions.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-[11px] font-primary-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark bg-light-50/50 dark:bg-dark-900/30">
                  <th className="py-4 px-6">Reference</th>
                  <th className="py-4 px-6">Service Type</th>
                  <th className="py-4 px-6">Description / Notes</th>
                  <th className="py-4 px-6">Old Balance</th>
                  <th className="py-4 px-6">New Balance</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {transactions.slice(0, 6).map((tx: any) => {
                  const isDeposit =
                    tx.role === "credit" ||
                    tx.role === "deposit" ||
                    tx.role === "giftcard" ||
                    tx.role === "crypto" ||
                    tx.type === "credit" ||
                    tx.type === "deposit" ||
                    Number(tx.newbal || 0) > Number(tx.oldbal || 0);
                  const status = tx.status || "completed";

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => router.push(`${paths.dashboard.transactionDetail}/${tx.transid || tx.id}?type=${tx.role || tx.type || "debit"}`)}
                      className="hover:bg-light-75 dark:hover:bg-dark-800/40 transition-colors cursor-pointer text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark"
                    >
                      {/* Ref */}
                      <td className="py-4 px-6 font-primary-semibold select-all text-text-primary-light dark:text-text-primary-dark">
                        {tx.transid || tx.reference || tx.id || "N/A"}
                      </td>

                      {/* Service Type with Icon */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className=" flex items-center justify-center shrink-0 overflow-hidden">
                            <ServiceIcon
                              role={tx.role}
                              name={tx.role}
                              image={tx.logo_url}
                              size={30}
                            />
                          </div>
                          <span className="capitalize">{tx.role || tx.type || "Wallet"}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6 text-text-secondary-light dark:text-text-secondary-dark truncate max-w-xs">
                        {tx.message || tx.title || tx.description || "N/A"}
                      </td>

                      {/* Old Balance */}
                      <td className="py-4 px-6 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
                        {formatCurrency(tx.oldbal || 0)}
                      </td>

                      {/* New Balance */}
                      <td className="py-4 px-6 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
                        {formatCurrency(tx.newbal || 0)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-text-secondary-light dark:text-text-secondary-dark">
                        {new Date(tx.created_at || tx.date || tx.timestamp || Date.now()).toLocaleString()}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-4 px-6 font-primary-bold ${isDeposit ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
                          }`}
                      >
                        {isDeposit ? "+" : "-"}
                        {formatCurrency(tx.amount || 0)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-primary-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${status.toLowerCase() === "completed" || status.toLowerCase() === "success"
                            ? "bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400"
                            : status.toLowerCase() === "pending"
                              ? "bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400"
                              : "bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400"
                            }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <AppIcon name="no-trans" size={48} />
              <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                No recent transactions found.
              </p>
            </div>
          )}
        </div>
      </div>
      <FundModal visible={showFundModal} onClose={() => setShowFundModal(false)} />
      <MoreServicesModal visible={showMoreModal} onClose={() => setShowMoreModal(false)} onOpenFundModal={() => setShowFundModal(true)} />
      <PickServiceModal visible={pickType !== null} onClose={() => setPickType(null)} type={pickType} />
    </div>
  );
}
