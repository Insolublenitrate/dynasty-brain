import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { LeagueProvider } from "@/context/LeagueContext";
import { ThemeProvider } from "@/context/ThemeContext";

const fontDisplay = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-display",
  display: "swap"
});

const fontSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap"
});

const fontMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap"
});

const fontCoach = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-coach",
  display: "swap"
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Blindside Dynasty — The Tactical Dynasty War Room",
  description: "Protect your roster. Blindside your league. High-stakes dynasty football quant engine, true power matrix, trade autopsies, and Coach Madden AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blindside Dynasty",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Blindside Dynasty — The Tactical Dynasty War Room",
    description: "Protect your roster. Blindside your league. High-stakes dynasty football quant engine, true power matrix, trade autopsies, and Coach Madden AI.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-clip w-full max-w-[100vw]">
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} ${fontCoach.variable} font-sans bg-zinc-950 text-zinc-100 antialiased overflow-x-clip w-full max-w-[100vw] min-w-0`}>
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
