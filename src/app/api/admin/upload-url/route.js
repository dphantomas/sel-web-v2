import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { s3Client } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { fileName, fileType, folder } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Se requiere nombre y tipo de archivo' }, { status: 400 })
    }

    // El visor decide qué reproductor montar a partir de este MIME, así que un
    // tipo que no sepa mostrar deja el recurso muerto: se sube, se lista, y al
    // abrirlo dice "no compatible". Ya pasó con un .pages subido donde iba un
    // PDF. Se valida acá, en la subida, que es donde el admin puede corregirlo.
    const TIPOS_PERMITIDOS = [
      'application/pdf',
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime',
    ]

    if (!TIPOS_PERMITIDOS.includes(fileType.toLowerCase())) {
      return NextResponse.json({
        error: `Tipo de archivo no soportado por el visor: "${fileType}". Se aceptan PDF, audio (mp3/m4a/wav/ogg) y video (mp4/webm/mov). Si es un documento, exportalo a PDF antes de subirlo.`
      }, { status: 400 })
    }

    const bucketName = process.env.R2_BUCKET_NAME
    if (!bucketName) {
      return NextResponse.json({ error: 'R2 no está configurado en el servidor' }, { status: 500 })
    }

    // Generar un key único para evitar colisiones
    const uniqueId = crypto.randomBytes(8).toString('hex')
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '')
    const folderName = folder ? `${folder.replace(/[^a-zA-Z0-9.\-_]/g, '')}/` : ''
    
    const cloudflareKey = `recursos/${folderName}${uniqueId}-${sanitizedFileName}`

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: cloudflareKey,
      ContentType: fileType,
    })

    // El link de subida expira en 15 minutos
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })

    return NextResponse.json({ uploadUrl, cloudflareKey })

  } catch (error) {
    console.error('Error generando upload URL:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
