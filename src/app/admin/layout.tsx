import "@/app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { LayoutDashboard, FileText, Users, ArrowLeft, GraduationCap, Image as ImageIcon } from "lucide-react";

export const metadata = {
  title: "Admin Panel | Sanación en Luz",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <>
        <div className="min-h-screen bg-sel-cream flex font-sans text-sel-body">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-sel-lavender/30 flex flex-col hidden md:flex">
            <div className="h-16 flex items-center px-6 border-b border-sel-lavender/30">
              <Link href="/admin" className="font-bold text-lg tracking-tight text-sel-purple flex items-center gap-2">
                <div className="w-8 h-8 bg-sel-purple text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  SL
                </div>
                Sanación Admin
              </Link>
            </div>
            
            <nav className="flex-1 py-6 px-4 space-y-1">
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/admin/cursos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors">
                <GraduationCap className="w-4 h-4" />
                Cursos
              </Link>
              <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors">
                <Users className="w-4 h-4" />
                Usuarios
              </Link>
              <Link href="/admin/blog" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors">
                <FileText className="w-4 h-4" />
                Artículos
              </Link>
              <Link href="/admin/galeria" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors">
                <ImageIcon className="w-4 h-4" />
                Galería
              </Link>
            </nav>
            
            <div className="p-4 border-t border-sel-lavender/30">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:text-sel-purple transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver a la Web
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white border-b border-sel-lavender/30 flex items-center justify-between px-8 md:hidden">
              <Link href="/admin" className="font-bold text-sel-purple">Sanación Admin</Link>
              <Link href="/" className="text-sm font-medium text-sel-body hover:text-sel-purple">Volver a la Web</Link>
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
