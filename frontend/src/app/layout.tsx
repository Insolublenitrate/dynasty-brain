import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { LeagueProvider } from "@/context/LeagueContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Waiver WireTap | Quant Engine",
  description: "Advanced Fantasy Football Dynasty Analytics & Tactical War Room",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dynasty Brain",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Waiver WireTap | Quant Engine",
    description: "Advanced Fantasy Football Dynasty Analytics & Tactical War Room",
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
