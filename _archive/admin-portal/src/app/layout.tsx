import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Deeprastore OS V2 - Admin Portal",
  description: "Luxury Storefront Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}