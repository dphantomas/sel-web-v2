"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/modules/auth/email";
import { env } from "@/env";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

export async function submitUserReview(data: {
  authorName: string;
  authorRole?: string;
  content: string;
}) {
  const session = await getServerSession(authOptions);

  const result = await prisma.review.create({
    data: {
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      userId: session?.user?.id || null,
      content: data.content,
      isActive: false, // Oculta por defecto
    },
  });

  const adminUrl = `${process.env.NEXTAUTH_URL || 'https://sanacionenluz.com'}/admin/reviews/${result.id}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #6d28d9;">Nueva Reseña Recibida</h2>
      <p>El usuario <strong>${data.authorName}</strong> ha enviado una nueva reseña o testimonio.</p>
      <p>La reseña está oculta por defecto. Ingresa al panel de administración para revisarla, editarla y aprobarla si lo deseas:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${adminUrl}" style="background-color: #9187ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Revisar Testimonio</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: env.REVIEWS_EMAIL,
    subject: `Nuevo Testimonio Recibido: ${data.authorName}`,
    html: emailHtml
  }).catch(err => console.error("Error notificando nueva reseña:", err));

  return result;
}

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
  const existing = await prisma.review.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  const result = await prisma.review.update({
    where: { id },
    data,
  });

  if (data.isActive === true && existing?.user?.email && !existing.approvalEmailSentAt) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6d28d9;">¡Hola ${result.authorName}!</h2>
        <p>Tu reseña en Sanación en Luz ya fue aprobada y publicada. ¡Gracias por compartir tu experiencia!</p>
      </div>
    `;

    await sendEmail({
      to: existing.user.email,
      subject: `Tu reseña fue publicada - Sanación en Luz`,
      html: emailHtml,
      from: env.TALLERES_EMAIL,
      fromName: 'Talleres - Sanación en Luz'
    })
      .then(() => prisma.review.update({ where: { id }, data: { approvalEmailSentAt: new Date() } }))
      .catch(err => console.error("Error notificando aprobación de reseña:", err));
  }

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
