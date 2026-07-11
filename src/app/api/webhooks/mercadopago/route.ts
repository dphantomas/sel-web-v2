import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Webhook que recibe las notificaciones de MercadoPago
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || url.searchParams.get("topic");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (type !== "payment" || !id) {
      return new NextResponse("OK", { status: 200 }); // Ignorar otros eventos
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    const payment = new Payment(client);

    // Obtener información del pago
    const paymentData = await payment.get({ id });
    const orderId = paymentData.external_reference;

    if (!orderId) {
      console.error("Pago recibido sin external_reference (Order ID)", paymentData);
      return new NextResponse("OK", { status: 200 });
    }

    // Verificar si el pago está aprobado
    if (paymentData.status === "approved") {
      // 1. Actualizar estado de la Orden
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { 
            status: "PAID",
            paymentId: id
        },
        include: { items: { include: { product: true } } }
      });

      // 2. Procesar Productos Digitales (LMS)
      if (order.userId) {
          for (const item of order.items) {
              if (item.product?.courseId) {
                  // Si el producto está asociado a un curso, darle acceso
                  const existingAccess = await prisma.userCourseAccess.findUnique({
                      where: {
                          userId_courseId: {
                              userId: order.userId,
                              courseId: item.product.courseId
                          }
                      }
                  });

                  if (!existingAccess) {
                      await prisma.userCourseAccess.create({
                          data: {
                              userId: order.userId,
                              courseId: item.product.courseId
                          }
                      });
                      console.log(`✅ Acceso otorgado al usuario ${order.userId} para el curso ${item.product.courseId}`);
                  }
              }
          }
      }
    } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: "CANCELLED",
                paymentId: id
            }
        });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
