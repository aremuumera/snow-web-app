"use client";

import React, { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { CenterModal } from "@/components/modals/CenterModal";
import { Button } from "@/components/ui/Button";

export interface NetworkType {
  id: string; // mtn, airtel, glo, mobile9
  name: string;
  logo: string;
}

export const networkTypes: NetworkType[] = [
  { id: "mtn", name: "MTN", logo: "mtn" },
  { id: "airtel", name: "Airtel", logo: "airtel" },
  { id: "glo", name: "Glo", logo: "glo" },
  { id: "mobile9", name: "9Mobile", logo: "mobile9" },
];

export const networkMapping = [
  { regex: /^(0702|0704|0803|0806|0703|0706|0813|0816|0810|0814|0903|0906|0913)/, name: "mtn" },
  { regex: /^(0805|0807|0705|0815|0811|0905)/, name: "glo" },
  { regex: /^(0802|0808|0708|0812|0701|0901|0902|0907|0912)/, name: "airtel" },
  { regex: /^(0809|0818|0817|0908|0909)/, name: "mobile9" }, // Map 9mobile to mobile9 for AppIcon
];

interface NetworkSelectorProps {
  selectedNetwork: string;
  onChange: (networkId: string) => void;
  phoneNumber: string;
  grid?: boolean;
}

export function NetworkSelector({
  selectedNetwork,
  onChange,
  phoneNumber,
  grid = false,
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState("");
  const [pendingNetwork, setPendingNetwork] = useState("");

  // Network Auto-Detection based on Phone Number
  useEffect(() => {
    if (phoneNumber.length >= 4) {
      const match = networkMapping.find((n) => n.regex.test(phoneNumber));
      if (match) {
        setDetectedNetwork(match.name);
        // Automatically switch network if not already selected
        if (selectedNetwork !== match.name) {
          onChange(match.name);
        }
      } else {
        setDetectedNetwork("");
      }
    }
  }, [phoneNumber, onChange, selectedNetwork]);

  const handleNetworkSelect = (networkId: string) => {
    setIsOpen(false);
    
    // Check for mismatch
    if (phoneNumber.length >= 4) {
      const match = networkMapping.find((n) => n.regex.test(phoneNumber));
      if (match && match.name !== networkId) {
        setDetectedNetwork(match.name);
        setPendingNetwork(networkId);
        setShowMismatchModal(true);
        return;
      }
    }
    
    onChange(networkId);
  };

  const confirmMismatch = () => {
    onChange(pendingNetwork);
    setShowMismatchModal(false);
  };

  const activeNetwork = networkTypes.find((n) => n.id === selectedNetwork) || networkTypes[0];

  if (grid) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
          Select Network Operator
        </label>
        <div className="grid grid-cols-4 gap-3">
          {networkTypes.map((p) => {
            const isSelected = selectedNetwork === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleNetworkSelect(p.id)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none
                  ${
                    isSelected
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-border-light dark:border-border-dark hover:bg-light-100 dark:hover:bg-dark-700"
                  }
                `}
              >
                <AppIcon name={p.logo} size={32} />
                <span className="text-[10px] font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-1">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Network Mismatch Confirmation Modal */}
        <CenterModal visible={showMismatchModal} onClose={() => setShowMismatchModal(false)} title="Network Mismatch">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-12 h-12 rounded-full bg-warning-500/10 flex items-center justify-center text-warning-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Network Mismatch Warning
              </h4>
              <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-2">
                You entered a number that looks like{" "}
                <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark uppercase">
                  {detectedNetwork}
                </span>
                , but selected{" "}
                <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark uppercase">
                  {pendingNetwork}
                </span>
                . Are you sure you want to continue?
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowMismatchModal(false)}>
                Recheck
              </Button>
              <Button type="button" fullWidth onClick={confirmMismatch}>
                Continue
              </Button>
            </div>
          </div>
        </CenterModal>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-light-100 dark:bg-dark-600 px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark cursor-pointer text-text-primary-light dark:text-text-primary-dark"
      >
        <AppIcon name={activeNetwork.logo} size={20} />
        <span className="text-b3 font-primary-semibold">{activeNetwork.name}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-48 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1">
            {networkTypes.map((network) => (
              <button
                key={network.id}
                type="button"
                onClick={() => handleNetworkSelect(network.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-light-100 dark:hover:bg-dark-700 transition-colors w-full cursor-pointer text-text-primary-light dark:text-text-primary-dark ${
                  selectedNetwork === network.id ? "bg-primary-500/10 text-primary-500" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AppIcon name={network.logo} size={24} />
                  <span className="text-b2 font-primary-medium">{network.name}</span>
                </div>
                {selectedNetwork === network.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Network Mismatch Confirmation Modal */}
      <CenterModal visible={showMismatchModal} onClose={() => setShowMismatchModal(false)} title="Network Mismatch">
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-12 h-12 rounded-full bg-warning-500/10 flex items-center justify-center text-warning-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Network Mismatch Warning
            </h4>
            <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-2">
              You entered a number that looks like{" "}
              <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark uppercase">
                {detectedNetwork}
              </span>
              , but selected{" "}
              <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark uppercase">
                {pendingNetwork}
              </span>
              . Are you sure you want to continue?
            </p>
          </div>
          <div className="flex gap-4 w-full">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowMismatchModal(false)}>
              Recheck
            </Button>
            <Button type="button" fullWidth onClick={confirmMismatch}>
              Continue
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
