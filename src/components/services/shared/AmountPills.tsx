"use client";

import React from "react";

interface AmountPillsProps {
  amounts: string[];
  selectedAmount: string;
  onChange: (amount: string) => void;
}

export function AmountPills({ amounts, selectedAmount, onChange }: AmountPillsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {amounts.map((amt) => {
        const isSelected = selectedAmount === amt;
        return (
          <button
            key={amt}
            type="button"
            onClick={() => onChange(amt)}
            className={`
              items-center justify-center py-3 px-3 rounded-2xl bg-light-100 dark:bg-dark-900 border transition-all text-b2 font-primary-bold text-center select-none cursor-pointer text-text-primary-light dark:text-text-primary-dark
              ${
                isSelected
                  ? "border-primary-500 text-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-border-light dark:border-border-dark hover:bg-light-200 dark:hover:bg-dark-800"
              }
            `}
          >
            ₦{Number(amt).toLocaleString()}
          </button>
        );
      })}
    </div>
  );
}
