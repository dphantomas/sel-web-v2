import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    return null;
  }
  return session;
}

const VALID_STATUSES = new Set<string>(Object.values(AttendanceStatus));

// Marca el estado de una persona en un encuentro (presente/tarde/muy
// tarde/ausente/se fue antes). Upsert: la fila de AttendanceRecord recién se
// crea la primera vez que se toca a esa persona.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { meetingId } = await params;
  const body = await req.json();
  const { userId, status } = body;

  if (!userId || typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Faltan datos (userId, status)" }, { status: 400 });
  }

  try {
    const record = await prisma.attendanceRecord.upsert({
      where: { meetingId_userId: { meetingId, userId } },
      update: { status: status as AttendanceStatus },
      create: { meetingId, userId, status: status as AttendanceStatus },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Error guardando asistencia:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Vuelve a "sin marcar": borra la fila de asistencia de esa persona en ese
// encuentro (distinto de marcarla "Ausente", que es una marca explícita).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { meetingId } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Falta el usuario" }, { status: 400 });
  }

  try {
    await prisma.attendanceRecord.deleteMany({ where: { meetingId, userId } });
    return NextResponse.json({ message: "Marca de asistencia borrada" });
  } catch (error) {
    console.error("Error borrando asistencia:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
