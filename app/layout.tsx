import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader } from "next/font/google";

import "./globals.css";

// Fraunces for the headwords: a soft serif with enough character to carry a
// page whose whole content is single words. Newsreader for everything read in
// sentences, which is most of it.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Español",
  description: "Cinco mil palabras, una cada día.",
};

// Stated explicitly rather than left to the framework: this is used on a phone.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${newsreader.variable}`}>
      <body className="antialiased">
        <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
