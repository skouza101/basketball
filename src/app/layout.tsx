import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Monoton, Lilita_One, Staatliches } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const monoton = Monoton({
  weight: "400",
  variable: "--font-monoton",
  subsets: ["latin"],
});

const lilitaOne = Lilita_One({
  weight: "400",
  variable: "--font-lilita-one",
  subsets: ["latin"],
});

const staatliches = Staatliches({
  weight: "400",
  variable: "--font-staatliches",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "skouza Morocco Showcase | Sleek Basketball E-Commerce",
  description:
    "An interactive, premium 3D design showcase for SLAM DUNK's special Moroccan edition basketballs. Customize your ball in real-time with vibrant Moroccan heritage tones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${monoton.variable} ${lilitaOne.variable} ${staatliches.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070707]">
        {/* Mobile / Tablet Overlay */}
        <div className="lg:hidden fixed inset-0 z-[10000] bg-[#070707] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 border-2 border-neutral-800 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-white/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide font-sans">
            DESKTOP ONLY
          </h2>
          <p className="text-sm text-neutral-400 max-w-[280px] leading-relaxed">
            This immersive 3D experience is optimized for larger screens. Please visit this website on a desktop or laptop device.
          </p>
        </div>

        {/* Main Application - Hidden on Mobile/Tablet */}
        <div className="hidden lg:flex flex-col flex-1 h-full min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
