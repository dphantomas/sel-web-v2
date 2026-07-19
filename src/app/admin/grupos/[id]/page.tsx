import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GroupDetailAdmin from "@/components/admin/GroupDetailAdmin";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    redirect("/admin");
  }

  const { id } = await params;

  const [group, allUsers] = await Promise.all([
    prisma.group.findUnique({
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
          include: { records: { where: { status: "Presente" }, select: { id: true, userId: true } } },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true, image: true },
    }),
  ]);

  if (!group) return notFound();

  return (
    <div className="w-full">
      <GroupDetailAdmin group={group} allUsers={allUsers} />
    </div>
  );
}
