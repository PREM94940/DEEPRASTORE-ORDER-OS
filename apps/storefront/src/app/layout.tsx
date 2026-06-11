import "./globals.css";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deeprastore Order OS",
  description: "Secure Checkout and Customer Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-zinc-50">
        {children}
      </body>
    </html>
  );
}
