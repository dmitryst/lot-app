// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import YandexMapsProvider from "@/components/YandexMapsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "s-lot.ru",
  description: "Агрегатор торгов по банкротству",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {/* Используем наш компонент-обертку */}
        <YandexMapsProvider>{children}</YandexMapsProvider>
      </body>
    </html>
  );
}
