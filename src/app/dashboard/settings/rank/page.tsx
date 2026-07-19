"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetAppRankMutation } from "@/redux/settings/settings";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trophy, Medal, Loader2, Award } from "lucide-react";
import { useToast } from "@/context/ToastProvider";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/context/ThemeProvider";

type RankTab = "giftcard" | "crypto";

export default function AppRankPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [getRank, { isLoading }] = useGetAppRankMutation();
  const authUser = useAppSelector((state: any) => state.auth.user);
  const userInfo = authUser?.user || authUser || {};

  const [activeTab, setActiveTab] = useState<RankTab>("giftcard");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [rankData, setRankData] = useState<any>(null);

  const fetchRank = useCallback(async () => {
    try {
      const response = await getRank({
        data: {
          month: selectedMonth.toString(),
          year: selectedYear.toString(),
        },
      }).unwrap();

      if (response?.status === "success" || response?.data) {
        setRankData(response.data || response);
      }
    } catch (err: any) {
      console.error("Failed to load user rank", err);
    }
  }, [getRank, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  // Active tab data
  const leaderboard: any[] = rankData?.[activeTab]?.leaderboard || [];
  const userRankInfo = rankData?.[activeTab]?.user_rank;

  // Podium Positions (Positions 1, 2, 3)
  const firstPlace = leaderboard.find((item) => item?.position === 1);
  const secondPlace = leaderboard.find((item) => item?.position === 2);
  const thirdPlace = leaderboard.find((item) => item?.position === 3);

  // Remaining leaderboard
  const remainingLeaderboard = leaderboard.filter((item) => item?.position > 3);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatUsername = (username?: string) => {
    if (!username) return "";
    return username.length > 10 ? username.slice(0, 10) + "..." : username;
  };

  const getAvatarPath = (index: number) => {
    const list = [
      "/images/african-man-avatar.png",
      "/images/man-avatar.png",
      "/images/bussiness-man-avatar.png",
      "/images/black-avatar.png",
      "/images/gamer-avatar.png",
      "/images/profile.png",
      "/images/lady-avatar.png",
      "/images/avatar-girl.png",
      "/images/black-girl-avatar.png",
      "/images/woman-avatar.png",
      "/images/arab-woman-avatar.png",
    ];
    return list[index % list.length];
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-32 relative">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-light-75 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Leaderboard Standing
          </h3>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex gap-2 items-center w-full sm:w-auto justify-start sm:justify-end">
          <Select
            placeholder="Month"
            options={months.map((name, index) => ({
              value: (index + 1).toString(),
              label: name,
            }))}
            value={selectedMonth.toString()}
            onChange={(val) => setSelectedMonth(Number(val))}
          />

          <Select
            placeholder="Year"
            options={years.map((y) => ({
              value: y.toString(),
              label: y.toString(),
            }))}
            value={selectedYear.toString()}
            onChange={(val) => setSelectedYear(Number(val))}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-light-100 dark:bg-dark-800 rounded-[20px] p-1.5 border border-border-light dark:border-[#232323]">
        <button
          onClick={() => setActiveTab("giftcard")}
          className={`flex-1 py-3 rounded-2xl text-b2 font-primary-bold transition-all ${activeTab === "giftcard"
            ? "bg-white dark:bg-dark-900 text-primary-500 dark:text-primary-400 shadow-sm"
            : "text-text-secondary-light dark:text-text-secondary-dark hover:opacity-85"
            }`}
        >
          Gift Cards
        </button>
        <button
          onClick={() => setActiveTab("crypto")}
          className={`flex-1 py-3 rounded-2xl text-b2 font-primary-bold transition-all ${activeTab === "crypto"
            ? "bg-white dark:bg-dark-900 text-primary-500 dark:text-primary-400 shadow-sm"
            : "text-text-secondary-light dark:text-text-secondary-dark hover:opacity-85"
            }`}
        >
          Crypto
        </button>
      </div>

      {
        // isLoading ? (
        //   <div className="flex items-center justify-center py-24">
        //     <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        //   </div>
        // ) :
        (
          <div className="flex flex-col gap-6">

            {/* Custom Styled Podium component matching mobile stairs vector layout */}
            <div className="relative w-full aspect-[341/303]  bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[30px] overflow-hidden">

              {/* Background SVG vector copied from mobile assets */}
              <div className="absolute pt-28 inset-0 z-0">
                <img
                  src={isDark ? "/icons/leaderboard-dark.svg" : "/icons/leaderboard-light.svg"}
                  alt="Podium Background"
                  className="w-full h-full object-fill select-none pointer-events-none"
                />
              </div>

              {/* Absolute Placed Standings (Left = 3rd, Middle = 1st, Right = 2nd) */}
              <div className="absolute inset-0  z-10">

                {/* 3rd place (Left Column) */}
                <div className="absolute left-[18.2%] top-[36.3%] -translate-x-1/2 flex flex-col items-center w-[100px]">
                  {thirdPlace ? (
                    <div className="flex flex-col items-center gap-1.5 animate-fade-in w-full">
                      <div className="-translate-y-[6px]">
                        <img
                          src={getAvatarPath(2)}
                          alt="3rd Place Avatar"
                          className="md:w-11 md:h-11 w-8 h-8 rounded-full border-2 border-orange-400 bg-white dark:bg-dark-700"
                        />
                      </div>
                      <span className="text-[11px] font-primary-bold text-text-primary-light dark:text-text-primary-dark max-w-[80px] truncate text-center leading-tight">
                        {formatUsername(thirdPlace.username)}
                      </span>
                      <span className="text-[9px] font-primary-bold text-orange-950 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                        {thirdPlace.total_transactions || 0} streaks
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 1st place (Middle Column) */}
                <div className="absolute left-[48.6%] top-[11.8%] -translate-x-1/2 flex flex-col items-center w-[120px]">
                  {firstPlace ? (
                    <div className="flex flex-col items-center gap-1.5 animate-fade-in w-full">
                      <div className="relative flex items-center justify-center -translate-y-[10px]">
                        <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-sm absolute -top-5" />
                        <img
                          src={getAvatarPath(0)}
                          alt="1st Place Avatar"
                          className="md:w-14 md:h-14 w-10 h-10 rounded-full border-4 border-yellow-400 bg-white dark:bg-dark-700"
                        />
                      </div>
                      <span className="text-[12px] font-primary-bold text-text-primary-light dark:text-text-primary-dark max-w-[90px] truncate text-center leading-tight">
                        {formatUsername(firstPlace.username)}
                      </span>
                      <span className="text-[10px] font-primary-bold text-yellow-950 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-950/40 px-2.5 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-900/50">
                        {firstPlace.total_transactions || 0} streaks
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 2nd place (Right Column) */}
                <div className="absolute left-[82.1%] top-[30.5%] -translate-x-1/2 flex flex-col items-center w-[100px]">
                  {secondPlace ? (
                    <div className="flex flex-col items-center gap-1.5 animate-fade-in w-full">
                      <div className="-translate-y-[8px]">
                        <img
                          src={getAvatarPath(1)}
                          alt="2nd Place Avatar"
                          className="md:w-12 md:h-12 w-9 h-9 rounded-full border-3 border-slate-300 bg-white dark:bg-dark-700"
                        />
                      </div>
                      <span className="text-[11px] font-primary-bold text-text-primary-light dark:text-text-primary-dark max-w-[80px] truncate text-center leading-tight">
                        {formatUsername(secondPlace.username)}
                      </span>
                      <span className="text-[9px] font-primary-bold text-slate-950 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-900/50">
                        {secondPlace.total_transactions || 0} streaks
                      </span>
                    </div>
                  ) : null}
                </div>

              </div>

            </div>

            {/* Ranking Header Description Text */}
            <div className="px-1 py-1">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Top {activeTab === "crypto" ? "Crypto" : "Gift Card"} Ranking 😌
              </h4>
              <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Top 20 users to rank the leaderboard monthly get rewarded at the end of each month.
              </p>
            </div>

            {/* Remaining Ranks List Table */}
            <div className="flex flex-col gap-3">
              <div className="flex bg-light-100 dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-xl py-3 px-4 text-b3 font-primary-bold text-text-secondary-light dark:text-text-secondary-dark items-center">
                <span className="w-8 shrink-0">No</span>
                <span className="flex-1 px-4 text-left">Name</span>
                <span className="w-20 text-right">Streak</span>
              </div>

              {leaderboard.length > 0 ? (
                <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
                  {leaderboard.map((item, index) => {
                    const isMe = userInfo?.username && item.username && userInfo.username.toLowerCase() === item.username.toLowerCase();
                    return (
                      <div
                        key={index}
                        className={`p-4 flex items-center text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors ${isMe ? "bg-primary-500/5 dark:bg-primary-500/10 border-l-4 border-l-primary-500" : ""
                          }`}
                      >
                        <span className="w-8 font-primary-bold text-text-tertiary-light dark:text-text-tertiary-dark shrink-0">
                          #{item.position}
                        </span>
                        <div className="flex-1 px-4 flex items-center gap-3 min-w-0">
                          <img
                            src={getAvatarPath(item.position)}
                            alt="User avatar"
                            className="w-8 h-8 rounded-full bg-light-100 dark:bg-dark-700 shrink-0 border border-border-light dark:border-[#232323]"
                          />
                          <span className={`font-primary-bold truncate ${isMe ? "text-primary-500" : "text-text-primary-light dark:text-text-primary-dark"}`}>
                            {formatUsername(item.username)} {isMe && "(You)"}
                          </span>
                        </div>
                        <span className={`w-20 font-primary-bold text-right shrink-0 ${isMe ? "text-primary-500" : "text-text-primary-light dark:text-text-primary-dark"}`}>
                          {item.total_transactions || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[24px] py-12 flex flex-col items-center justify-center gap-2 text-center">
                  <Medal className="w-10 h-10 text-text-tertiary-light dark:text-text-tertiary-dark" />
                  <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                    No ranks recorded
                  </p>
                  <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark max-w-xs">
                    Leaderboard rankings will appear here as trades complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Floating My Rank Banner (Fixed at Bottom matching mobile) */}
      {userRankInfo?.position && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-30">
          <div className="bg-primary-500 text-white rounded-[20px] p-4 flex items-center justify-between border border-primary-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] uppercase font-primary-bold tracking-wider">Your Standing</span>
                <span className="text-b2 font-primary-bold">Rank #{userRankInfo.position} · {userInfo?.username || "You"}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/80 text-[10px] uppercase font-primary-bold tracking-wider">Streak</span>
              <span className="text-b2 font-primary-bold">{userRankInfo.total_transactions || 0} streaks</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
