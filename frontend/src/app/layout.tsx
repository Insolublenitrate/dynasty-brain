import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import { LeagueProvider } from "@/context/LeagueContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waiver WireTap | Quant Engine",
  description: "Advanced Fantasy Football Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-200 h-screen overflow-hidden`}>
        <LeagueProvider>
          <div className="flex flex-col h-full bg-slate-950">
            <TopNav />
            <main className="flex-1 overflow-y-auto relative">
              {children}
            </main>
          </div>
        </LeagueProvider>
      </body>
    </html>
  );
}
