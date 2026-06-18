import type { Metadata } from "next";
import { Chakra_Petch, VT323 } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/UserContext";

const chakraPetch = Chakra_Petch({
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  variable: "--font-chakra-petch",
});

const vt323 = VT323({
  weight: ['400'],
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "Fantasy Football Oracle",
  description: "Your Gen 2 Fantasy Football Dashboard powered by John Madden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-athletic">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
