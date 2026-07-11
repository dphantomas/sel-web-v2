import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    
    const rootFolder = process.env.CLOUDINARY_ROOT_FOLDER
    let subFolder = process.env.CLOUDINARY_GALLERY_FOLDER
    
    if (type === 'course') {
      subFolder = process.env.CLOUDINARY_COURSE_FOLDER
    } else if (type === 'profile') {
      subFolder = process.env.CLOUDINARY_PROFILE_FOLDER || process.env.CLOUDINARY_PROFIL_FOLDER
    }

    return NextResponse.json({ 
      folder: `${rootFolder}/${subFolder}`,
      apiKey: process.env.CLOUDINARY_API_KEY
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { paramsToSign } = body

    if (!paramsToSign) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Validar folders permitidos
    const rootFolder = process.env.CLOUDINARY_ROOT_FOLDER
    const galleryFolder = process.env.CLOUDINARY_GALLERY_FOLDER
    const courseFolder = process.env.CLOUDINARY_COURSE_FOLDER
    const validFolders = [
      `${rootFolder}/${galleryFolder}`,
      `${rootFolder}/${courseFolder}`
    ]

    if (paramsToSign.folder && !validFolders.includes(paramsToSign.folder)) {
      return NextResponse.json({ error: 'Folder no permitido' }, { status: 400 })
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET)

    return NextResponse.json({ 
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY
    })
  } catch (error) {
    console.error('Error al generar firma de Cloudinary:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
