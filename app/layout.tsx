// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import YandexMapsProvider from "@/components/YandexMapsProvider";
import { AuthProvider } from "@/context/AuthContext";

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
        <AuthProvider>
          {/* Используем наш компонент-обертку */}
          <YandexMapsProvider>{children}</YandexMapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
