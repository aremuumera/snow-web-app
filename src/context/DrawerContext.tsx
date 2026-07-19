"use client";

import React, { createContext, useContext, useState } from "react";

export type DrawerType =
  | "airtime"
  | "data"
  | "betting"
  | "cable"
  | "electricity"
  | "buy-giftcard"
  | "sell-giftcard"
  | "sell-crypto"
  // | "deposit"
  // | "withdrawal"
  | null;

interface DrawerContextProps {
  activeDrawer: DrawerType;
  drawerData: any;
  openDrawer: (type: DrawerType, data?: any) => void;
  closeDrawer: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const DrawerContext = createContext<DrawerContextProps | undefined>(undefined);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDrawer = (type: DrawerType, data: any = null) => {
    setActiveDrawer(type);
    setDrawerData(data);
  };

  const closeDrawer = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setActiveDrawer(null);
    setDrawerData(null);
  };

  return (
    <DrawerContext.Provider
      value={{
        activeDrawer,
        drawerData,
        openDrawer,
        closeDrawer,
        isSubmitting,
        setIsSubmitting,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
}

