import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/env';

// Configuramos globalmente Cloudinary solo si está habilitado
if (env.ENABLE_CLOUDINARY === "true") {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

/**
 * Elimina una imagen alojada en Cloudinary dada su ID pública.
 * Útil para cuando un usuario borra su foto de perfil o se borra un módulo.
 */
export async function deleteCloudinaryImage(publicId: string) {
  if (env.ENABLE_CLOUDINARY !== "true") return null;
  return await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

/**
 * Extrae el publicId de una URL de Cloudinary para poder borrar la imagen.
 * Ej: https://res.cloudinary.com/.../upload/v1234/folder/image.jpg -> folder/image
 */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAndFile = parts[1]; // ej. "v1783897408/sanacion-en-luz/blog/image.jpg"
    // Remover la versión (ej. "v1234567/")
    const withoutVersion = pathAndFile.replace(/^v\d+\//, ''); 
    // Remover la extensión
    const lastDotIndex = withoutVersion.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return withoutVersion.substring(0, lastDotIndex);
    }
    return withoutVersion;
  } catch (e) {
    return null;
  }
}
