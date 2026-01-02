// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import YandexMapsProvider from "@/components/YandexMapsProvider";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from '@/context/FavoritesContext';
import { Header } from '@/components/Header';
import Link from "next/link";
import VersionDisplay from "@/components/VersionDisplay";
import YandexMetrika from "@/components/YandexMetrika";
import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "s-lot.ru - поиск и анализ лотов с торгов по банкротству",
  description: "сайт-агрегатор торгов по банкротству, аукционы России, публичные предложения, выгодные лоты",
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
          <FavoritesProvider>
            <Suspense fallback={<div style={{ height: '60px' }} />}>
              <Header />
            </Suspense>

            <YandexMapsProvider>{children}</YandexMapsProvider>

            {/* --- ФУТЕР --- */}
            <footer className="footer">
              <div className="footer-container">
                <p>
                  s-lot.ru — сервис для поиска и анализа лотов с торгов по банкротству. Вся информация собирается из открытых официальных источников.
                </p>
                <p>
                  Используя сервис, вы соглашаетесь с <Link href="/agreement">Пользовательским соглашением</Link> и <Link href="/privacy">Политикой конфиденциальности</Link>.
                  Оплачивая услуги, вы принимаете <Link href="/terms">Публичную оферту</Link>.
                </p>
                <p>
                  ИП Степанов Дмитрий Александрович | Email: <a href="mailto:info@s-lot.ru">info@s-lot.ru</a>
                </p>
                <VersionDisplay />
                <nav>
                  <Link href="/subscribe" className="footer-link">Тарифы</Link>
                  {/* <Link href="/terms" className="footer-link">Публичная оферта</Link> */}
                  <Link href="/requisites" className="footer-link">Реквизиты</Link>
                </nav>
              </div>
            </footer>
          </FavoritesProvider>
        </AuthProvider>

        <Suspense fallback={<></>}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}
