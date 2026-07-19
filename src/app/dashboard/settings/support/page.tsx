"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { ArrowLeft, MessageSquare, Mail, Globe, ChevronRight, MessageCircle, HelpCircle } from "lucide-react";
import { app_config } from "@/utils/config";

// Inline Custom SVGs for platforms not in standard Lucide version
const XIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TiktokIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const WhatsappIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436.002 9.858-4.417 9.86-9.858.002-2.637-1.01-5.11-2.848-6.95C16.638 1.956 14.17 1.04 11.536 1.04c-5.434 0-9.856 4.418-9.858 9.86-.001 1.81.473 3.58 1.378 5.127l-.926 3.38 3.468-.91c1.5.82 3.1 1.25 4.7 1.25h.004v-.001zm10.74-7.616c-.292-.146-1.73-.854-1.997-.951-.267-.097-.461-.146-.656.146-.195.292-.756.951-.926 1.146-.17.195-.341.219-.633.073-.292-.146-1.236-.456-2.355-1.455-.87-.777-1.458-1.737-1.628-2.03-.17-.292-.018-.45.129-.595.132-.131.292-.341.439-.512.146-.17.195-.292.292-.487.097-.195.049-.365-.024-.512-.073-.146-.656-1.584-.899-2.169-.236-.569-.475-.491-.653-.5-.17-.008-.364-.01-.558-.01-.195 0-.511.073-.779.365-.268.292-1.022.999-1.022 2.435 0 1.437 1.046 2.825 1.192 3.02.146.195 2.059 3.144 4.986 4.407.696.3 1.24.48 1.664.614.7.22 1.338.19 1.843.114.562-.08 1.73-.707 1.974-1.389.243-.683.243-1.267.17-1.39-.073-.12-.267-.194-.559-.34z"/>
  </svg>
);

export default function SupportPage() {
  const router = useRouter();
  const authUser = useAppSelector((state: any) => state.auth.user);
  const profile = authUser?.profile || {};

  const whatsappNumber = profile?.app_whatsapp || app_config.whatsapp;
  const emailAddress = profile?.app_email || app_config.email;

  const whatsappClean = whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappClean}`;
  const emailUrl = `mailto:${emailAddress}`;

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const handleStartZoho = () => {
    if (typeof window === "undefined") return;
    const widgetCode = process.env.NEXT_PUBLIC_ZOHO_WIDGET_CODE || "siq00d91e7c1c7ffc56f63cb0ddf4ae0c27b61c20436c81761ef8eec23f655a025a";
    
    if (document.getElementById("zsiqscript")) {
      const zoho = (window as any).$zoho;
      if (zoho?.salesiq?.chat?.start) {
        try {
          zoho.salesiq.chat.start();
        } catch (e) {
          console.error("Zoho error on start:", e);
        }
      }
      return;
    }

    (window as any).$zoho = (window as any).$zoho || {};
    (window as any).$zoho.salesiq = (window as any).$zoho.salesiq || {
      widgetcode: widgetCode,
      values: {},
      ready: function () {
        if ((window as any).$zoho.salesiq.floatwindow?.visible) {
          (window as any).$zoho.salesiq.floatwindow.visible("hide");
        }
        if ((window as any).$zoho.salesiq.chat?.start) {
          try {
            (window as any).$zoho.salesiq.chat.start();
          } catch (e) {
            console.error("Zoho error on start:", e);
          }
        }
      },
    };

    const d = document;
    const s = d.createElement("script");
    s.type = "text/javascript";
    s.id = "zsiqscript";
    s.defer = true;
    s.src = `https://salesiq.zohopublic.com/widget?wc=${widgetCode}`;
    const t = d.getElementsByTagName("script")[0];
    if (t && t.parentNode) {
      t.parentNode.insertBefore(s, t);
    } else {
      d.body.appendChild(s);
    }
  };

  const socialChannels = [
    {
      label: "X (Twitter)",
      value: profile?.twitter ? `@${profile.twitter}` : app_config.twitterHandle,
      icon: <XIcon className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" />,
      action: () => handleOpenUrl(profile?.twitter || app_config.twitter),
    },
    {
      label: "Instagram",
      value: profile?.instagram ? `@${profile.instagram}` : app_config.instagramHandle,
      icon: <InstagramIcon className="w-5 h-5 text-[#E1306C]" />,
      action: () => handleOpenUrl(profile?.instagram || app_config.instagram),
    },
    {
      label: "Facebook",
      value: profile?.facebook || app_config.name,
      icon: <FacebookIcon className="w-5 h-5 text-[#1877F2]" />,
      action: () => handleOpenUrl(profile?.facebook || `https://facebook.com/${app_config.name.toLowerCase()}`),
    },
    {
      label: "TikTok",
      value: profile?.tiktok || `@${app_config.name.toLowerCase()}`,
      icon: <TiktokIcon className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" />,
      action: () => handleOpenUrl(profile?.tiktok || `https://tiktok.com/@${app_config.name.toLowerCase()}`),
    },
    {
      label: "Website",
      value: profile?.website || app_config.websiteHandle,
      icon: <Globe className="w-5 h-5 text-primary-500" />,
      action: () => handleOpenUrl(profile?.website || app_config.website),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-light-75 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Support
        </h3>
      </div>

      {/* Header Info summary with headphone badge layout */}
      <div className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-6 rounded-[24px] flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-light-100 dark:bg-dark-700 border-2 border-primary-500 flex items-center justify-center text-primary-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            We are here to help
          </h4>
          <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark max-w-xs mx-auto">
            Tell us what went wrong and we will fix it
          </p>
        </div>
      </div>

      {/* Quick Actions 2-Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* WhatsApp Card */}
        <button
          type="button"
          onClick={() => handleOpenUrl(whatsappUrl)}
          className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-5 rounded-[20px] text-left hover:bg-light-75 dark:hover:bg-dark-700 transition-colors flex flex-col justify-between min-h-[140px] shadow-xs cursor-pointer"
        >
          <div className="flex justify-between items-start w-full">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-2xl flex items-center justify-center">
              <WhatsappIcon className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark mt-1" />
          </div>
          <div className="mt-4">
            <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Contact support
            </h5>
            <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
              {whatsappNumber}
            </p>
          </div>
        </button>

        {/* Live Chat Card */}
        <button
          type="button"
          onClick={handleStartZoho}
          className="bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] p-5 rounded-[20px] text-left hover:bg-light-75 dark:hover:bg-dark-700 transition-colors flex flex-col justify-between min-h-[140px] shadow-xs cursor-pointer"
        >
          <div className="flex justify-between items-start w-full">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark mt-1" />
          </div>
          <div className="mt-4">
            <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Live chat
            </h5>
            <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              Instant chat with us
            </p>
          </div>
        </button>
      </div>

      {/* Send us an Email card row */}
      <button
        type="button"
        onClick={() => handleOpenUrl(emailUrl)}
        className="w-full flex items-center justify-between p-5 bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[24px] hover:bg-light-75 dark:hover:bg-dark-700 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Send us an email
            </h5>
            <p className="text-b3 font-primary-semibold text-text-secondary-light dark:text-text-secondary-dark truncate">
              {emailAddress}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
      </button>

      {/* Safety warnings context info */}
      <p className="text-b3 font-primary-regular text-text-disabled-light dark:text-text-disabled-dark px-2 leading-relaxed">
        Make sure to follow/chat us from here as to avoid chatting with wrong support channel.
      </p>

      {/* Social channels lists */}
      <div className="flex flex-col gap-2 bg-white dark:bg-dark-800 border border-border-light dark:border-[#232323] rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
        {socialChannels.map((channel, idx) => (
          <button
            key={idx}
            type="button"
            onClick={channel.action}
            className="w-full flex items-center justify-between p-4 hover:bg-light-75 dark:hover:bg-dark-700/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-light-50 dark:bg-dark-900 border border-border-light dark:border-[#232323] flex items-center justify-center shrink-0">
                {channel.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                  {channel.label}
                </h5>
                <p className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark truncate">
                  {channel.value}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
          </button>
        ))}
      </div>
    </div>
  );
}
