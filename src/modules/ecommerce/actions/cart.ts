"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

// Obtener carrito del usuario autenticado
export async function getDBCart() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      cart: {
        include: {
          items: {
            include: { product: true },
          },
        },
      },
    },
  });

  return user?.cart || null;
}

// Sincronizar (Fusionar) carrito local con la BD cuando el usuario se loguea
export async function syncCartWithDB(localItems: CartItemInput[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return null;

  let cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
      include: { items: true },
    });
  }

  // Lógica de fusión simple: Si el item ya está en la DB, sumamos cantidad. Si no, lo agregamos.
  for (const localItem of localItems) {
    const existing = cart.items.find(i => i.productId === localItem.productId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + localItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: localItem.productId,
          quantity: localItem.quantity,
        },
      });
    }
  }

  // Devolver el carrito actualizado
  return await getDBCart();
}

export async function addCartItemDB(productId: string, quantity: number = 1) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return false;

  let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } });
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }
  return true;
}

export async function removeCartItemDB(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return false;

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) return false;

  await prisma.cartItem.delete({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  return true;
}

export async function clearCartDB() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return false;

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) return true;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return true;
}
