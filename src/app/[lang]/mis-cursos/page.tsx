import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MisTalleresView from "@/components/dashboard/MisTalleresView";

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    const urlBase = lang === 'es' ? '' : `/${lang}`;
    redirect(`${urlBase}/login?callbackUrl=${urlBase}/mis-cursos`);
  }

  // Obtener el usuario y sus instancias desbloqueadas
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      unlockedInstances: {
        include: {
          courseInstance: {
            include: {
              course: true
            }
          }
        },
        orderBy: {
          courseInstance: { startDate: 'desc' }
        }
      }
    }
  });

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed pt-28 pb-16 px-4 md:px-6"
      style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header del Panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-[#33275f] text-2xl md:text-3xl font-bold mt-1">
              Hola, {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Rol: <strong className="text-[#B681AE]">{user.role}</strong>
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12">
          <MisTalleresView instances={user.unlockedInstances} lang={lang} />
        </div>

      </div>
    </div>
  );
}
