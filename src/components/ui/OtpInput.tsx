"use client";

import React, { useRef, useState, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const newDigits = Array(length).fill("");
    for (let i = 0; i < value.length && i < length; i++) {
      newDigits[i] = value[i];
    }
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;

    const newDigits = [...digits];
    // Keep only the last char
    newDigits[idx] = val.slice(-1);
    setDigits(newDigits);

    const newValue = newDigits.join("");
    onChange(newValue);

    // Focus next input
    if (idx < length - 1 && val) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (digits[idx]) {
        newDigits[idx] = "";
      } else if (idx > 0) {
        newDigits[idx - 1] = "";
        inputRefs.current[idx - 1]?.focus();
      }
      setDigits(newDigits);
      onChange(newDigits.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!text) return;

    const newDigits = [...digits];
    for (let i = 0; i < text.length; i++) {
      newDigits[i] = text[i];
    }
    setDigits(newDigits);
    onChange(text);

    // Focus last or next active input
    const nextFocusIdx = Math.min(text.length, length - 1);
    inputRefs.current[nextFocusIdx]?.focus();
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <div className="flex gap-2 justify-center w-full max-w-sm">
        {Array(length)
          .fill(0)
          .map((_, idx) => (
            <input
              key={idx}
              ref={(el) => {
                if (el) inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[idx]}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              className={`
                w-12 h-12 text-center text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark
                bg-white dark:bg-surface-dark
                border ${error ? "border-danger-500" : "border-[#E5E7EB] dark:border-border-dark"}
                focus:border-primary-500 dark:focus:border-primary-400
                rounded-xl outline-none transition-all duration-200
              `}
            />
          ))}
      </div>
      {error && (
        <p className="text-b3 font-primary-regular text-danger-500">
          {error}
        </p>
      )}
    </div>
  );
}
