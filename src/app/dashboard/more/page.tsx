"use client";

import React from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { ChevronRight } from "lucide-react";
import { useDrawer, DrawerType } from "@/context/DrawerContext";

export default function MoreServicesPage() {
  const { openDrawer } = useDrawer();

  const serviceCategories = [
    {
      title: "Telecom Services",
      services: [
        {
          title: "Buy Airtime",
          description: "Top up airtime instantly on any network",
          iconName: "airtime",
          drawerType: "airtime" as DrawerType,
        },
        {
          title: "Buy Data Bundle",
          description: "Fund internet data bundles directly",
          iconName: "data",
          drawerType: "data" as DrawerType,
        },
      ],
    },
    {
      title: "Utility Bills",
      services: [
        {
          title: "Cable TV Subscription",
          description: "DSTV, GOTV, StarTimes subscription",
          iconName: "tv",
          drawerType: "cable" as DrawerType,
        },
        {
          title: "Electricity Payment",
          description: "Pay prepaid/postpaid electricity bills",
          iconName: "elect",
          drawerType: "electricity" as DrawerType,
        },
      ],
    },
    {
      title: "Entertainment & Gaming",
      services: [
        {
          title: "Betting Funding",
          description: "Fund bet9ja, betking, sportybet wallets",
          iconName: "betting",
          drawerType: "betting" as DrawerType,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h3 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          More Bills & Services
        </h3>
        <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
          Select any utility bill, network operator, or gaming account to make immediate payments.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {serviceCategories.map((category) => (
          <div key={category.title} className="flex flex-col gap-3">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark opacity-90 px-1">
              {category.title}
            </h4>
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
              {category.services.map((service) => (
                <button
                  key={service.title}
                  type="button"
                  onClick={() => openDrawer(service.drawerType)}
                  className="flex items-center justify-between p-5 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors w-full text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-light-100 dark:bg-dark-700 flex items-center justify-center shrink-0">
                      <AppIcon name={service.iconName} size={24} />
                    </div>
                    <div>
                      <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                        {service.title}
                      </h5>
                      <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
