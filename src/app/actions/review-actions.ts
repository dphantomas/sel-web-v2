"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getReviews(activeOnly = true) {
  return await prisma.review.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getReviewById(id: string) {
  return await prisma.review.findUnique({
    where: { id },
  });
}

export async function createReview(data: {
  authorName: string;
  authorRole?: string;
  authorImage?: string;
  content: string;
  rating?: number;
  isActive?: boolean;
}) {
  const result = await prisma.review.create({
    data: {
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      authorImage: data.authorImage || null,
      content: data.content,
      rating: data.rating ?? 5,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return result;
}

export async function updateReview(id: string, data: Partial<{
  authorName: string;
  authorRole: string;
  authorImage: string;
  content: string;
  rating: number;
  isActive: boolean;
}>) {
  const result = await prisma.review.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return result;
}

export async function deleteReview(id: string) {
  await prisma.review.delete({
    where: { id },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
