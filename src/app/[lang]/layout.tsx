import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import PasskeyPrompt from "@/components/auth/PasskeyPrompt";
import { RouteHistorySaver } from "@/components/layout/RouteHistorySaver";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <AuthProvider session={null}>
      <RouteHistorySaver />
      <Header lang={lang} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer lang={lang} />
      <PasskeyPrompt />
    </AuthProvider>
  );
}
