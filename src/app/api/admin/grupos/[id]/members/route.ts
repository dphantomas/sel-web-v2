import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    return null;
  }
  return session;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Falta el usuario" }, { status: 400 });
  }

  try {
    const member = await prisma.groupMember.create({
      data: { groupId: id, userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Esa persona ya está en el grupo" }, { status: 400 });
    }
    console.error("Error agregando miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
