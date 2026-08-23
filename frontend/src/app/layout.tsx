import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { LeagueProvider } from "@/context/LeagueContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Waiver WireTap | Quant Engine",
  description: "Advanced Fantasy Football Dynasty Analytics",
  themeColor: "#09090b",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Waiver WireTap | Quant Engine",
    description: "Advanced Fantasy Football Dynasty Analytics",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}>
        <ThemeProvider>
          <LeagueProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </LeagueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
