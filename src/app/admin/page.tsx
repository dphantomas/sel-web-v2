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
      <h1 className="text-3xl font-bold tracking-tight text-sel-purple mb-2">
        Hola, {session?.user?.firstName || 'Admin'}
      </h1>
      <p className="text-sel-body mb-8">Bienvenido al panel de control de Sanación en Luz.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 blog-card">
          <div className="flex items-center gap-4 mb-4 text-sel-blue">
            <FileText className="w-6 h-6" />
            <h3 className="font-semibold text-sel-purple">Artículos</h3>
          </div>
          <p className="text-4xl font-bold text-sel-purple mb-2">{postCount}</p>
          <Link href="/admin/blog" className="text-sm font-medium text-sel-blue hover:underline">
            Gestionar Blog &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 blog-card">
          <div className="flex items-center gap-4 mb-4 text-sel-lavender">
            <BookOpen className="w-6 h-6" />
            <h3 className="font-semibold text-sel-purple">Cursos</h3>
          </div>
          <p className="text-4xl font-bold text-sel-purple mb-2">{courseCount}</p>
          <Link href="/admin/cursos" className="text-sm font-medium text-sel-blue hover:underline">
            Gestionar Cursos &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 blog-card">
          <div className="flex items-center gap-4 mb-4 text-sel-purple">
            <Users className="w-6 h-6" />
            <h3 className="font-semibold text-sel-purple">Usuarios</h3>
          </div>
          <p className="text-4xl font-bold text-sel-purple mb-2">{userCount}</p>
          <Link href="/admin/usuarios" className="text-sm font-medium text-sel-blue hover:underline">
            Gestionar Usuarios &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
