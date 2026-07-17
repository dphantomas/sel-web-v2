import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanación en Luz",
  description: "Sanación en Luz - Espacio de sanación y consciencia",
  // El icono lo genera automáticamente la convención de archivo
  // `src/app/favicon.ico` (Next agrega el <link rel="icon"> con un hash de
  // contenido que rompe la caché cuando cambian los bytes del .ico). No hace
  // falta declararlo acá: antes había además un `?v=2` manual que producía un
  // segundo <link rel="icon"> duplicado.
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
