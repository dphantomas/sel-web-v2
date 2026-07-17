"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { revalidatePath } from "next/cache";
import { deleteCloudinaryImage, extractCloudinaryPublicId } from "@/modules/media/cloudinary";

export async function createPost(data: {
  title: string;
  slug: string;
  language: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  coverFocus?: string | null;
  published: boolean;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    const post = await prisma.post.create({
      data: {
        ...data,
        // Sin inventar un UUID si viene vacío: no agrupa nada (nadie más lo
        // comparte) y la lista de admin ya sabe mostrar sueltos los posts sin
        // grupo (ver admin/blog/page.tsx: `post.translationGroupId || post.id`).
        translationGroupId: data.translationGroupId || null,
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
  coverFocus?: string | null;
  published: boolean;
  translationGroupId?: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return { success: false, error: "No autorizado" };
  }

  try {
    const oldPost = await prisma.post.findUnique({ where: { id }, select: { coverImage: true } });

    const post = await prisma.post.update({
      where: { id },
      data,
    });

    if (oldPost?.coverImage && oldPost.coverImage !== data.coverImage) {
      const publicId = extractCloudinaryPublicId(oldPost.coverImage);
      if (publicId) {
        try {
          await deleteCloudinaryImage(publicId);
        } catch (e) {
          console.error("Error borrando imagen vieja de Cloudinary:", e);
        }
      }
    }

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
    const oldPost = await prisma.post.findUnique({ where: { id }, select: { coverImage: true } });

    await prisma.post.delete({
      where: { id },
    });

    if (oldPost?.coverImage) {
      const publicId = extractCloudinaryPublicId(oldPost.coverImage);
      if (publicId) {
        try {
          await deleteCloudinaryImage(publicId);
        } catch (e) {
          console.error("Error borrando imagen de Cloudinary:", e);
        }
      }
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/en/blog");

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Ocurrió un error al eliminar el artículo." };
  }
}
