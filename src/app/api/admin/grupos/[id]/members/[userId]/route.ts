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

// Fecha de alta al grupo: por defecto es el momento en que se agregó, pero
// hace falta poder corregirla a mano para cargar historial retroactivo (gente
// que ya participaba antes de que existiera este sistema).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, userId } = await params;
  const { joinedAt } = await req.json();

  if (!joinedAt) {
    return NextResponse.json({ error: "Falta la fecha de alta" }, { status: 400 });
  }

  try {
    const member = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId } },
      data: { joinedAt: new Date(joinedAt) },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
    });
    return NextResponse.json(member);
  } catch (error) {
    console.error("Error actualizando fecha de alta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, userId } = await params;

  try {
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    });
    return NextResponse.json({ message: "Miembro quitado del grupo" });
  } catch (error) {
    console.error("Error quitando miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
