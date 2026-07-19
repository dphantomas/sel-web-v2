import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    return null;
  }
  return session;
}

// Suma como miembros nuevos a quienes ganaron acceso al curso/instancia
// después de que el grupo se creó (o de la última sincronización). No saca a
// nadie que haya perdido acceso: eso queda a criterio manual del admin. Los
// nuevos quedan con `joinedAt = ahora`, así que no van a figurar en
// encuentros anteriores a esta fecha (ver wasMemberAtMeeting en dateOnly.ts).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    select: { courseId: true, courseInstanceId: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }
  if (!group.courseId && !group.courseInstanceId) {
    return NextResponse.json({ error: "Este grupo no está ligado a un curso ni a una instancia" }, { status: 400 });
  }

  try {
    let accessUserIds: string[] = [];
    if (group.courseInstanceId) {
      const accesses = await prisma.userInstanceAccess.findMany({
        where: { courseInstanceId: group.courseInstanceId },
        select: { userId: true },
      });
      accessUserIds = accesses.map((a) => a.userId);
    } else if (group.courseId) {
      const accesses = await prisma.userCourseAccess.findMany({
        where: { courseId: group.courseId },
        select: { userId: true },
      });
      accessUserIds = accesses.map((a) => a.userId);
    }

    const existingMembers = await prisma.groupMember.findMany({ where: { groupId: id }, select: { userId: true } });
    const existingIds = new Set(existingMembers.map((m) => m.userId));
    const newUserIds = accessUserIds.filter((userId) => !existingIds.has(userId));

    if (newUserIds.length > 0) {
      await prisma.groupMember.createMany({
        data: newUserIds.map((userId) => ({ groupId: id, userId })),
        skipDuplicates: true,
      });
    }

    const newMembers = await prisma.groupMember.findMany({
      where: { groupId: id, userId: { in: newUserIds } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
    });

    return NextResponse.json({ addedCount: newUserIds.length, members: newMembers });
  } catch (error) {
    console.error("Error sincronizando grupo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
