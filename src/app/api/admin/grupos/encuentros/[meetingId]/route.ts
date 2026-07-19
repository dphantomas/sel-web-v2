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

export async function GET(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
      records: true,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Encuentro no encontrado" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { meetingId } = await params;
  const body = await req.json();
  const { date, notes } = body;

  try {
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });
    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error actualizando encuentro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requireAdmin();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { meetingId } = await params;

  try {
    await prisma.meeting.delete({ where: { id: meetingId } });
    return NextResponse.json({ message: "Encuentro eliminado" });
  } catch (error) {
    console.error("Error eliminando encuentro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
