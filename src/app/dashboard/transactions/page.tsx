"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAllTransactionMutation } from "@/redux/transaction/transaction_history";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { paths } from "@/utils/paths";
import { formatCurrency } from "@/utils/formatamount";
import { Loader2, Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TransactionsPage() {
  const router = useRouter();
  const [getAllTransactions] = useGetAllTransactionMutation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTransactions = React.useCallback(
    async (pageNum: number, pageSize: number, signal: AbortSignal) => {
      const payload: any = { per_page: pageSize, page: pageNum };
      if (typeFilter !== "all") payload.role = typeFilter;
      if (statusFilter !== "all") payload.status = statusFilter;
      if (debouncedSearch.trim()) payload.search = debouncedSearch.trim();

      const res = await getAllTransactions({ data: payload }).unwrap();
      const txList = res?.data?.transactions || res?.transactions || [];
      const pagination = res?.data?.pagination || res?.pagination;

      return {
        data: txList,
        pagination: pagination
          ? {
            current_page: pagination.current_page,
            last_page: pagination.last_page,
            total: pagination.total,
            per_page: pagination.per_page,
          }
          : undefined,
      };
    },
    [getAllTransactions, typeFilter, statusFilter, debouncedSearch]
  );

  const {
    data: transactions,
    page,
    limit,
    totalPages,
    totalItems,
    isLoading,
    fetchData,
    setPageDirectly,
    changeLimit,
  } = usePagination<any>(fetchTransactions, { limit: 10 });

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData, typeFilter, statusFilter, debouncedSearch]);

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "credit", label: "Credits / Deposits" },
    { value: "withdrawal", label: "Debits / Withdrawals" },
    { value: "giftcard", label: "Gift Cards" },
    { value: "crypto", label: "Crypto Trading" },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "success", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Transaction History
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Search, filter, and track all your trades and wallet transactions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-[20px]">
        <div className="flex-1">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-4 md:w-auto">
          <div className="w-40">
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
              }}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table Layout */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-x-auto shadow-xs scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading ? (
          <Skeleton variant="table" count={6} cols={8} />
        ) : transactions.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark text-[11px] font-primary-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark bg-light-50/50 dark:bg-dark-900/30">
                <th className="py-4 px-6">Reference</th>
                <th className="py-4 px-6">Service Type</th>
                <th className="py-4 px-6">Response</th>
                <th className="py-4 px-6">Old Balance</th>
                <th className="py-4 px-6">New Balance</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {transactions.map((tx: any) => {
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

                    {/* Service Type with Logo or Category Icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0 overflow-hidden">
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
            <div className="w-12 h-12 bg-light-100 dark:bg-dark-800 rounded-full flex items-center justify-center text-text-secondary-light">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              No transactions match your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPageDirectly(p)}
        limit={limit}
        onLimitChange={(l) => changeLimit(l)}
        totalItems={totalItems}
      />
    </div>
  );
}
