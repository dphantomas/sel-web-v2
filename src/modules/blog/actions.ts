"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { revalidatePath } from "next/cache";

export async function createPost(data: {
  title: string;
  slug: string;
  language: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published: boolean;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  // Generar cuid simple manualmente si no provee grupo de traducción, 
  // así es más fácil agrupar cosas luego.
  const groupId = data.translationGroupId || crypto.randomUUID();

  try {
    const post = await prisma.post.create({
      data: {
        ...data,
        translationGroupId: groupId,
        authorId: session.user.id,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/en/blog");
    
    return { success: true, post };
  } catch (error: any) {
    console.error("Error creating post:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "El slug ya está en uso." };
    }
    return { success: false, error: "Ocurrió un error al crear el artículo." };
  }
}

export async function updatePost(id: string, data: {
  title: string;
  slug: string;
  language: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published: boolean;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    const post = await prisma.post.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/en/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);

    return { success: true, post };
  } catch (error: any) {
    console.error("Error updating post:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "El slug ya está en uso." };
    }
    return { success: false, error: "Ocurrió un error al actualizar el artículo." };
  }
}

export async function deletePost(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/en/blog");

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Ocurrió un error al eliminar el artículo." };
  }
}
