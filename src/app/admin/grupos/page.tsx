import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GroupsAdmin from "@/components/admin/GroupsAdmin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grupos y Asistencia | Admin",
};

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
    redirect("/admin");
  }

  const [groups, courses] = await Promise.all([
    prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        course: { select: { id: true, title: true } },
        courseInstance: { select: { id: true, startDate: true, course: { select: { title: true } } } },
        _count: { select: { members: true, meetings: true } },
        meetings: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        instances: { orderBy: { startDate: "desc" }, select: { id: true, startDate: true, location: true } },
      },
    }),
  ]);

  return (
    <div className="w-full">
      <GroupsAdmin initialGroups={groups} courses={courses} />
    </div>
  );
}
