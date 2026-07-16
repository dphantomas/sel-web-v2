import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";

export type RateLimitRule = {
  /** Identifica al sujeto limitado. Ej: "login:ip:1.2.3.4" */
  key: string;
  /** Intentos permitidos dentro de la ventana. */
  limit: number;
  /** Largo de la ventana en segundos. */
  windowSec: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Segundos hasta que la ventana se libere. Siempre >= 1. */
  retryAfterSec: number;
};

/**
 * IP del cliente detrás de Vercel.
 *
 * `x-forwarded-for` lo puede mandar cualquiera: si lo leyéramos primero, un
 * atacante inventaría una IP distinta por request y el limitador no serviría
 * para nada. `x-vercel-forwarded-for` lo escribe el edge de Vercel pisando lo
 * que haya mandado el cliente, así que es el único que no se puede falsificar
 * desde afuera — por eso va primero.
 *
 * `cf-connecting-ip` NO se usa aunque el dominio esté en Cloudflare: el
 * proyecto sigue respondiendo en su URL *.vercel.app, y quien le pegue directo
 * al origen puede mandar ese header a mano.
 *
 * Sin ninguno de los dos, devuelve "unknown": todos esos requests comparten
 * cubeta. Es deliberado — preferimos limitar de más que dejar un agujero.
 */
function pickIp(get: (name: string) => string | null | undefined): string {
  const vercel = get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const real = get("x-real-ip");
  if (real) return real.trim();

  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/** Para route handlers, donde los headers son un objeto `Headers`. */
export function getClientIp(req: Request): string {
  return pickIp((name) => req.headers.get(name));
}

/**
 * Para `authorize()` de NextAuth, que no entrega un `Request` sino los headers
 * ya parseados como objeto plano. Node normaliza los nombres a minúsculas.
 */
export function getClientIpFromHeaders(
  headers: Record<string, string | undefined> | undefined,
): string {
  return pickIp((name) => headers?.[name]);
}

/**
 * Ventana fija en Postgres. El UPSERT resuelve el incremento y el reseteo de la
 * ventana vencida en una sola sentencia atómica: dos requests simultáneos no
 * pueden leer el mismo contador y escribir el mismo valor.
 */
async function consumePostgres(rule: RateLimitRule): Promise<RateLimitResult> {
  const expiresAt = new Date(Date.now() + rule.windowSec * 1000);

  const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${rule.key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN ${expiresAt} ELSE "RateLimit"."expiresAt" END
    RETURNING "count", "expiresAt"
  `;

  const row = rows[0];
  const msLeft = row.expiresAt.getTime() - Date.now();

  return {
    allowed: row.count <= rule.limit,
    retryAfterSec: Math.max(1, Math.ceil(msLeft / 1000)),
  };
}

/**
 * Ventana fija en Upstash, vía su API REST con `fetch`.
 *
 * A propósito sin el SDK `@upstash/ratelimit`: el paquete quedaría en el
 * package.json de TODOS los clientes, incluidos los que nunca van a usar este
 * motor. La API REST es HTTP plano y no cuesta una dependencia.
 *
 * `EXPIRE ... NX` pone el vencimiento solo si la clave todavía no tiene uno, así
 * la ventana arranca en el primer intento y no se estira con cada request.
 */
async function consumeUpstash(rule: RateLimitRule): Promise<RateLimitResult> {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", rule.key],
      ["EXPIRE", rule.key, rule.windowSec, "NX"],
      ["TTL", rule.key],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Upstash respondió ${res.status}`);
  }

  const body: { result: number }[] = await res.json();
  const count = body[0]?.result;
  const ttl = body[2]?.result;

  if (typeof count !== "number") {
    throw new Error("Respuesta inesperada de Upstash");
  }

  return {
    allowed: count <= rule.limit,
    // TTL devuelve -1 (sin vencimiento) o -2 (no existe) ante una carrera.
    retryAfterSec: typeof ttl === "number" && ttl > 0 ? ttl : rule.windowSec,
  };
}

/**
 * Barrido pasivo de filas vencidas — mismo criterio que las reservas de stock:
 * sin cron. Corre en ~1% de los intentos para no sumar un DELETE por request.
 * Si falla no importa: son filas muertas que el UPSERT igual pisa.
 */
async function sweepExpired(): Promise<void> {
  if (Math.random() >= 0.01) return;
  try {
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (error) {
    console.error("[rate-limit] Falló el barrido de vencidos:", error);
  }
}

/**
 * Consume un intento contra la regla.
 *
 * Falla CERRADO: si el motor se cae, se bloquea. Un limitador que se
 * autodesactiva cuando el almacén sufre se apaga justo durante un ataque, que es
 * cuando más lo necesitás. Con el motor Postgres el costo de esta decisión es
 * casi nulo: si la base no responde, el login tampoco iba a poder validar al
 * usuario.
 */
export async function consume(rule: RateLimitRule): Promise<RateLimitResult> {
  try {
    if (env.RATE_LIMIT_DRIVER === "upstash") {
      return await consumeUpstash(rule);
    }
    const result = await consumePostgres(rule);
    await sweepExpired();
    return result;
  } catch (error) {
    console.error(`[rate-limit] Motor caído (${env.RATE_LIMIT_DRIVER}), bloqueando "${rule.key}":`, error);
    return { allowed: false, retryAfterSec: rule.windowSec };
  }
}

/**
 * Evalúa varias reglas y devuelve un 429 si alguna se pasó, o null si puede
 * seguir. Las evalúa TODAS aunque una ya haya fallado: si cortáramos en la
 * primera, un atacante que satura la cubeta por IP dejaría de gastar la cubeta
 * por email y podría seguir apuntándole a esa cuenta desde otra IP.
 */
export async function guard(rules: RateLimitRule[]): Promise<NextResponse | null> {
  const results = await Promise.all(rules.map(consume));
  const blocked = results.filter((r) => !r.allowed);

  if (blocked.length === 0) return null;

  const retryAfterSec = Math.max(...blocked.map((r) => r.retryAfterSec));

  return NextResponse.json(
    { error: "Demasiados intentos. Probá de nuevo más tarde." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
