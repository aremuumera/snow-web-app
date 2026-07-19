"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CenterModal } from "./CenterModal";
import { paths } from "@/utils/paths";
import { AppIcon } from "@/components/ui/AppIcon";
import { useToast } from "@/context/ToastProvider";
import { useDrawer, DrawerType } from "@/context/DrawerContext";

interface MoreServicesModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenFundModal?: () => void;
}

interface ServiceItem {
  title: string;
  description: string;
  iconName: string;
  route: string;
  isComingSoon?: boolean;
}

interface ServiceCategory {
  title: string;
  services: ServiceItem[];
}

export function MoreServicesModal({ visible, onClose, onOpenFundModal }: MoreServicesModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { openDrawer } = useDrawer();

  const handleSelect = (route: string, title: string, isComingSoon?: boolean) => {
    if (isComingSoon) {
      showToast(`${title} is coming soon!`, "warning");
      return;
    }
    onClose();

    const getDrawerType = (t: string): DrawerType => {
      if (t === "Buy Gift Card") return "buy-giftcard";
      if (t === "Sell Gift Card") return "sell-giftcard";
      if (t === "Sell Crypto") return "sell-crypto";
      if (t === "Buy Airtime") return "airtime";
      if (t === "Buy Data ") return "data";
      if (t === "Cable TV") return "cable";
      if (t === "Electricity Payment") return "electricity";
      if (t === "Betting Funding") return "betting";
      return null;
    };

    if (title === "Deposit") {
      if (onOpenFundModal) {
        onOpenFundModal();
      } else {
        router.push(paths.dashboard.deposit);
      }
      return;
    }

    const type = getDrawerType(title);
    if (type) {
      openDrawer(type);
    } else {
      router.push(route);
    }
  };

  const serviceCategories: ServiceCategory[] = [
    {
      title: "Top Services",
      services: [
        {
          title: "Buy Gift Card",
          description: "Purchase digital gift cards",
          iconName: "giftcard",
          route: paths.giftcards.buy,
        },
        {
          title: "Sell Gift Card",
          description: "Trade cards for instant cash",
          iconName: "giftcard",
          route: paths.giftcards.sell,
        },
        {
          title: "Sell Crypto",
          description: "Sell BTC, ETH, and USDT",
          iconName: "crypto",
          route: paths.crypto.sell,
        },
        {
          title: "Buy Crypto",
          description: "Sell BTC, ETH, and USDT",
          iconName: "crypto",
          route: paths.crypto.sell,
          isComingSoon: true,
        },
      ],
    },
    {
      title: "Other Services",
      services: [
        {
          title: "Buy Airtime",
          description: "Top up airtime instantly",
          iconName: "airtime",
          route: paths.bills.airtime,
        },
        {
          title: "Buy Data ",
          description: "Fund internet data bundles",
          iconName: "data",
          route: paths.bills.data,
        },
        {
          title: "Cable TV",
          description: "DSTV, GOTV, StarTimes bills",
          iconName: "tv",
          route: paths.bills.cable,
        },
        {
          title: "Electricity Payment",
          description: "Pay power bills immediately",
          iconName: "elect",
          route: paths.bills.electricity,
        },
        {
          title: "Betting Funding",
          description: "Fund betting wallets",
          iconName: "betting",
          route: paths.bills.betting,
        },
        {
          title: "Deposit",
          description: "Fund account wallet balance",
          iconName: "payment",
          route: paths.dashboard.deposit,
        },
      ],
    },
  ];

  return (
    <CenterModal visible={visible} onClose={onClose} title="More Bills & Services">
      <div className="flex flex-col gap-6 p-2 w-full max-h-[75vh] overflow-y-auto pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {serviceCategories.map((category) => (
          <div key={category.title} className="flex flex-col gap-2.5">
            <h4 className="text-[12px] font-primary-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-1">
              {category.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.services.map((service) => (
                <button
                  key={service.title}
                  onClick={() => handleSelect(service.route, service.title, service.isComingSoon)}
                  className={`relative flex items-center gap-3.5 p-4 rounded-[20px] border border-border-light dark:border-[#232323] bg-light-50 dark:bg-dark-900 hover:bg-light-75 dark:hover:bg-dark-800 transition-all text-left cursor-pointer w-full min-w-0 ${service.isComingSoon ? "opacity-75" : ""
                    }`}
                >
                  {service.isComingSoon && (
                    <span className="absolute top-0 right-0 text-[9px] bg-[#FF9900] text-white px-2 py-0.5 rounded-tl-xl rounded-br-none rounded-tr-xl rounded-bl-lg font-primary-bold">
                      Coming Soon
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                    <AppIcon name={service.iconName} size={22} color="var(--color-primary-500)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate">
                      {service.title}
                    </h5>
                    <p className="text-[10px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate">
                      {service.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CenterModal>
  );
}
