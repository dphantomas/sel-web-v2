"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

// --- MODULES ---

export async function createModule(courseId: string, title: string, order: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    const module = await prisma.module.create({
      data: {
        title,
        order,
        courseId,
      },
    });
    return { success: true, moduleId: module.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateModule(id: string, title: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.module.update({
      where: { id },
      data: { title },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteModule(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.module.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderModules(updates: { id: string, order: number }[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.$transaction(
      updates.map((update) => 
        prisma.module.update({
          where: { id: update.id },
          data: { order: update.order },
        })
      )
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- LESSONS ---

export async function createLesson(moduleId: string, data: { title: string, slug: string, description?: string, videoUrl?: string, duration?: number, isFree: boolean, order: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.description,
        videoUrl: data.videoUrl,
        order: data.order,
        moduleId,
      },
    });
    return { success: true, lessonId: lesson.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLesson(id: string, data: { title: string, slug: string, description?: string, videoUrl?: string, duration?: number, isFree: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.lesson.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.description,
        videoUrl: data.videoUrl,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLesson(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.lesson.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderLessons(updates: { id: string, order: number }[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') return { success: false, error: "No autorizado" };

  try {
    await prisma.$transaction(
      updates.map((update) => 
        prisma.lesson.update({
          where: { id: update.id },
          data: { order: update.order },
        })
      )
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
