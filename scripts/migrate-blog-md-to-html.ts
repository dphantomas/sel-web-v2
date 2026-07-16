import "dotenv/config";
import { prisma } from "@/lib/prisma";
import markdownToHtml from "@/lib/markdown";

/**
 * Migra `Post.content` de Markdown a HTML.
 *
 * Necesario SOLO en instancias que ya tengan posts escritos en Markdown desde
 * antes de que el blog pasara a HTML (ver regla 19 en `.agents/AGENTS.md`). Una
 * instancia nueva del template ya nace con el seed en HTML: no correr esto.
 *
 * No inventa nada: usa el mismo `markdownToHtml()` que el blog usaba en cada
 * render. Solo mueve esa conversión de tiempo de render a tiempo de escritura.
 *
 *   npx tsx scripts/migrate-blog-md-to-html.ts            → simulación
 *   npx tsx scripts/migrate-blog-md-to-html.ts --apply    → escribe
 */

const APPLY = process.argv.includes("--apply");

// Un post ya en HTML pasado por markdownToHtml() vuelve VACÍO: remark trata las
// etiquetas como bloque crudo y el saneo las descarta. O sea que correr esto dos
// veces borraría el contenido. Por eso se saltea lo que ya arranca con etiqueta.
const YA_ES_HTML = /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|img|figure|div|hr)\b/i;

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, content: true },
  });

  let migrados = 0;
  let salteados = 0;
  let vacios = 0;

  for (const post of posts) {
    if (!post.content?.trim()) {
      vacios++;
      continue;
    }
    if (YA_ES_HTML.test(post.content)) {
      console.log(`  ⏭️  "${post.title}" — ya es HTML`);
      salteados++;
      continue;
    }

    const html = (await markdownToHtml(post.content)).trim();

    if (!html) {
      // No debería pasar con Markdown legítimo. Si pasa, no lo tocamos:
      // guardar vacío perdería el contenido para siempre.
      console.warn(`  ⚠️  "${post.title}" — la conversión dio vacío, SE SALTEA`);
      salteados++;
      continue;
    }

    if (APPLY) {
      await prisma.post.update({ where: { id: post.id }, data: { content: html } });
    }
    console.log(`  ${APPLY ? "✅" : "🔎"} "${post.title}" — ${post.content.length} → ${html.length} chars`);
    migrados++;
  }

  console.log(
    `\n${APPLY ? "Migrados" : "A migrar"}: ${migrados} · Salteados: ${salteados} · Vacíos: ${vacios}`,
  );
  if (!APPLY && migrados > 0) {
    console.log("Simulación. Volvé a correr con --apply para escribir.");
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Falló la migración:", e);
  await prisma.$disconnect();
  process.exit(1);
});
