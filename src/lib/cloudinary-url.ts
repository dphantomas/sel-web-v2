/**
 * Recorte con FOCO (automático o manual) para URLs de Cloudinary.
 *
 * Inserta una transformación de entrega `c_fill,...,w_,h_` en la URL, recortando
 * a wxh y sumando `q_auto,f_auto` (calidad y formato automáticos → webp/avif).
 *
 * - Sin `focus`: usa `g_auto` (la IA de Cloudinary elige la zona relevante).
 * - Con `focus` = "x,y" en píxeles del original: usa `g_xy_center,x_,y_`, o sea
 *   recorta centrado en ese punto elegido a mano en el editor. Se guarda en
 *   píxeles porque Cloudinary NO acepta coordenadas fraccionarias acá (dan 400);
 *   sí acepta píxeles del original (verificado contra la cuenta real).
 *
 * Es no destructivo: transforma sólo al ENTREGAR, el original no se toca. Si la
 * URL no es de Cloudinary (se pegó una externa a mano), se devuelve intacta.
 */
export function cldFocalFill(
  url: string | null | undefined,
  width: number,
  height: number,
  focus?: string | null,
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  // Si ya tiene una transformación de recorte inyectada, no duplicar.
  if (url.includes("/upload/c_fill")) return url;

  const gravity = parseFocus(focus)
    ? `g_xy_center,x_${parseFocus(focus)!.x},y_${parseFocus(focus)!.y}`
    : "g_auto";

  return url.replace(
    "/upload/",
    `/upload/c_fill,${gravity},w_${width},h_${height},q_auto,f_auto/`,
  );
}

/** Parsea "x,y" (píxeles enteros no negativos). Devuelve null si no es válido. */
function parseFocus(focus?: string | null): { x: number; y: number } | null {
  if (!focus) return null;
  const m = /^(\d+),(\d+)$/.exec(focus.trim());
  if (!m) return null;
  return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}
