import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AttendanceHistoryTable from "@/components/admin/AttendanceHistoryTable";

export const dynamic = "force-dynamic";

export default async function AdminGroupHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    redirect("/admin");
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      meetings: {
        orderBy: { date: "desc" },
        include: { records: { select: { userId: true, status: true } } },
      },
    },
  });

  if (!group) return notFound();

  return (
    <div className="w-full">
      <AttendanceHistoryTable group={group} />
    </div>
  );
}
