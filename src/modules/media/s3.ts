import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';

// Solo inicializamos el cliente si el módulo está habilitado
export const s3Client = env.ENABLE_S3_STORAGE === "true" 
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

/**
 * Genera una URL temporal firmada para acceder a un archivo privado (ej. PDF de un curso).
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600, inline = false) {
  if (!s3Client || !env.R2_BUCKET_NAME) throw new Error("S3 Storage no está configurado.");
  
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ...(inline ? { ResponseContentDisposition: 'inline' } : {})
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Genera una URL firmada para subir un archivo directamente desde el cliente hacia R2.
 */
export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  if (!s3Client || !env.R2_BUCKET_NAME) throw new Error("S3 Storage no está configurado.");
  
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}
