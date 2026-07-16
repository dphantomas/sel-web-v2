import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

// El límite de conexiones de Neon se reparte entre todas las instancias
// serverless vivas, no entre requests: cada instancia abre su propio pool, así
// que el `max` por pool se multiplica por la cantidad de instancias. El default
// de `pg` es 10, que con pocas instancias calientes ya agota la base. Va
// explícito y bajo, y se sube por env solo si se mide que hace falta.
//
// Pool y cliente se cachean juntos en globalThis: antes el `new Pool()` corría
// en cada reevaluación del módulo aunque el cliente cacheado se reusara, así
// que los pools se acumulaban sin que nadie los cerrara.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

globalForPrisma.pool = pool;
globalForPrisma.prisma = prisma;
