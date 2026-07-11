# Plan de Ejecución: DGG Master Template

Bienvenido a la creación del **DGG Master Template**. Este documento es la hoja de ruta para construir el proyecto definitivo que agrupará todas las tecnologías desarrolladas por la agencia.

## Fase 1: El Core de la Agencia (Starter Base)
1. Iniciar un proyecto Next.js 16+ vacío en esta carpeta (`npx create-next-app@latest .`).
2. Limpiar todo e instalar Tailwind CSS v4 con el setup de `@import "tailwindcss"`.
3. Configurar Prisma con Neon (`@prisma/adapter-pg` y `pg.Pool`).
4. Crear el validador estricto de `.env` (ej: script que falla si falta `DATABASE_URL` o `NEXTAUTH_SECRET`).
5. Traer el motor UI base (Layout, Globals.css, y componentes fundamentales como `ResponsiveMockup` y Modales que reaccionen a `ESC`).

## Fase 2: Integración de Módulos (El Kitchen Sink)
Una vez que la Fase 1 esté estable, iremos importando los módulos uno a uno. Todos los módulos vivirán juntos en este proyecto y deben ser capaces de coexistir sin conflictos.

1. **Módulo Auth (Prioridad Alta):**
   - Extraer de `SeL Web Pro`.
   - Setup de NextAuth, JWT callbacks, Rutas de Login/Registro.
   - Modelos de Prisma de Usuarios.
   - Integración de Email (Nodemailer) y Passkeys.
2. **Módulo Media & Storage:**
   - Extraer lógica de Cloudflare R2 y Cloudinary.
   - Componentes de recorte de imágenes y visor de PDFs.
3. **Módulo Blog & Contenido:**
   - Extraer sistema de Remark/Markdown de SeL Web Pro.
#### Módulo 4: LMS & Academia Digital (Extraído de SeL Web Pro)
- **Gestión Avanzada de Cursos:** Arquitectura paramétrica para lecciones, módulos y progreso de usuarios.
- **Bóveda Multimedia Ultra-Segura:** Entrega protegida y encriptada de recursos premium (texto, audio y video) mediante URLs firmadas (Signed URLs) para evitar piratería.

#### Módulo 5: Internacionalización (i18n)
- **Multilenguaje Nativo:** Soporte integral para múltiples idiomas en toda la plataforma, con detección automática de región y URLs optimizadas para SEO internacional.

#### Módulo 6: E-Commerce (Extraído de Beauté Divine) - *Para el final*
- Catálogo paramétrico, Carrito, Integración MP, Envíos.

## Flujo de Trabajo para Nuevos Clientes
Cuando este proyecto esté terminado, el flujo para un nuevo cliente será:
1. `git clone dgg-master nuevo-cliente`
2. Borrar las carpetas de módulos que no se necesiten (ej: borrar `/app/(auth)` y `/app/shop`).
3. Borrar del `package.json` dependencias sin uso.
4. Definir colores en `globals.css` (fijar el estilo UI).
5. ¡Lanzar a producción!

#### Actualización E-Commerce & LMS (Última versión):
- **Motor Híbrido de Carrito:** Se usa Zustand (`cartStore.ts`) con `persist` para visitantes, combinado con Server Actions para sincronización en Base de Datos (Prisma) para usuarios logueados.
- **Pagos y Webhooks:** Checkout con MercadoPago. El webhook `src/app/api/webhooks/mercadopago/route.ts` escucha pagos aprobados y automáticamente genera un `UserCourseAccess` si el producto tiene un `courseId` asociado.
