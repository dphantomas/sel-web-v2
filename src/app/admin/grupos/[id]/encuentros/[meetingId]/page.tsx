import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AttendanceSheet from "@/components/admin/AttendanceSheet";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage({ params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    redirect("/admin");
  }

  const { id, meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
      records: true,
    },
  });

  if (!meeting || meeting.group.id !== id) return notFound();

  return (
    <div className="w-full">
      <AttendanceSheet meeting={meeting} />
    </div>
  );
}
