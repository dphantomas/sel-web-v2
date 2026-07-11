import { S3Client } from '@aws-sdk/client-s3'

// Nos aseguramos de que existan las credenciales para evitar que la app crashee,
// pero mostramos una advertencia si faltan para que el admin sepa configurarlo.
const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.warn('⚠️ ATENCIÓN: Las credenciales de Cloudflare R2 no están configuradas en .env.local')
}

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})
