// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import YandexMapsProvider from "@/components/YandexMapsProvider";
import { AuthProvider } from "@/context/AuthContext";
import Link from "next/link";

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

          {/* --- ФУТЕР --- */}
            <footer className="footer">
              <div className="footer-container">
                <p>© 2025 s-lot.ru. Все права защищены.</p>
                <nav>
                  <Link href="/subscribe" className="footer-link">Тарифы</Link>
                  <Link href="/terms" className="footer-link">Публичная оферта</Link>
                  <Link href="/requisites" className="footer-link">Реквизиты</Link>
                </nav>
              </div>
            </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
