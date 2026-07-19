"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Clock,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { paths } from "@/utils/paths";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "debit";
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [getAllTypeDetail, { isLoading }] = useGetAllTypeDetailTransactionMutation();
  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [tradeStatus, setTradeStatus] = useState("success");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Image viewer lightbox state
  const [visibleImage, setVisibleImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  const getDrawerQueryPath = () => {
    if (type === "withdrawal") return "/dashboard/withdrawal";
    if (["deposit", "debit", "credit"].includes(type)) return "/dashboard/deposit";

    const drawerMap: Record<string, string> = {
      airtime: "airtime",
      data: "data",
      cable: "cable",
      bill: "electricity",
      electricity: "electricity",
      betting: "betting",
      crypto: "sell-crypto",
    };

    if (type === "giftcard") {
      const isBuy = data?.transaction_type === "buy" || data?.productName !== null;
      return `/dashboard?drawer=${isBuy ? "buy-giftcard" : "sell-giftcard"}`;
    }

    const drawer = drawerMap[type];
    if (drawer) {
      return `/dashboard?drawer=${drawer}`;
    }
    return "/dashboard";
  };

  useEffect(() => {
    if (!params?.id) return;
    const fetchDetail = async () => {
      try {
        const res = await getAllTypeDetail({
          data: {
            transid: params.id,
            role: type === "debit" || type === "credit" ? "deposit" : type,
          },
        }).unwrap();
        if (res?.status === "success") {
          setData(res?.transaction);
          setImages(res?.images || []);
          setTradeStatus(
            res?.transaction?.plan_status === 0
              ? "pending"
              : res?.transaction?.plan_status === 1
                ? "success"
                : "failed"
          );
        }
      } catch (err) {
        console.error("Failed to load transaction detail", err);
      }
    };
    fetchDetail();
  }, [params?.id, type, getAllTypeDetail]);

  const handleBack = () => {
    router.back();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied`, "success");
    setCopiedField(text);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderTransType = () => {
    const bills = ["electricity", "cable", "data", "airtime", "betting", "bill"];
    const gift = ["giftcard", "Giftcard", "GIFTCARD"];
    const crypto = ["crypto", "Crypto", "CRYPTO"];
    const withdrawal = ["withdrawal", "Withdrawal", "WITHDRAWAL"];
    if (type === "debit" || type === "credit") {
      return "Deposit";
    }
    if (gift.includes(type)) {
      return data?.category;
    }
    if (bills.includes(type)) {
      return data?.network || data?.disco_name || data?.cable_name || "Bill Payment";
    }
    if (crypto.includes(type)) {
      return data?.crypto_network || data?.currency;
    }
    if (withdrawal.includes(type)) {
      return data?.withdrawal_type || "Withdrawal";
    }
    return type.toUpperCase();
  };

  const getStatusText = () => {
    const action = type === "giftcard" ? (data?.transaction_type === "sell" ? "Trade" : "Purchase") :
      type === "withdrawal" ? "Withdrawal" :
        type === "debit" ? "Debit" :
          type === "credit" ? "Credit" :
            type === "crypto" ? "Crypto" :
              type === "betting" ? "Transaction" : `${type.charAt(0).toUpperCase() + type.slice(1)} Purchase`;
    return `Your ${action} ${tradeStatus === "success" ? "is Successful" : tradeStatus === "pending" ? "is Pending" : "failed"}`;
  };

  const getCurrencySymbol = (txType: string) => {
    const gift = ["giftcard", "Giftcard", "GIFTCARD"];
    if (gift.includes(txType)) return "$";
    return "₦";
  };

  const getTransactionFields = () => {
    if (!data) return [];

    const commonBefore = [
      { label: "Date", value: data?.plan_date || data?.date },
    ];
    const commonAfter = [
      { label: "Transaction ID", value: data?.transid, isCopyable: true },
      { label: "Old Balance", value: `₦${Number(data?.oldbal || data?.old_bal || 0).toLocaleString()}` },
      { label: "New Balance", value: `₦${Number(data?.newbal || data?.new_bal || 0).toLocaleString()}` },
    ];

    switch (type) {
      case "bill":
        return [
          { label: "Disco name", value: data?.disco_name },
          ...(data?.plan_status === 1 ? [{ label: "Token", value: data?.token, isCopyable: true }] : []),
          { label: "Meter type", value: data?.meter_type },
          { label: "Meter Number", value: data?.meter_number, isCopyable: true },
          { label: "Customer Name", value: data?.customer_name },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "data":
        return [
          { label: "Network", value: data?.network },
          { label: "Plan", value: data?.plan_name },
          { label: "Phone", value: data?.plan_phone },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "cable":
        return [
          { label: "Network", value: data?.cable_name },
          { label: "Plan", value: data?.cable_plan },
          { label: "Customer ID", value: data?.customer_name },
          { label: "Cable Number", value: data?.iuc, isCopyable: true },
          ...commonBefore,
          ...commonAfter,
          { label: "Bill Type", value: type.toUpperCase() },
        ];
      case "airtime":
        return [
          { label: "Network", value: data?.network },
          { label: "Bill Type", value: type.toUpperCase() },
          { label: "Phone", value: data?.plan_phone },
          ...commonBefore,
          ...commonAfter,
        ];
      case "giftcard":
        return [
          { label: "Date", value: data?.plan_date || data?.date },
          { label: "Recipient Email", value: data?.recipient_email },
          { label: "Category", value: data?.image, secondaryValue: data?.category, isImage: true },
          { label: "Sub Category", value: data?.subcategory },
          { label: "Rate", value: `₦${Number(data?.rate || 0).toLocaleString()}` },
          { label: "Giftcard Type", value: data?.physical_ecode },
          { label: "Country", value: data?.country },
          { label: "Quantity", value: data?.quantity },
          { label: "Total Amount", value: data?.total_amount ? `${getCurrencySymbol(type)}${Number(data?.total_amount || 0).toLocaleString()}` : null },
          { label: "Amount to be Paid", value: data?.estimated ? `₦${Number(data?.estimated || 0).toLocaleString()}` : null },
          ...commonAfter,
          { label: "Comment", value: data?.comment_ecode, fullWidthValue: true },
          { label: "Reject Reason", value: data?.reject_reason, fullWidthValue: true },
        ];
      case "debit":
      case "credit":
        return [...commonBefore, ...commonAfter];
      case "withdrawal":
        return [
          { label: "Date", value: data?.date },
          { label: "Account Name", value: data?.account_name },
          { label: "Account Number", value: data?.account_number },
          { label: "Amount", value: `₦${Number(data?.amount || 0).toLocaleString()}` },
          { label: "Bank Name", value: data?.bank_name },
          ...commonAfter,
        ];
      case "betting":
        return [
          ...commonBefore,
          { label: "Betting Platform", value: data?.billername },
          ...commonAfter,
        ];
      case "crypto":
        return [
          { label: "Date", value: data?.created_at || data?.date },
          { label: "Currency", value: data?.currency },
          { label: "Network", value: data?.network },
          { label: "Amount (Crypto)", value: data?.amount_with_network || data?.amount },
          { label: "Rate", value: `₦${Number(data?.ngnx_rate || data?.rate || 0).toLocaleString()}` },
          { label: "Amount in Naira", value: `₦${Number(data?.amount_credited_in_naira || data?.swapped_amount || 0).toLocaleString()}` },
          { label: "Wallet Address", value: data?.user_address, isCopyable: true },
          ...commonAfter,
        ];
      default:
        return [...commonBefore, ...commonAfter];
    }
  };

  const handleSupportPress = () => {
    if (!data) return;
    const category = data?.category;
    const normalizedType = type?.toLowerCase();

    let cardName = category || "Transaction";
    let cardCategory = normalizedType || "";

    if (normalizedType === "giftcard") {
      cardName = category || "Gift Card";
    } else if (normalizedType === "crypto") {
      cardName = data?.coin_name || "Crypto";
    } else if (["airtime", "data", "cable", "bill", "betting"].includes(normalizedType)) {
      cardName = data?.package_name || data?.provider || "Bill Payment";
    }

    router.push(`/dashboard/messages?tradeId=${params.id}&cardName=${encodeURIComponent(cardName)}&cardCategory=${encodeURIComponent(cardCategory)}&amount=${data.amount || data.total_amount || 0}`);
  };

  const amount = type === "giftcard"
    ? data?.final_amount || data?.estimated
    : type === "crypto"
      ? data?.amount_credited_in_naira || data?.swapped_amount || data?.amount
      : data?.amount;

  const handleActionButton = () => {
    if (tradeStatus === "success" || tradeStatus === "pending") {
      router.push("/dashboard");
    } else {
      router.push(getDrawerQueryPath());
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Transaction Details
          </h3>
        </div>
        {data && (
          <button
            onClick={handleSupportPress}
            className="p-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-b3 font-primary-bold">Support</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6 animate-pulse select-none">
          {/* Shimmer Receipt Card */}
          <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[30px] shadow-sm pt-5 pb-8 relative overflow-hidden">
            {/* Header Box Shimmer */}
            <div className="bg-light-200 dark:bg-dark-800/80 rounded-[20px] h-[160px] mx-4 mt-3 relative flex flex-col items-center justify-center gap-3">
              <div className="absolute -top-5 w-10 h-10 rounded-full bg-light-300 dark:bg-dark-700/80 border-[3px] border-light-50 dark:border-dark-900" />
              <div className="h-6 w-36 bg-light-300 dark:bg-dark-700/80 rounded-lg mt-4 animate-pulse" />
              <div className="h-4 w-52 bg-light-300 dark:bg-dark-700/80 rounded-lg animate-pulse" />
              <div className="h-8 w-28 bg-light-300 dark:bg-dark-700/80 rounded-lg animate-pulse" />
            </div>

            {/* Scalloped divider shim */}
            <div className="flex justify-between items-center my-6 px-4">
              <div className="w-4 h-4 rounded-full bg-background-light dark:bg-background-dark border-r border-border-light dark:border-border-dark -ml-6" />
              <div className="flex-1 border-t border-dashed border-light-300 dark:border-dark-700/60 mx-2" />
              <div className="w-4 h-4 rounded-full bg-background-light dark:bg-background-dark border-l border-border-light dark:border-border-dark -mr-6" />
            </div>

            {/* Metadata Fields Shimmer */}
            <div className="px-6 flex flex-col gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="h-4 w-28 bg-light-200 dark:bg-dark-800 rounded animate-pulse" />
                  <div className="h-4 w-36 bg-light-200 dark:bg-dark-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action button shimmer */}
          <div className="h-12 w-full bg-light-200 dark:bg-dark-800 rounded-2xl animate-pulse" />
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* Receipt Card Wrapper */}
          <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-[30px] shadow-sm pt-5 pb-8 relative overflow-hidden">
            {/* Header Colored Summary Box */}
            <div
              className="rounded-[20px] py-6 px-4 mx-4 mt-3 relative text-white flex flex-col items-center justify-center text-center gap-2 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${isDark ? "/images/background-brep-dark.png" : "/images/background-brep-light.png"})`,
              }}
            >
              {/* Absolute Top Status Icon */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                {tradeStatus === "success" && (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-primary-500 select-none">
                    <Check className="w-5 h-5 text-primary-500 stroke-[3px]" />
                  </div>
                )}
                {tradeStatus === "pending" && (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-warning-500 animate-pulse select-none">
                    <Clock className="w-5 h-5 text-warning-500 stroke-[3px]" />
                  </div>
                )}
                {tradeStatus === "failed" && (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-error-500 select-none">
                    <X className="w-5 h-5 text-error-500 stroke-[3px]" />
                  </div>
                )}
              </div>

              {/* Icon & Category/Network Name */}
              <div className="flex items-center justify-center gap-2 text-white/95 mt-3 select-none">
                <ServiceIcon
                  role={type}
                  name={data?.network || data?.category || data?.withdrawal_type || data?.disco_name || type}
                  image={data?.image}
                  size={24}
                />
                <span className="text-b2 font-primary-bold tracking-wider">
                  {renderTransType()}
                </span>
              </div>

              {/* Status Sentence */}
              <p className="text-b3 font-primary-medium text-white/90">
                {getStatusText()}
              </p>

              {/* Formatted Amount */}
              <h2 className="text-h3 font-primary-bold text-white mt-1">
                ₦{Number(amount || 0).toLocaleString()}
              </h2>
            </div>

            {/* Receipt Details Fields */}
            <div className="py-4 px-5 mt-4">
              {(getTransactionFields() as any[]).map((row, idx) => {
                if (row.value === undefined || row.value === null || row.value === "" || row.value === "N/A") return null;

                if (row.fullWidthValue) {
                  return (
                    <div key={idx} className="flex flex-col gap-2 py-4 border-b border-dashed border-border-light dark:border-border-dark last:border-0 last:pb-0">
                      <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                        {row.label}
                      </span>
                      <span className="text-b2 font-primary-semibold text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap break-words bg-light-100 dark:bg-dark-800 p-3.5 rounded-2xl border border-border-light dark:border-border-dark">
                        {row.value}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex justify-between items-center py-4 border-b border-dashed border-border-light dark:border-border-dark last:border-0 last:pb-0">
                    <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {row.isImage && row.value && (
                        <img src={row.value} alt={row.label} className="w-8 h-8 object-contain rounded-lg shrink-0" />
                      )}
                      <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate select-all">
                        {row.secondaryValue || row.value}
                      </span>
                      {row.isCopyable && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(row.value, row.label)}
                          className="p-1 hover:bg-light-150 dark:hover:bg-dark-800 rounded-md transition-colors text-text-secondary-light dark:text-text-secondary-dark cursor-pointer shrink-0"
                        >
                          {copiedField === row.value ? (
                            <Check className="w-3.5 h-3.5 text-success-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Gift Card Preview Horizontal List */}
              {type === "giftcard" && images?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-dashed border-border-light dark:border-border-dark flex flex-col gap-3">
                  <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Gift Card Preview (Click to enlarge) ({images?.length})
                  </span>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {images.map((imgItem: any, idx: number) => {
                      const imgSrc = typeof imgItem === "string" ? imgItem : imgItem?.image;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentImageIndex(idx);
                            setVisibleImage(true);
                          }}
                          className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-border-light dark:border-border-dark hover:scale-[1.03] transition-all cursor-pointer bg-light-100 dark:bg-dark-800"
                        >
                          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Scalloped Edge Cutouts at the bottom */}
            <div className="absolute -bottom-3 left-0 right-0 flex justify-between overflow-hidden h-6 pointer-events-none select-none px-[-12px]">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-background-light dark:bg-background-dark border border-border-light/20 dark:border-border-dark/20 -translate-y-1/2 shrink-0"
                  style={{ margin: "0 -2.5px" }}
                />
              ))}
            </div>
          </div>

          {/* More Action Panel */}
          <div className="flex flex-col gap-4 rounded-[30px] border border-border-light dark:border-border-dark bg-light-50 dark:bg-dark-900 p-5 shadow-sm">
            <span className="text-b3 font-primary-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark opacity-60">
              More Action
            </span>

            {/* Perform Action Again */}
            <button
              onClick={() => {
                router.push(getDrawerQueryPath());
              }}
              className="flex items-center justify-between py-1 text-primary-500 hover:text-primary-600 font-primary-bold text-b2 transition-colors cursor-pointer group"
            >
              <span>
                {type === "withdrawal" ? "Withdraw again" :
                  type === "debit" || type === "credit" ? "Deposit again" :
                    type === "airtime" ? "Buy airtime again" :
                      type === "data" ? "Buy data again" :
                        type === "cable" ? "Pay cable again" :
                          type === "bill" ? "Pay bill again" :
                            type === "betting" ? "Pay betting again" :
                              type === "giftcard" ? "Sell giftcard again" :
                                type === "crypto" ? "Sell crypto again" : "Pay again"}
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Divider */}
            <div className="h-[1px] bg-border-light dark:bg-border-dark border-dashed" />

            {/* Support */}
            <button
              onClick={handleSupportPress}
              className="flex items-center justify-between py-1 text-primary-500 hover:text-primary-600 font-primary-bold text-b2 transition-colors cursor-pointer group"
            >
              <span>Contact support</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-3 mt-2">
            <Button onClick={handleActionButton} variant="primary" fullWidth className="h-14 rounded-2xl text-b1 font-primary-bold">
              {tradeStatus === "success" ? "Leave Review" : tradeStatus === "pending" ? "Ok, Thanks" : "Try Again"}
            </Button>
            <Button onClick={handleBack} variant="outline" fullWidth className="h-14 rounded-2xl text-b1 font-primary-bold">
              Back to Transactions
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col gap-2">
          <p className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Transaction not found
          </p>
          <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
            The requested transaction details could not be loaded.
          </p>
        </div>
      )}

      {/* Image Viewing Lightbox Modal */}
      {visibleImage && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-center items-center p-4 transition-all duration-300 select-none"
          onClick={() => setVisibleImage(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setVisibleImage(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Gallery view */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous image */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={typeof images[currentImageIndex] === "string" ? images[currentImageIndex] : (images[currentImageIndex] as any)?.image}
              alt="Gift Card Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Next image */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Index indicator */}
          <div className="mt-4 text-white/80 font-primary-bold text-b2 bg-black/40 px-4 py-1.5 rounded-full select-none">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
