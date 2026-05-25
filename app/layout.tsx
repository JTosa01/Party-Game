import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import BackgroundMusic from "@/components/BackgroundMusic/BackgroundMusic";
import DevBroadcast from "@/components/DevBroadcast/DevBroadcast";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next"

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
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <GameProvider>
            {children}
            <DevBroadcast />
            <BackgroundMusic />
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
