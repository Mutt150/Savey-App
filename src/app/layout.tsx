import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Savey - Save more, worry less",
  description: "Catat keuangan dengan gaya!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      {/* Tambahkan suppressHydrationWarning di sini agar tidak terjadi bentrok dengan Ekstensi Browser */}
      <body className={nunito.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}