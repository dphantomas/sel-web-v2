import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null
  try {
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    let pathParts = parts[1].split('/')
    if (pathParts[0].includes(',') || /^[a-z]_[a-zA-Z0-9]+/.test(pathParts[0])) {
      pathParts.shift()
    }
    if (/^v\d+$/.test(pathParts[0])) {
      pathParts.shift()
    }
    const fileWithExtension = pathParts.join('/')
    const lastDotIndex = fileWithExtension.lastIndexOf('.')
    if (lastDotIndex === -1) return fileWithExtension
    return fileWithExtension.substring(0, lastDotIndex)
  } catch (e) {
    return null
  }
}

const safeString = (val) => {
  if (!val || val === 'null' || val === 'undefined') return null
  return val.trim()
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const id = session.user.id

    const formData = await req.formData()
    const firstName = safeString(formData.get('firstName'))
    const lastName = safeString(formData.get('lastName'))
    const phone = safeString(formData.get('phone'))
    const addressLine1 = safeString(formData.get('addressLine1'))
    const addressLine2 = safeString(formData.get('addressLine2'))
    const zipCode = safeString(formData.get('zipCode'))
    const country = safeString(formData.get('country'))
    const sparkName = safeString(formData.get('sparkName'))
    const birthDateRaw = safeString(formData.get('birthDate'))
    const imageFile = formData.get('image')
    const removeImage = formData.get('removeImage')

    let imageUrl = undefined

    if (imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const folder = `${process.env.CLOUDINARY_ROOT_FOLDER}/${process.env.CLOUDINARY_PROFILE_FOLDER}`

      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folder, transformation: [{ width: 500, height: 500, crop: 'fill' }] },
          (error, result) => {
            if (error) reject(error)
            else resolve(result.secure_url)
          }
        )
        uploadStream.end(buffer)
      })

      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { image: true }
      })

      if (existingUser?.image) {
        const publicId = getPublicIdFromUrl(existingUser.image)
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { invalidate: true })
          } catch (e) {
            console.error('Error eliminando imagen anterior de Cloudinary:', e)
          }
        }
      }
    } else if (removeImage === 'true') {
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { image: true }
      })

      if (existingUser?.image) {
        const publicId = getPublicIdFromUrl(existingUser.image)
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { invalidate: true })
          } catch (e) {
            console.error('Error eliminando imagen de Cloudinary:', e)
          }
        }
      }
      imageUrl = null
    }

    const updateData = {}
    if (firstName) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName || ''
    if (phone !== undefined) updateData.phone = phone
    if (sparkName !== undefined) updateData.sparkName = sparkName
    if (birthDateRaw) {
      updateData.birthDate = new Date(birthDateRaw)
    } else if (formData.has('birthDate')) {
      updateData.birthDate = null
    }
    if (imageUrl !== undefined) updateData.image = imageUrl

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ message: 'Usuario actualizado', user: updatedUser })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
