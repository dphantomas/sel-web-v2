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
