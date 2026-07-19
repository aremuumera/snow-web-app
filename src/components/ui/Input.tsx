"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leadingIcon, trailingIcon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {leadingIcon && (
            <div className="absolute left-4 text-text-tertiary-light dark:text-text-tertiary-dark">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full
              bg-white dark:bg-surface-dark
              border ${error ? "border-danger-500" : "border-[#E5E7EB] dark:border-border-dark"}
              focus:border-primary-500 dark:focus:border-primary-400
              ${leadingIcon ? "pl-11" : "pl-4"}
              ${trailingIcon ? "pr-11" : "pr-4"}
              py-3
              rounded-[20px]
              text-b2 font-primary-regular
              text-text-primary-light dark:text-text-primary-dark
              placeholder:text-text-disabled-light dark:placeholder:text-text-disabled-dark
              outline-none
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-4 text-text-tertiary-light dark:text-text-tertiary-dark">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-b3 font-primary-regular text-danger-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
