import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import BackgroundMusic from "@/components/BackgroundMusic/BackgroundMusic";
import DevBroadcast from "@/components/DevBroadcast/DevBroadcast";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next"
import AdSenseScript from "@/components/AdSenseScript/AdSenseScript";
import AdSidebar from "@/components/AdSidebar/AdSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Impostor Game",
  description: "Play the Impostor game with your friends online",
  other: {
    "google-adsense-account": "ca-pub-6591949608570691",
  },
};

// Next.js now expects viewport configuration to be exported via `viewport`.
// Move the string-based viewport into the dedicated export to avoid warnings.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-adsense-account" content="ca-pub-6591949608570691" />
        <AdSenseScript />
      </head>
      <body className="min-h-full flex flex-row">
        <AdSidebar position="left" adSlot="1" />
        <AuthProvider>
          <GameProvider>
            <main className="flex-1 flex flex-col">
              {children}
              <DevBroadcast />
              <BackgroundMusic />
            </main>
          </GameProvider>
        </AuthProvider>
        <AdSidebar position="right" adSlot="2" />
      </body>
    </html>
  );
}
