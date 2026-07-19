"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  leadingIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function Select({
  label,
  error,
  placeholder = "Select option",
  options,
  value,
  onChange,
  leadingIcon,
  className = "",
  disabled = false,
  searchable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 w-full relative">
      {label && (
        <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          bg-surface-light dark:bg-surface-dark
          border ${error ? "border-danger-500" : "border-border-light dark:border-border-dark"}
          focus:border-primary-500 dark:focus:border-primary-400
          ${leadingIcon ? "pl-11" : "pl-4"}
          pr-4 py-3
          rounded-[20px]
          text-b2 font-primary-regular text-left
          text-text-primary-light dark:text-text-primary-dark
          outline-none
          cursor-pointer
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          {leadingIcon && (
            <div className="absolute left-4 text-text-tertiary-light dark:text-text-tertiary-dark">
              {leadingIcon}
            </div>
          )}
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-text-disabled-light dark:text-text-disabled-dark">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[20px] overflow-hidden flex flex-col max-h-72"
          >
            {/* Search input */}
            {searchable && (
              <div className="px-3 pt-3 pb-2 border-b border-border-light dark:border-border-dark shrink-0">
                <div className="flex items-center gap-2 bg-light-100 dark:bg-dark-700 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary-dark shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-b3 font-primary-regular text-text-primary-light dark:text-text-primary-dark placeholder:text-text-disabled-light dark:placeholder:text-text-disabled-dark outline-none"
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="overflow-y-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-4 text-center text-b3 font-primary-regular text-text-disabled-light dark:text-text-disabled-dark">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`
                      w-full flex items-center gap-2 px-4 py-3 text-b2 font-primary-regular text-left
                      text-text-primary-light dark:text-text-primary-dark
                      hover:bg-light-100 dark:hover:bg-dark-600 transition-colors
                      ${value === option.value ? "bg-light-100 dark:bg-dark-700 font-primary-semibold" : ""}
                    `}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-b3 font-primary-regular text-danger-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
