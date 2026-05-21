import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n/client";
import { loadMessagesWithFallback } from "@/lib/i18n/load-messages";
import { resolveLocale } from "@/lib/i18n/server";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Firmedware",
  description: "Lightweight law firm tracking for small firms",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const locale = await resolveLocale(session?.user?.id);
  const { messages, fallback } = await loadMessagesWithFallback(locale);

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <I18nProvider locale={locale} messages={messages} fallback={fallback}>
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
