import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Esta ruta genera la orden en la BD y la preferencia en MP
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { items, shippingDetails } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) userId = user.id;
    }

    // Calcular el total a partir de los precios reales en la base de datos
    let totalAmount = 0;
    const orderItemsData = [];
    const preferenceItems = [];

    for (const item of items) {
      const dbProduct = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      const price = dbProduct.price;
      totalAmount += price * item.quantity;

      orderItemsData.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        priceAtPurchase: price
      });

      preferenceItems.push({
        id: dbProduct.id,
        title: dbProduct.name,
        unit_price: price,
        quantity: item.quantity,
        currency_id: 'ARS'
      });
    }

    const shippingCost = shippingDetails?.shippingCost || 0;
    totalAmount += shippingCost;

    if (shippingCost > 0) {
        preferenceItems.push({
            id: 'SHIPPING',
            title: 'Costo de Envío',
            unit_price: shippingCost,
            quantity: 1,
            currency_id: 'ARS'
        });
    }

    // Crear la orden en la base de datos con estado PENDING
    const order = await prisma.order.create({
      data: {
        userId,
        total: totalAmount,
        shippingCost,
        shippingStreet: shippingDetails?.street || null,
        shippingNumber: shippingDetails?.number || null,
        shippingApartment: shippingDetails?.apartment || null,
        shippingCity: shippingDetails?.city || null,
        shippingProvince: shippingDetails?.province || null,
        shippingZipCode: shippingDetails?.zipCode || null,
        customerPhone: shippingDetails?.phone || null,
        status: "PENDING",
        items: {
          create: orderItemsData
        }
      }
    });

    // Configurar MercadoPago
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    const preference = new Preference(client);

    const backUrls = {
      success: `${process.env.NEXTAUTH_URL}/checkout/success`,
      failure: `${process.env.NEXTAUTH_URL}/checkout/failure`,
      pending: `${process.env.NEXTAUTH_URL}/checkout/pending`,
    };

    const response = await preference.create({
      body: {
        items: preferenceItems,
        back_urls: backUrls,
        auto_return: 'approved',
        external_reference: order.id, // VITAL: Referencia cruzada con nuestra DB
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`
      }
    });

    // Actualizar la orden con el preferenceId de MP
    if (response.id) {
        await prisma.order.update({
            where: { id: order.id },
            data: { preferenceId: response.id }
        });
    }

    // Retornamos el init_point para redireccionar al usuario al pago
    return NextResponse.json({ 
        orderId: order.id, 
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error("Error creating checkout preference:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
