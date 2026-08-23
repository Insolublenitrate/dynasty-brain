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
  title: "Waiver Wiretap | Quant & AI Dynasty War Room",
  description: "Tactical Fantasy Football Dynasty Analytics, Z-Score Power Tiers & Coach Madden AI War Room",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Waiver Wiretap",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Waiver Wiretap | Quant & AI Dynasty War Room",
    description: "Tactical Fantasy Football Dynasty Analytics, Z-Score Power Tiers & Coach Madden AI War Room",
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
