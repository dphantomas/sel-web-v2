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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { date, notes } = body;

  if (!date) {
    return NextResponse.json({ error: "Falta la fecha del encuentro" }, { status: 400 });
  }

  try {
    const meeting = await prisma.meeting.create({
      data: { groupId: id, date: new Date(date), notes: notes || null },
    });
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creando encuentro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
