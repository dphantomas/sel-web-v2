import sanitizeHtml from "sanitize-html";

/**
 * Saneo del HTML que produce el editor WYSIWYG (`RichTextEditor`).
 *
 * SOLO para contenido guardado como HTML. En este proyecto son DOS superficies:
 * el blog Y las reseñas — ambas se escriben con `RichTextEditor` (el form
 * público de /escribir-resena y el editor de admin guardan `editor.getHTML()`).
 * Ojo: esto difiere del template dgg-master, donde las reseñas son Markdown.
 * Las lecciones sí guardan Markdown y se renderizan con `markdownToHtml()`,
 * que sanea solo. Nunca cruzar los caminos: HTML por el renderizador de
 * Markdown sale VACÍO, sin error ni warning.
 *
 * El allowlist NO es genérico: sale de las extensiones que tiene cargadas
 * `RichTextEditor.tsx` (StarterKit con títulos 1-3, Underline, Image, Link,
 * TextAlign) más lo que puede aparecer en contenido migrado desde Markdown
 * (títulos 4-6).
 *
 * ⚠️ Si agregás una extensión al editor, agregá acá lo que emite. Si no, el
 * usuario lo va a ver en el editor, se va a guardar en la base, y va a
 * desaparecer al renderizar — sin error y sin warning.
 */
const CONFIG: sanitizeHtml.IOptions = {
  // Los defaults de sanitize-html traen tags que el editor no puede producir
  // (table, article, section...) y — crítico — NO traen `img`, que sí produce.
  // Por eso la lista es explícita en vez de "defaults + img".
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6", // 1-3 del editor; 4-6 pueden venir de Markdown migrado
    "strong", "em", "u", "s", "code",
    "ul", "ol", "li",
    "blockquote", "pre",
    "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    // `style` SOLO para la alineación (TextAlign en RichTextEditor.tsx, sobre
    // heading/paragraph). Habilitarlo acá no alcanza: `allowedStyles` de abajo
    // decide qué propiedades sobreviven, y solo deja `text-align`.
    p: ["style"],
    h1: ["style"], h2: ["style"], h3: ["style"],
    h4: ["style"], h5: ["style"], h6: ["style"],
  },
  // `style` es de los atributos más peligrosos que hay: admite URLs ejecutables
  // dentro del CSS. Por eso NO se abre entero — se declara la única propiedad
  // que el editor produce, con sus cuatro valores posibles y nada más. Cualquier
  // otra cosa dentro de style (background, position, lo que sea) se descarta.
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
    },
  },
  // El botón de imagen sube a Cloudinary y devuelve una URL https. `data:` queda
  // deliberadamente afuera: una imagen en base64 se guarda entera en la columna
  // TEXT del post y se arrastra en cada render. Por eso el editor también tiene
  // `allowBase64: false` — así una imagen pegada falla al pegarla, y no en
  // silencio al publicarla.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // `rel` no está en los defaults de sanitize-html: sin esto, el
  // rel="noopener noreferrer" que pone TipTap se descarta y los links con
  // target="_blank" quedan expuestos a reverse tabnabbing. Se fuerza en todos.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
  disallowedTagsMode: "discard",
};

/** Sanea HTML del editor para pasarlo a `dangerouslySetInnerHTML`. */
export function renderEditorHtml(html: string): string {
  return sanitizeHtml(html, CONFIG);
}
