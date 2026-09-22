import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Español",
  description: "Cinco mil palabras, una cada día.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900 antialiased">
        <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
