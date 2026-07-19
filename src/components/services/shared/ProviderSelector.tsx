"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { CenterModal } from "@/components/modals/CenterModal";
import { AppIcon } from "@/components/ui/AppIcon";

export interface ProviderItem {
  id: string;
  name: string;
  logo?: string;
  image?: string;
  discoId?: string; // specific to electricity
}

interface ProviderSelectorProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  providers: ProviderItem[];
  onSelect: (provider: ProviderItem) => void;
  selectedValue?: string;
  isLoading?: boolean;
}

export function ProviderSelector({
  visible,
  onClose,
  title,
  providers,
  onSelect,
  selectedValue,
  isLoading = false,
}: ProviderSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CenterModal visible={visible} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 max-h-[500px]">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
          <input
            type="text"
            placeholder="Search provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Scrollable Provider List */}
        <div className={`flex-1 flex flex-col gap-2 pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isLoading ? "overflow-hidden" : "overflow-y-auto"
        }`}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`ske-${idx}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark animate-pulse select-none"
              >
                <div className="w-9 h-9 rounded-xl bg-light-200 dark:bg-dark-800" />
                <div className="h-4 bg-light-200 dark:bg-dark-800 rounded w-2/3" />
              </div>
            ))
          ) : filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const isSelected = selectedValue === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    onSelect(provider);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl hover:bg-light-100 dark:hover:bg-dark-700/50 transition-colors w-full cursor-pointer text-left ${
                    isSelected ? "bg-primary-500/10 border border-primary-500/20" : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {provider.image ? (
                      <img src={provider.image} alt={provider.name} className="w-9 h-9 object-contain rounded-full" />
                    ) : provider.logo ? (
                      <AppIcon name={provider.logo} size={36} />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-light-200 dark:bg-dark-600 flex items-center justify-center font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                        {provider.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                      {provider.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              No provider found
            </div>
          )}
        </div>
      </div>
    </CenterModal>
  );
}
