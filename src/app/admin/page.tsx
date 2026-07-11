import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, BookOpen, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  const [postCount, courseCount, userCount] = await Promise.all([
    prisma.post.count(),
    prisma.course.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
        Hola, {session?.user?.firstName || 'Admin'}
      </h1>
      <p className="text-zinc-500 mb-8">Bienvenido al panel de control de DGG Master.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-blue-600 dark:text-blue-400">
            <FileText className="w-6 h-6" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Artículos</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{postCount}</p>
          <Link href="/admin/blog" className="text-sm font-medium text-blue-600 hover:underline">
            Gestionar Blog &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Cursos</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{courseCount}</p>
          <Link href="/admin/cursos" className="text-sm font-medium text-blue-600 hover:underline">
            Gestionar Cursos &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-purple-600 dark:text-purple-400">
            <Users className="w-6 h-6" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Usuarios</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{userCount}</p>
          <Link href="/admin/usuarios" className="text-sm font-medium text-blue-600 hover:underline">
            Gestionar Usuarios &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
