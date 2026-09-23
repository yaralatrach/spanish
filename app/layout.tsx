import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Español",
  description: "Cinco mil palabras, una cada día.",
};

// Stated explicitly rather than relying on the framework default: the whole
// app is used on a phone, so the viewport is load-bearing.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900 antialiased">
        <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:px-5 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
