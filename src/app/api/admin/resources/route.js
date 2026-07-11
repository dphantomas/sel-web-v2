import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'
import { s3Client } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { name, description, type, cloudflareKey, isDownloadable, courseId, lessonId, instanceId, overridesResourceId } = await request.json()

    if (!name || !type || !cloudflareKey) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Guardar el registro en la base de datos
    const resource = await prisma.resource.create({
      data: {
        name,
        description: description || null,
        type,
        cloudflareKey,
        isDownloadable: isDownloadable || false,
        courseId,
        lessonId,
        courseInstanceId: instanceId,
        overridesResourceId: overridesResourceId || null
      }
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error creando recurso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, name, description, overridesResourceId, instanceId, cloudflareKey, type } = await request.json()

    if (!id || !name) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Si se sube un nuevo archivo, borramos el viejo
    if (cloudflareKey) {
      const oldResource = await prisma.resource.findUnique({ where: { id } })
      if (oldResource && oldResource.cloudflareKey) {
        const bucketName = process.env.R2_BUCKET_NAME
        if (bucketName) {
          try {
            const command = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: oldResource.cloudflareKey,
            })
            await s3Client.send(command)
          } catch (e) {
            console.error('Error borrando archivo viejo de R2:', e)
          }
        }
      }
    }

    const dataToUpdate = {
      name,
      description: description || null,
      courseInstanceId: instanceId || null,
      overridesResourceId: overridesResourceId || null
    }

    if (cloudflareKey) {
      dataToUpdate.cloudflareKey = cloudflareKey
      dataToUpdate.type = type
    }

    const updatedResource = await prisma.resource.update({
      where: { id },
      data: dataToUpdate
    })

    return NextResponse.json(updatedResource)
  } catch (error) {
    console.error('Error actualizando recurso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del recurso' }, { status: 400 })
    }

    const resource = await prisma.resource.findUnique({ where: { id } })
    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    // 1. Borrar de Cloudflare R2
    const bucketName = process.env.R2_BUCKET_NAME
    if (bucketName && resource.cloudflareKey) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: resource.cloudflareKey,
        })
        await s3Client.send(command)
      } catch (s3Error) {
        console.error('Error borrando archivo de R2:', s3Error)
        // Continuamos para borrar de la DB aunque falle S3
      }
    }

    // 2. Borrar de la base de datos
    await prisma.resource.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error borrando recurso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
