"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useGetUserRewardHistoryMutation } from "@/redux/settings/settings";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { AppIcon } from "@/components/ui/AppIcon";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatamount";

const formatRewardDate = (dateString: string) => {
  try {
    const d = new Date(dateString.replace(" ", "T"));
    const datePart = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${datePart} - ${timePart}`;
  } catch (e) {
    return dateString;
  }
};

export default function ReferralsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const authUser = useAppSelector((state: any) => state.auth.user);
  const userInfo = authUser?.user || authUser || {};

  const referralCode = userInfo?.ref_code || "";
  const refBalance = userInfo?.ref_bal || 0;

  const [getHistory, { isLoading }] = useGetUserRewardHistoryMutation();
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(
    async (pageNum: number, isLoadMore = false) => {
      try {
        if (isLoadMore) setLoadingMore(true);
        const res: any = await getHistory({
          token: "",
          page: pageNum,
          limit: 20,
        }).unwrap();

        const newHistory = res?.data?.history || [];
        const pagination = res?.data?.pagination;

        setHistory((prev) => (isLoadMore ? [...prev, ...newHistory] : newHistory));
        setHasMore(!!pagination?.has_more_pages);
        setPage(pagination?.current_page || pageNum);
      } catch (err: any) {
        showToast(err?.data?.message || "Failed to load reward history", "error");
      } finally {
        setLoadingMore(false);
      }
    },
    [getHistory, showToast]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      showToast("Referral code copied to clipboard!", "success");
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || isLoading) return;
    fetchHistory(page + 1, true);
  };

  const steps = [
    {
      icon: <AppIcon name="share" size={24} />,
      title: "Share links",
      description: "Share your link to friends and family",
    },
    {
      icon: <AppIcon name="friends" size={24} />,
      title: "Friends sign up",
      description: "Once your friend signs up using your link, they become part of your referral network",
    },
    {
      icon: <AppIcon name="reward" size={24} />,
      title: "Earn rewards",
      description: "After your friends completes their first transaction, you both earn exclusive NGN500.00",
    },
    {
      icon: <AppIcon name="redeem" size={24} />,
      title: "Redeem points",
      description: "Redeem your earned rewards to your account wallet",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-75 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Refer Friends
        </h3>
      </div>

      {/* Earning Balance Top Card Banner */}
      <div className="relative overflow-hidden rounded-[24px] p-6 text-white bg-linear-to-r from-primary-500 to-primary-800 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/80 font-primary-medium text-b3">Earning Balance</span>
            <span className="text-h4 font-primary-bold">{formatCurrency(refBalance)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/withdrawal")}
            className="bg-white text-primary-500 hover:bg-white/90 px-4 py-2 rounded-full text-b3 font-primary-semibold transition-colors"
          >
            Withdraw
          </button>
        </div>

        <div className="flex justify-between items-end pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/60 font-primary-medium text-[11px]">Your invitation Code</span>
            <span className="text-b1 font-primary-bold tracking-wider">{referralCode || "-------"}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-white/20 hover:bg-white/30 text-white flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-b3 font-primary-semibold border border-white/10"
          >
            <span>Copy</span>
            <Copy className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* How it works Container Card */}
      <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-6 rounded-[30px] flex flex-col gap-5 relative overflow-hidden">
        {/* Top green gradient border accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary-400 to-primary-300" />
        
        <div>
          <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            How it works
          </h4>
          <p className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Share the goodness with your friends. You both get <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">NGN500.00</span> when they use your referral code.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-light-50 dark:bg-dark-900 border border-border-light dark:border-[#232323] flex items-center justify-center shrink-0">
                {step.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <h5 className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark leading-tight">
                  {step.title}
                </h5>
                <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward History */}
      <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-6 rounded-[30px] flex flex-col gap-4">
        <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark px-1">
          Rewards history
        </h4>

        {isLoading && history.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-light-50 dark:bg-dark-900 border border-border-light dark:border-[#232323] text-text-secondary-light dark:text-text-secondary-dark">
              <AppIcon name="no-trans" size={32} />
            </div>
            <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-2">
              No rewards yet
            </p>
            <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark max-w-xs">
              Start sharing your referral code to earn cash bonuses!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
              {history.map((item: any, idx: number) => (
                <div key={idx} className="py-4 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-light-50 dark:bg-dark-900 flex items-center justify-center shrink-0">
                    <AppIcon name="reward" size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                      {item?.referred_username || item?.username || "Referred Friend"}
                    </span>
                    <span className="text-[10px] font-primary-regular text-text-tertiary-light dark:text-text-tertiary-dark">
                      {item?.created_at ? formatRewardDate(item.created_at) : ""}
                    </span>
                  </div>
                  <span className="text-b2 font-primary-bold text-success-600 dark:text-success-400">
                    +₦500.00
                  </span>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-2">
                <Button onClick={handleLoadMore} variant="secondary" className="text-b3" loading={loadingMore}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
