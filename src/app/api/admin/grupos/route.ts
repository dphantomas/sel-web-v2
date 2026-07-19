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

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      course: { select: { id: true, title: true } },
      courseInstance: { select: { id: true, startDate: true, course: { select: { title: true } } } },
      _count: { select: { members: true, meetings: true } },
      meetings: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
    },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, courseId, courseInstanceId } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Falta el nombre del grupo" }, { status: 400 });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || null,
        courseId: courseId || null,
        courseInstanceId: courseInstanceId || null,
      },
    });

    // Grupo ligado a un curso o instancia: se precarga con los participantes
    // que ya tienen acceso. Después el admin puede sumar o sacar gente a mano
    // desde la página del grupo, sin que quede "atado" a esta lista inicial.
    let initialUserIds: string[] = [];
    if (group.courseInstanceId) {
      const accesses = await prisma.userInstanceAccess.findMany({
        where: { courseInstanceId: group.courseInstanceId },
        select: { userId: true },
      });
      initialUserIds = accesses.map((a) => a.userId);
    } else if (group.courseId) {
      const accesses = await prisma.userCourseAccess.findMany({
        where: { courseId: group.courseId },
        select: { userId: true },
      });
      initialUserIds = accesses.map((a) => a.userId);
    }

    if (initialUserIds.length > 0) {
      await prisma.groupMember.createMany({
        data: initialUserIds.map((userId) => ({ groupId: group.id, userId })),
        skipDuplicates: true,
      });
    }

    const groupWithCounts = await prisma.group.findUniqueOrThrow({
      where: { id: group.id },
      include: { _count: { select: { members: true, meetings: true } } },
    });

    return NextResponse.json(groupWithCounts, { status: 201 });
  } catch (error) {
    console.error("Error creando grupo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
