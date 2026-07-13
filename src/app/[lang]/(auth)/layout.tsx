import AuthProvider from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";

/**
 * Layout específico para las páginas de auth.
 * Sin <Footer> para que el fondo cubra 100% de la pantalla.
 * El <main> usa flex-1 para ocupar toda la altura restante tras el nav fijo.
 * Las páginas internas usan flex-1 (no min-h-screen) para no duplicar altura.
 */
export default async function AuthLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <AuthProvider session={null}>
      <Header lang={lang} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </AuthProvider>
  );
}
