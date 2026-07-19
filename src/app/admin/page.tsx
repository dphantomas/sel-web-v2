import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, BookOpen, Users, Image as ImageIcon, Star, Quote, UsersRound } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  const [courseCount, userCount, postCount, galleryCount, reviewCount, phraseCount, groupCount] = await Promise.all([
    prisma.course.count(),
    prisma.user.count(),
    prisma.post.count(),
    prisma.galleryImage.count(),
    prisma.review.count(),
    prisma.homePhrase.count(),
    prisma.group.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-sel-purple dark:text-white mb-2">
        Hola, {session?.user?.firstName || 'Admin'}
      </h1>
      <p className="text-sel-body dark:text-zinc-400 mb-8">Bienvenido al panel de control de Sanación en Luz.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Cursos */}
        <Link href="/admin/cursos" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <BookOpen className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Cursos</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{courseCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Cursos &rarr;
            </span>
          </div>
        </Link>

        {/* Usuarios */}
        <Link href="/admin/usuarios" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <Users className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Usuarios</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{userCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Usuarios &rarr;
            </span>
          </div>
        </Link>

        {/* Artículos */}
        <Link href="/admin/blog" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <FileText className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Artículos</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{postCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Blog &rarr;
            </span>
          </div>
        </Link>

        {/* Galería */}
        <Link href="/admin/galeria" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <ImageIcon className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Galería</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{galleryCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Galería &rarr;
            </span>
          </div>
        </Link>

        {/* Reseñas */}
        <Link href="/admin/reviews" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <Star className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Reseñas</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{reviewCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Reseñas &rarr;
            </span>
          </div>
        </Link>

        {/* Grupos */}
        <Link href="/admin/grupos" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <UsersRound className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Grupos</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{groupCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Grupos &rarr;
            </span>
          </div>
        </Link>

        {/* Frases */}
        <Link href="/admin/frases" className="block group">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 blog-card h-full border border-transparent dark:border-zinc-800 transition-all hover:border-sel-purple/30 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4 text-sel-purple dark:text-zinc-300 group-hover:text-sel-blue transition-colors">
              <Quote className="w-6 h-6" />
              <h3 className="font-semibold text-sel-purple dark:text-white">Frases</h3>
            </div>
            <p className="text-4xl font-bold text-sel-purple dark:text-white mb-2">{phraseCount}</p>
            <span className="text-sm font-medium text-blue-600">
              Gestionar Frases &rarr;
            </span>
          </div>
        </Link>

      </div>
    </div>
  );
}
