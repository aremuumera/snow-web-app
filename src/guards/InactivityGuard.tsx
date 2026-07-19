"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/store";
import { logout } from "@/redux/auth/auth_slice";
import { clearSession } from "@/redux/auth/session";
import { TokenManager } from "@/utils/token-manager";
import { paths } from "@/utils/paths";
import { ShieldAlert, LogOut, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface InactivityGuardProps {
  children: React.ReactNode;
}

// Configurable timeouts in milliseconds
const INACTIVITY_TIMEOUT = Number(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT) || 5 * 60 * 1000; // 5 minutes default
const COUNTDOWN_TIMEOUT = Number(process.env.NEXT_PUBLIC_COUNTDOWN_TIMEOUT) || 60 * 1000; // 60 seconds default

export function InactivityGuard({ children }: InactivityGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIMEOUT / 1000);
  
  const lastActiveRef = useRef<number>(Date.now());
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    // Clear intervals
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);

    TokenManager.removeToken();
    dispatch(logout());
    dispatch(clearSession());
    router.push(paths.auth.login);
  };

  const handleKeepAlive = () => {
    setShowModal(false);
    lastActiveRef.current = Date.now();
    setCountdown(COUNTDOWN_TIMEOUT / 1000);
  };

  // Activity event handler (throttled to avoid heavy CPU load)
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActiveRef.current > 1000) {
        lastActiveRef.current = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastActiveRef.current = Date.now();
      }
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "pointerdown", "click", "touchend"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Monitor inactivity check interval
  useEffect(() => {
    inactivityTimerRef.current = setInterval(() => {
      if (!showModal) {
        const timeSinceLastActivity = Date.now() - lastActiveRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          setShowModal(true);
          setCountdown(COUNTDOWN_TIMEOUT / 1000);
        }
      }
    }, 1000);

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [showModal]);

  // Monitor countdown when modal is visible
  useEffect(() => {
    if (showModal) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showModal]);

  return (
    <>
      {children}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Premium Inactivity Warning Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-border-light dark:border-[#232323] rounded-[30px] p-6 flex flex-col items-center text-center shadow-2xl z-10 overflow-hidden"
            >
              {/* Background Accent glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-warning-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Guard Alert Icon */}
              <div className="w-16 h-16 rounded-full bg-warning-500/10 dark:bg-warning-500/20 flex items-center justify-center text-warning-500 mb-5 relative">
                <ShieldAlert className="w-8 h-8" />
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning-500"></span>
                </span>
              </div>

              {/* Title & Warning message */}
              <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Are you still here?
              </h3>
              <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-2 px-2">
                For your security, you will be logged out automatically in:
              </p>

              {/* Countdown badge */}
              <div className="my-5 px-6 py-3 bg-light-100 dark:bg-dark-800 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-2">
                <span className="text-h5 font-primary-bold text-warning-500 font-mono tracking-wider">
                  {countdown}
                </span>
                <span className="text-b3 font-primary-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                  seconds
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <button
                  onClick={handleKeepAlive}
                  className="flex-1 py-3.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-primary-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>I'm still here</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 rounded-full border border-border-light dark:border-border-dark hover:bg-light-100 dark:hover:bg-dark-800 text-text-primary-light dark:text-text-primary-dark font-primary-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default InactivityGuard;
