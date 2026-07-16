import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    // Conexiones por pool. Se multiplica por instancia serverless viva, no por
    // request: subirlo agota el límite de conexiones de la base más rápido de
    // lo que parece. Ver src/lib/prisma.ts.
    DATABASE_POOL_MAX: z.coerce.number().int().positive().optional().default(5),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(), // Vercel lo setea dinámicamente

    // Rate limiting. El flag elige el MOTOR, no si hay protección: no tiene
    // interruptor de apagado a propósito. "postgres" usa la base que ya existe
    // (cero servicios nuevos); "upstash" se usa si algún día conviene sacarle
    // la carga a la base, y exige credenciales propias (ver validación abajo).
    RATE_LIMIT_DRIVER: z.enum(["postgres", "upstash"]).optional().default("postgres"),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Configuración de Módulos (Feature Flags) - REQUERIDOS explícitamente
    ENABLE_GOOGLE_AUTH: z.enum(["true", "false"]),
    ENABLE_EMAIL_NOTIFICATIONS: z.enum(["true", "false"]),

    // Google Auth & Nodemailer OAuth2
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REFRESH_TOKEN: z.string().optional(),
    
    // SMTP General
    SMTP_USER: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    REVIEWS_EMAIL: z.string().email(),
    // Destinatario de los avisos internos (ej. alta automática vía Google).
    // Obligatorio solo si ENABLE_GOOGLE_AUTH está prendido — ver validación abajo.
    ADMIN_EMAIL: z.string().email().optional(),

    // Módulo Media - Flags - REQUERIDOS explícitamente
    ENABLE_S3_STORAGE: z.enum(["true", "false"]),
    ENABLE_CLOUDINARY: z.enum(["true", "false"]),

    // Cloudflare R2 (S3)
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),

    // Cloudinary
    CLOUDINARY_URL: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_ROOT_FOLDER: z.string().optional().default("dgg-master"),
  },
  client: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  },
  emptyStringAsUndefined: true,
});

// Validaciones condicionales post-parseo
if (env.ENABLE_GOOGLE_AUTH === "true") {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("❌ Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET para activar Google Auth");
  }
  // El alta automática vía Google avisa al admin: sin destinatario el aviso se pierde.
  if (!env.ADMIN_EMAIL) {
    throw new Error("❌ Falta ADMIN_EMAIL: el alta automática vía Google le notifica al administrador");
  }
}

if (env.ENABLE_EMAIL_NOTIFICATIONS === "true") {
  if (!env.SMTP_USER || !env.SMTP_FROM || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("❌ Faltan credenciales SMTP / Google OAuth2 para notificaciones por correo");
  }
}

if (env.ENABLE_S3_STORAGE === "true") {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error("❌ Faltan credenciales de Cloudflare R2 para activar el módulo S3 Storage");
  }
}

if (env.RATE_LIMIT_DRIVER === "upstash") {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("❌ Faltan UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN para usar RATE_LIMIT_DRIVER=upstash");
  }
}

if (env.ENABLE_CLOUDINARY === "true") {
  if (!env.CLOUDINARY_URL || !env.NEXT_PUBLIC_CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error("❌ Faltan credenciales de Cloudinary para activar el módulo Cloudinary Storage");
  }
}
