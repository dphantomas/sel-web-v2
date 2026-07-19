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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      courseInstance: { select: { id: true, startDate: true, course: { select: { title: true } } } },
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      meetings: {
        orderBy: { date: "desc" },
        include: { _count: { select: { records: true } }, records: { where: { status: "Presente" }, select: { id: true, userId: true } } },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, courseId, courseInstanceId } = body;

  try {
    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(courseInstanceId !== undefined && { courseInstanceId: courseInstanceId || null }),
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error actualizando grupo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ message: "Grupo eliminado" });
  } catch (error) {
    console.error("Error eliminando grupo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
