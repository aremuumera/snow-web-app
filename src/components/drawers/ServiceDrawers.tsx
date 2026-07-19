"use client";

import React from "react";
import { useDrawer } from "@/context/DrawerContext";
import { SideDrawer } from "@/components/modals/SideDrawer";
import { SubmitLoader } from "@/components/modals/SubmitLoader";

// Import components directly to avoid nesting headers, back arrows, and routing pages
import { BuyAirtimeService } from "@/components/services/BuyAirtimeService";
import { BuyDataService } from "@/components/services/BuyDataService";
import { CableTvService } from "@/components/services/CableTvService";
import { ElectricityService } from "@/components/services/ElectricityService";
import { BettingService } from "@/components/services/BettingService";
import { BuyGiftCardService } from "@/components/services/BuyGiftCardService";
import { SellGiftCardService } from "@/components/services/SellGiftCardService";
import { SellCryptoService } from "@/components/services/SellCryptoService";

export function ServiceDrawers() {
  const { activeDrawer, closeDrawer, isSubmitting } = useDrawer();

  const getDrawerSize = () => {
    if (["sell-giftcard", "buy-giftcard"].includes(activeDrawer || "")) {
      return "lg";
    }
    return "md";
  };

  const getDrawerTitle = () => {
    if (activeDrawer === "airtime") return "Buy Airtime";
    if (activeDrawer === "data") return "Buy Data Bundle";
    if (activeDrawer === "betting") return "Betting Funding";
    if (activeDrawer === "cable") return "Cable TV Subscription";
    if (activeDrawer === "electricity") return "Electricity Bill";
    if (activeDrawer === "buy-giftcard") return "Buy Gift Card";
    if (activeDrawer === "sell-giftcard") return "Sell Gift Card";
    if (activeDrawer === "sell-crypto") return "Sell Crypto";
    return undefined;
  };

  return (
    <>
      <SideDrawer
        visible={activeDrawer !== null}
        onClose={closeDrawer}
        size={getDrawerSize()}
        title={getDrawerTitle()}
        disableClose={isSubmitting}
      >
        <div className="py-2 h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activeDrawer === "airtime" && <BuyAirtimeService />}
          {activeDrawer === "data" && <BuyDataService />}
          {activeDrawer === "betting" && <BettingService />}
          {activeDrawer === "cable" && <CableTvService />}
          {activeDrawer === "electricity" && <ElectricityService />}
          {activeDrawer === "buy-giftcard" && <BuyGiftCardService />}
          {activeDrawer === "sell-giftcard" && <SellGiftCardService />}
          {activeDrawer === "sell-crypto" && <SellCryptoService />}
        </div>
      </SideDrawer>

      <SubmitLoader visible={isSubmitting} />
    </>
  );
}
