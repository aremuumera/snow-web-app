"use client";

import React, { useState, useEffect } from "react";
import { useDrawer } from "@/context/DrawerContext";
import { useAppSelector } from "@/redux/store";
import { useGetCrptoNetworkQuery, useGenerateWalletMutation } from "@/redux/crypto/crypto_api";
import { useToast } from "@/context/ToastProvider";
import { ProviderSelector, ProviderItem } from "./shared/ProviderSelector";
import { ProcessingLoader } from "./shared/ProcessingLoader";
import { ChevronDown, Copy, Check, Info, ArrowLeft, RefreshCw } from "lucide-react";

import QRCode from "react-qr-code";

export function SellCryptoService() {
  const { showToast } = useToast();
  const { drawerData } = useDrawer();

  const { data: cryptoData, isLoading: isLoadingNetworks, isError, error } = useGetCrptoNetworkQuery({});
  const [generateWallet, { isLoading: isGenerating }] = useGenerateWalletMutation();

  // Form states
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null); // { symbol, name, networks }
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null); // { networkCode, networkName, minimumDeposit }
  
  // Wallet state
  const [generatedAddress, setGeneratedAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const qrCardRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPicture = async () => {
    if (!qrCardRef.current) return;
    try {
      showToast("Generating image for download...", "info");
      const { toPng } = await import("html-to-image");
      
      const element = qrCardRef.current;
      const computedBgColor = window.getComputedStyle(element).backgroundColor;
      
      const dataUrl = await toPng(element, {
        backgroundColor: computedBgColor || "#0C0C0C",
        style: {
          borderRadius: "24px"
        }
      });
      
      const link = document.createElement("a");
      link.download = `${selectedCrypto?.symbol || "crypto"}_deposit_address.png`;
      link.href = dataUrl;
      link.click();
      showToast("Deposit picture downloaded!", "success");
    } catch (err) {
      showToast("Failed to generate picture", "error");
      console.error(err);
    }
  };

  // Modals state
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const paramSymbol = drawerData?.symbol;

  // Auto-prefill selected crypto from query parameters
  useEffect(() => {
    if (cryptoData?.all_addresses?.data && paramSymbol) {
      const rawData = cryptoData.all_addresses.data;
      const matchedSymbol = Object.keys(rawData).find(
        (s) => s.toLowerCase() === paramSymbol.toLowerCase()
      );
      if (matchedSymbol) {
        const coinData = rawData[matchedSymbol];
        setSelectedCrypto({
          symbol: matchedSymbol,
          name: coinData.currencyName || matchedSymbol,
          networks: coinData.networks || [],
          image: coinData.image || "",
        });
      }
    }
  }, [cryptoData, paramSymbol]);

  // Handle API errors
  useEffect(() => {
    if (isError) {
      showToast((error as any)?.data?.message || "Failed to load crypto networks.", "error");
    }
  }, [isError, error, showToast]);

  const handleCopy = () => {
    if (!generatedAddress) return;
    navigator.clipboard.writeText(generatedAddress);
    setCopied(true);
    showToast("Wallet address copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrypto || !selectedNetwork) {
      showToast("Please select both crypto and network", "warning");
      return;
    }

    try {
      const response = await generateWallet({
        data: {
          currency: selectedCrypto.symbol,
          network: selectedNetwork.networkCode,
        },
      }).unwrap();

      if (response.status === "success" || response.address) {
        setGeneratedAddress(response.address);
        showToast(response.message || "Wallet address generated successfully", "success");
      } else {
        showToast(response.message || "Failed to generate wallet address", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to generate deposit address.";
      showToast(errMsg, "error");
    }
  };

  // Map backend cryptos to list
  const cryptoList: ProviderItem[] = React.useMemo(() => {
    const rawData = cryptoData?.all_addresses?.data || {};
    return Object.keys(rawData).map((symbol) => ({
      id: symbol,
      name: `${rawData[symbol].name || symbol} (${symbol})`,
      logo: symbol.toLowerCase(), // fallback
      image: rawData[symbol].image || "", // priority API image
    }));
  }, [cryptoData]);

  const networkList: ProviderItem[] = React.useMemo(() => {
    if (!selectedCrypto) return [];
    return selectedCrypto.networks.map((n: any) => ({
      id: n.networkCode,
      name: `${n.networkName} (${n.networkCode})`,
    }));
  }, [selectedCrypto]);

  const nairaRate = cryptoData?.all_addresses?.naira_rate || 0;

  if (generatedAddress) {
    const cryptoLogoUrl = selectedCrypto.image || cryptoData?.all_addresses?.data?.[selectedCrypto.symbol]?.image;

    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => setGeneratedAddress("")}
          className="flex items-center gap-2 text-b2 font-primary-bold text-primary-500 hover:text-primary-600 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Select different currency</span>
        </button>

        {/* QR Code and Address Card */}
        <div 
          ref={qrCardRef}
          className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-[#232323] p-6 rounded-[24px] flex flex-col items-center gap-6 text-center shadow-sm"
        >
          <div className="flex flex-col gap-1">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              {selectedCrypto.name || selectedCrypto.symbol} Address
            </h4>
            <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
              Send {selectedCrypto.symbol} to this wallet below or scan the QR code.
            </p>
          </div>

          {/* QR Code generator with centered logo overlay */}
          <div className="relative bg-white p-4 rounded-3xl border border-border-light dark:border-[#232323] flex items-center justify-center w-[212px] h-[212px] shadow-inner select-none">
            <QRCode
              size={180}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={generatedAddress}
              viewBox={`0 0 256 256`}
            />
            {/* Embedded Logo in the middle of QR Code */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full border border-border-light/20 flex items-center justify-center shadow-md">
              {cryptoLogoUrl ? (
                <img
                  src={cryptoLogoUrl}
                  alt={selectedCrypto.symbol}
                  className="w-9 h-9 rounded-full object-contain"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold font-primary-bold">
                  {selectedCrypto.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Address and details container */}
          <div className="w-full flex flex-col gap-3">
            {/* Network */}
            <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-2xl flex justify-between items-center text-left">
              <div>
                <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Network
                </p>
                <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                  {selectedNetwork.networkName}
                </p>
              </div>
            </div>

            {/* Deposit Address Box */}
            <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-2xl flex justify-between items-center text-left">
              <div className="flex-1 mr-3 min-w-0">
                <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Deposit Address
                </p>
                <p className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-0.5 break-all select-all selection:bg-primary-500/20">
                  {generatedAddress}
                </p>
              </div>
            </div>

            {/* Current Rate */}
            <div className="bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark p-4 rounded-2xl flex justify-between items-center text-left">
              <div>
                <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Current Rate
                </p>
                <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark mt-0.5 whitespace-nowrap">
                  $1 ~ ₦{Number(nairaRate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Row at Bottom */}
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={handleDownloadPicture}
            className="flex-1 h-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark hover:bg-light-100 dark:hover:bg-dark-800 transition-colors cursor-pointer select-none"
          >
            Download Picture
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 h-12 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all flex items-center justify-center text-b2 font-primary-bold text-white cursor-pointer select-none"
          >
            {copied ? "Copied!" : "Copy Address"}
          </button>
        </div>

        {/* Note Warnings */}
        <div className="bg-[#FFFCE8] dark:bg-[#1C1A09] border border-[#FFECA8] dark:border-[#2F2F12] p-4 rounded-[20px] flex gap-3 text-left">
          <Info className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 text-b3">
            <p className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Important Instructions:
            </p>
            <ul className="list-disc pl-4 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark flex flex-col gap-1">
              <li>Ensure the selected network ({selectedNetwork.networkName}) matches the network of the sending wallet exactly. Otherwise, funds will be permanently lost.</li>
              <li>Minimum deposit is {selectedNetwork.minimumDeposit || "0"} {selectedCrypto.symbol}.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleGenerate} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
        
        {/* Crypto Asset Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
            Select Cryptocurrency
          </label>
          <button
            type="button"
            onClick={() => setShowCryptoModal(true)}
            className="flex items-center justify-between w-full px-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
          >
            {selectedCrypto ? (
              <span className="font-primary-bold">
                {selectedCrypto.name} ({selectedCrypto.symbol})
              </span>
            ) : (
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                {isLoadingNetworks ? "Loading networks..." : "Choose cryptocurrency..."}
              </span>
            )}
            <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Network Selector */}
        {selectedCrypto && (
          <div className="flex flex-col gap-2">
            <label className="text-b2 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Select Blockchain Network
            </label>
            <button
              type="button"
              onClick={() => setShowNetworkModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 bg-light-50 dark:bg-dark-900 border border-border-light dark:border-border-dark rounded-2xl cursor-pointer text-b2 text-text-primary-light dark:text-text-primary-dark text-left"
            >
              {selectedNetwork ? (
                <span className="font-primary-bold">
                  {selectedNetwork.networkName} ({selectedNetwork.networkCode})
                </span>
              ) : (
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Choose network...</span>
              )}
              <ChevronDown className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedCrypto || !selectedNetwork}
          className="w-full h-14 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] transition-all rounded-full flex items-center justify-center text-b1 font-primary-bold text-white cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
        >
          Generate Wallet Address
        </button>
      </form>

      {/* Crypto Selector Modal */}
      <ProviderSelector
        visible={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        title="Select Crypto"
        providers={cryptoList}
        onSelect={(p) => {
          const rawData = cryptoData?.all_addresses?.data || {};
          const coinData = rawData[p.id];
          setSelectedCrypto({
            symbol: p.id,
            name: coinData.name || p.id,
            networks: coinData.networks || [],
          });
          setSelectedNetwork(null);
        }}
        selectedValue={selectedCrypto?.symbol}
        isLoading={isLoadingNetworks}
      />

      {/* Network Selector Modal */}
      <ProviderSelector
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        title="Select Network"
        providers={networkList}
        onSelect={(p) => {
          const net = selectedCrypto.networks.find((n: any) => n.networkCode === p.id);
          setSelectedNetwork(net);
        }}
        selectedValue={selectedNetwork?.networkCode}
      />

      {/* Processing loader */}
      <ProcessingLoader visible={isGenerating} message="Generating deposit address..." />
    </div>
  );
}
