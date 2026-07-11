import "@/app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { LayoutDashboard, FileText, Settings, Users, ArrowLeft, GraduationCap } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard | DGG Master",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
            <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
              <Link href="/admin" className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg flex items-center justify-center text-sm">
                  DG
                </div>
                DGG Admin
              </Link>
            </div>
            
            <nav className="flex-1 py-6 px-4 space-y-1">
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/admin/cursos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <GraduationCap className="w-4 h-4" />
                Cursos
              </Link>
              <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Users className="w-4 h-4" />
                Usuarios
              </Link>
            </nav>
            
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver a la Web
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 md:hidden">
              <Link href="/admin" className="font-bold">DGG Admin</Link>
              <Link href="/" className="text-sm font-medium text-zinc-500">Volver a la Web</Link>
            </header>
            
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
    </>
  );
}
