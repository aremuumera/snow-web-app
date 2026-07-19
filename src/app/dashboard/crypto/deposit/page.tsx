"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGenerateWalletMutation, useGetCrptoNetworkQuery } from "@/redux/crypto/crypto_api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastProvider";
import { ArrowLeft, Copy, AlertCircle, Loader2, ChevronDown, X } from "lucide-react";

export default function CryptoDepositPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: cryptoData, isLoading: loadingCrypto } = useGetCrptoNetworkQuery({});
  const [generateWallet, { isLoading: isGenerating }] = useGenerateWalletMutation();

  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [address, setAddress] = useState("");

  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Transform crypto list from api
  const cryptoList = useMemo(() => {
    if (!cryptoData?.all_addresses?.data) return [];
    return Object.entries(cryptoData.all_addresses.data).map(([symbol, details]: [string, any]) => ({
      symbol,
      name: details.currencyName || symbol,
      image: details.image,
      networks: details.networks || [],
    }));
  }, [cryptoData]);

  // Network list derived from selected coin
  const networkList = useMemo(() => {
    if (!selectedCrypto) return [];
    return selectedCrypto.networks || [];
  }, [selectedCrypto]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrypto || !selectedNetwork) return;

    try {
      const response = await generateWallet({
        data: {
          coin: selectedCrypto.symbol.toUpperCase(),
          network: selectedNetwork.network || selectedNetwork,
        },
      }).unwrap();

      const generatedAddr = response?.address || response?.data?.address;
      if (generatedAddr) {
        setAddress(generatedAddr);
      } else {
        showToast(response?.message || "Failed to generate wallet address. Please check options.", "error");
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "An error occurred while generating the wallet address.";
      showToast(errMsg, "error");
    }
  };

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    showToast("Wallet address copied!", "success");
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Deposit Crypto
        </h3>
      </div>

      <form onSubmit={handleGenerate} className="bg-white dark:bg-[#111111] border border-border-light dark:border-[#232323] p-6 rounded-[24px] flex flex-col gap-5">
        {/* Select coin trigger button */}
        <div className="flex flex-col gap-1.5">
          <label className="text-b3 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
            Select Cryptocurrency
          </label>
          <button
            type="button"
            onClick={() => setShowCryptoModal(true)}
            className="w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-[#232323] px-4 py-3.5 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {selectedCrypto?.image ? (
                <img src={selectedCrypto.image} alt="" className="w-6 h-6 rounded-full object-contain" />
              ) : null}
              <span>{selectedCrypto ? `${selectedCrypto.name} (${selectedCrypto.symbol.toUpperCase()})` : "Choose coin"}</span>
            </div>
            <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
          </button>
        </div>

        {/* Select network trigger button */}
        <div className="flex flex-col gap-1.5">
          <label className="text-b3 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark">
            Select Network
          </label>
          <button
            type="button"
            disabled={!selectedCrypto}
            onClick={() => setShowNetworkModal(true)}
            className={`w-full flex items-center justify-between bg-light-50 dark:bg-black border border-border-light dark:border-[#232323] px-4 py-3.5 rounded-[20px] text-b2 font-primary-medium text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer ${
              !selectedCrypto ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span>{selectedNetwork?.network || selectedNetwork || "Choose network"}</span>
            <ChevronDown className="w-5 h-5 text-text-tertiary-light" />
          </button>
        </div>

        {!address && (
          <Button
            type="submit"
            fullWidth
            disabled={!selectedCrypto || !selectedNetwork || isGenerating}
            loading={isGenerating}
            className="h-14 rounded-full text-b1 font-primary-bold"
          >
            Generate Address
          </Button>
        )}
      </form>

      {/* Generated Address block */}
      {address && (
        <div className="bg-white dark:bg-[#111111] border border-border-light dark:border-[#232323] p-6 rounded-[24px] flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
              Deposit Wallet Address
            </span>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-light-50 dark:bg-black border border-border-light dark:border-[#232323] rounded-xl px-4 py-3 text-b3 font-mono text-text-primary-light dark:text-text-primary-dark outline-none select-all"
                value={address}
                readOnly
              />
              <Button onClick={handleCopy} className="h-12 px-4 rounded-xl">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-warning-500/10 border border-warning-500/20 p-4 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Send only {selectedCrypto?.symbol?.toUpperCase()} via {selectedNetwork?.network || selectedNetwork} to this deposit address. Sending any other coin or network asset may result in permanent loss.
            </p>
          </div>
        </div>
      )}

      {/* --- MODAL SELECTORS --- */}

      {/* Crypto Coin Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Crypto Currency
              </h4>
              <button onClick={() => setShowCryptoModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none">
              {loadingCrypto ? (
                <div className="py-12 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
              ) : cryptoList.length > 0 ? (
                cryptoList.map((coin: any) => (
                  <button
                    key={coin.symbol}
                    onClick={() => {
                      setSelectedCrypto(coin);
                      setSelectedNetwork(null);
                      setAddress("");
                      setShowCryptoModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                  >
                    {coin.image ? (
                      <img src={coin.image} alt="" className="w-8 h-8 rounded-full object-contain bg-light-100" />
                    ) : null}
                    <span className="uppercase">{coin.name} ({coin.symbol})</span>
                  </button>
                ))
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No cryptocurrencies found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0C0C] border border-border-light dark:border-[#232323] p-5 rounded-[30px] w-full max-w-md flex flex-col max-h-[85vh] shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-light dark:border-border-dark">
              <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                Choose Network
              </h4>
              <button onClick={() => setShowNetworkModal(false)} className="p-1 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-none">
              {networkList.length > 0 ? (
                networkList.map((net: any, idx: number) => {
                  const netVal = net.network || net;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedNetwork(net);
                        setAddress("");
                        setShowNetworkModal(false);
                      }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light dark:border-[#232323] hover:bg-light-75 dark:hover:bg-dark-800 text-left text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                    >
                      <span className="uppercase">{netVal}</span>
                    </button>
                  );
                })
              ) : (
                <p className="py-12 text-center text-b3 text-text-secondary-light">No networks found for this coin</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
