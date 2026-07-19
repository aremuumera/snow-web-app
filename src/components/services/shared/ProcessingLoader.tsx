"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ProcessingLoaderProps {
  visible: boolean;
  message?: string;
}

export function ProcessingLoader({
  visible,
  message = "Processing your purchase...",
}: ProcessingLoaderProps) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-8 rounded-[24px] shadow-2xl flex flex-col items-center max-w-sm w-full text-center z-10 gap-4"
          >
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <div className="flex flex-col gap-1.5">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                {message}
              </h4>
              <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                Please wait, do not leave this screen.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
