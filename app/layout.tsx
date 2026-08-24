import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Bodoni } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heroSerif = Libre_Bodoni({
  variable: "--font-hero-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mister Fragrant",
  description: "Stay cool. Smell great.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${heroSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
