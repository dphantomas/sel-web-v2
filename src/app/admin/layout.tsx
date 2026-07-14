import "@/app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { LayoutDashboard, FileText, Users, ArrowLeft, GraduationCap, Image as ImageIcon, Star } from "lucide-react";
import ThemeToggle from "@/components/admin/ThemeToggle";

export const metadata = {
  title: "Admin Panel | Sanación en Luz",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <>
      {/* Sidebar - fixed a la ventana del navegador */}
      <aside
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '16rem', zIndex: 40 }}
        className="hidden md:flex flex-col bg-white border-r border-sel-lavender/30 font-sans text-sel-body dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 transition-colors"
      >
        <div className="py-5 flex flex-col px-6 border-b border-sel-lavender/30 flex-shrink-0 dark:border-zinc-800">
          <Link href="/admin" className="font-bold text-lg tracking-tight text-sel-purple flex items-center gap-2 dark:text-white mb-3">
            <div className="w-8 h-8 bg-sel-purple text-white rounded-lg flex items-center justify-center text-sm font-bold dark:bg-white dark:text-zinc-900">
              SL
            </div>
            Sanación Admin
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-sel-body hover:text-sel-purple dark:text-zinc-400 dark:hover:text-white transition-colors ml-10">
            <ArrowLeft className="w-4 h-4" />
            Volver a la Web
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="my-2 border-b border-sel-lavender/30 dark:border-zinc-800"></div>
          <div className="flex flex-col space-y-1 ml-3">
            <Link href="/admin/cursos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
              <GraduationCap className="w-4 h-4" />
              Cursos
            </Link>
            <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
              <Users className="w-4 h-4" />
              Usuarios
            </Link>
            <Link href="/admin/blog" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
              Artículos
            </Link>
            <Link href="/admin/galeria" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
              <ImageIcon className="w-4 h-4" />
              Galería
            </Link>
            <Link href="/admin/reviews" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
              <Star className="w-4 h-4" />
              Reseñas
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t border-sel-lavender/30 flex-shrink-0 dark:border-zinc-800 flex justify-center">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{ marginLeft: '16rem', minHeight: '100vh' }}
        className="bg-sel-cream font-sans text-sel-body dark:bg-zinc-950 dark:text-zinc-300 transition-colors"
      >
        <header className="h-16 bg-white border-b border-sel-lavender/30 flex items-center justify-between px-8 md:hidden flex-shrink-0 dark:bg-zinc-900 dark:border-zinc-800">
          <Link href="/admin" className="font-bold text-sel-purple dark:text-white">Sanación Admin</Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-sel-body hover:text-sel-purple dark:text-zinc-400 dark:hover:text-white">Volver a la Web</Link>
          </div>
        </header>
        
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
