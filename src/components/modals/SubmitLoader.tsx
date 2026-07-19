"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface SubmitLoaderProps {
  visible: boolean;
  message?: string;
}

export function SubmitLoader({
  visible,
  message = "Processing transaction, please do not close or reload...",
}: SubmitLoaderProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-8 rounded-[30px] flex flex-col items-center justify-center gap-4 max-w-xs text-center shadow-2xl animate-in zoom-in-95 duration-200 select-none">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
export default SubmitLoader;
