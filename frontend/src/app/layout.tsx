import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { LeagueProvider } from "@/context/LeagueContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DynastyBrain | Quant Engine",
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
          <div className="flex flex-col md:flex-row h-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
              {children}
            </main>
          </div>
        </LeagueProvider>
      </body>
    </html>
  );
}
