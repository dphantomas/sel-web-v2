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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&family=Open+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
