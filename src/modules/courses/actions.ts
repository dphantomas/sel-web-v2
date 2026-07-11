"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { CourseType, Modality, Synchronicity } from "@prisma/client";

export async function createCourse(data: {
  title: string;
  slug: string;
  language: string;
  shortDescription?: string;
  description?: string;
  type: CourseType;
  durationDays?: number;
  modality: Modality;
  synchronicity: Synchronicity;
  published: boolean;
  image?: string;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  const groupId = data.translationGroupId || crypto.randomUUID();

  try {
    const course = await prisma.course.create({
      data: {
        ...data,
        translationGroupId: groupId,
      },
    });

    revalidatePath("/admin/cursos");
    revalidatePath("/cursos");
    revalidatePath("/en/cursos");
    
    return { success: true, courseId: course.id };
  } catch (error: any) {
    console.error("Error creating course:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCourse(id: string, data: {
  title: string;
  slug: string;
  language: string;
  shortDescription?: string;
  description?: string;
  type: CourseType;
  durationDays?: number;
  modality: Modality;
  synchronicity: Synchronicity;
  published: boolean;
  image?: string;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    const course = await prisma.course.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/cursos");
    revalidatePath("/cursos");
    revalidatePath("/en/cursos");
    revalidatePath(`/cursos/${course.slug}`);
    revalidatePath(`/en/cursos/${course.slug}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating course:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCourse(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    await prisma.course.delete({
      where: { id },
    });

    revalidatePath("/admin/cursos");
    revalidatePath("/cursos");
    revalidatePath("/en/cursos");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting course:", error);
    return { success: false, error: error.message };
  }
}

export async function markLessonAsCompleted(lessonId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "No autorizado" };

  try {
    // Buscar si ya existe el progreso
    const existing = await prisma.progress.findFirst({
      where: {
        userId: session.user.id,
        lessonId: lessonId
      }
    });

    if (existing) {
      await prisma.progress.update({
        where: { id: existing.id },
        data: { completed: true }
      });
    } else {
      await prisma.progress.create({
        data: {
          userId: session.user.id,
          lessonId: lessonId,
          completed: true
        }
      });
    }

    revalidatePath("/");
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
