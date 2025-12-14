import type { Metadata } from "next";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
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
  title: "Bug Battle Arena - Master Frontend Debugging",
  description:
    "Master frontend debugging by fixing real-world broken projects in a browser-based sandbox environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Enable React Strict Mode for development best practices */}
        <React.StrictMode>
          <AuthProvider>{children}</AuthProvider>
        </React.StrictMode>
      </body>
    </html>
  );
}
