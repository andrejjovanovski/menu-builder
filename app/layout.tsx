import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Import these for internationalization
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MenuCup",
  description: "Digital Menus, Poured to Perfection.",
};

// 2. Make the function 'async'
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // 3. Fetch messages and current locale on the server
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    // 4. Update the lang attribute to be dynamic
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 5. Wrap children in the Provider */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}