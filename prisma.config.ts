import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // DATABASE_URL a propósito: el build corre `prisma db push`, y DIRECT_URL no
  // está cargada en Vercel — si el CLI la exigiera, el build fallaría.
  // Si algún día se adopta `prisma migrate`, esto debe pasar a DIRECT_URL (el
  // pooler de Neon puede dejar huérfano el advisory lock del motor de
  // migraciones) y hay que cargar esa variable en Vercel ANTES de desplegar.
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  }
});
