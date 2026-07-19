import type { Metadata } from "next";
import { Mona_Sans, Manrope } from "next/font/google";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/context/ToastProvider";
import { ReduxProvider } from "@/providers/ReduxProvider";
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
      </body>
    </html>
  );
}
