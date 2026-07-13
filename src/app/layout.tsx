import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanación en Luz",
  description: "Sanación en Luz - Espacio de sanación y consciencia",
  icons: {
    icon: '/favicon.ico?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
