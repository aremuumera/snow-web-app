"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl" | "full";
  disableClose?: boolean;
}

export function SideDrawer({
  visible,
  onClose,
  title,
  children,
  size = "md",
  disableClose = false,
}: SideDrawerProps) {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const handleClose = () => {
    if (disableClose) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black cursor-pointer"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className={`relative w-full ${
              size === "lg"
                ? "max-w-2xl"
                : size === "xl"
                ? "max-w-4xl"
                : size === "full"
                ? "max-w-full"
                : "max-w-md"
            } h-full bg-background-light dark:bg-background-dark border-l border-border-light dark:border-border-dark flex flex-col z-10`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0">
              {title ? (
                <h3 className="text-h7 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              {!disableClose && (
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-light-100 dark:hover:bg-dark-600 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default SideDrawer;
