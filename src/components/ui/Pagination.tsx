"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  totalItems,
}: PaginationProps) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers to display (with ellipsis if needed)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  // Calculate entry indices
  const fromIndex = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const toIndex = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 w-full select-none border-t border-border-light dark:border-[#232323] mt-2">
      {/* Limit Selector and Entries Metrics Info */}
      <div className="flex items-center justify-between sm:justify-start gap-4 flex-wrap w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">Show</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-[#232323] rounded-lg px-2.5 py-1 text-b3 font-primary-semibold text-text-primary-light dark:text-text-primary-dark outline-none cursor-pointer focus:border-primary-500"
          >
            {[10, 20, 50, 100].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">entries</span>
        </div>

        <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
          Showing <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">{fromIndex}</span> to{" "}
          <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">{toIndex}</span> of{" "}
          <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">{totalItems}</span> entries
        </span>
      </div>

      {/* Page Buttons Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
          {/* Mobile view compact controls */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-4 h-9 rounded-lg border border-border-light dark:border-[#232323] flex items-center justify-center text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-4 h-9 rounded-lg border border-border-light dark:border-[#232323] flex items-center justify-center text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>

          {/* Desktop view full controls */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Prev Arrow */}
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-lg border border-border-light dark:border-[#232323] flex items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pages list */}
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-b3 text-text-tertiary-light dark:text-text-tertiary-dark"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg text-b3 font-primary-bold flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-500 text-white shadow-xs"
                      : "border border-border-light dark:border-[#232323] text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-lg border border-border-light dark:border-[#232323] flex items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-light-75 dark:hover:bg-dark-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Pagination;
