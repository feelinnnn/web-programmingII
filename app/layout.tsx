import type { Metadata } from "next";
import { Geist, Geist_Mono, Great_Vibes, Satisfy } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Providers from "./provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CookCult",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${greatVibes.variable} ${satisfy.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
