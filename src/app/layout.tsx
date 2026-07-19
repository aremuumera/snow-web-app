import type { Metadata } from "next";
import { Mona_Sans, Manrope } from "next/font/google";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/context/ToastProvider";
import { ReduxProvider } from "@/providers/ReduxProvider";
import Script from "next/script";
import "./globals.css";
import { app_config } from "@/utils/config";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${app_config.name} - Secure Gift Card & Crypto Trading`,
  description: "Trade gift cards and crypto assets instantly with the best rates and secure payments.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background-light dark:bg-background-dark font-sans text-text-primary-light dark:text-text-primary-dark">
        <ReduxProvider>
          <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
            <ThemeProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </ThemeProvider>
          </NextThemesProvider>
        </ReduxProvider>

        {/* Zoho SalesIQ Support Widget */}
        <Script id="zoho-init" strategy="afterInteractive">
          {`window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`}
        </Script>
        <Script
          id="zsiqscript"
          src="https://salesiq.zohopublic.com/widget?wc=siq00d91e7c1c7ffc56f63cb0ddf4ae0c27b61c20436c81761ef8eec23f655a025a"
          defer
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
