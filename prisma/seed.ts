import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando el seeding de la base de datos...')

  // 1. Limpiar datos existentes (opcional, pero útil para desarrollo)
  await prisma.user.deleteMany()
  await prisma.course.deleteMany()

  // 2. Crear un usuario de prueba
  const passwordHash = await bcrypt.hash('password123', 10)
  const user = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Prueba',
      email: 'admin@dgg.com',
      passwordHash,
      role: 'Admin',
      emailVerified: new Date(),
    },
  })
  console.log(`Usuario creado: ${user.email}`)

  // 3. Crear un Curso de prueba
  const course = await prisma.course.create({
    data: {
      title: 'Máster en Desarrollo Frontend',
      slug: 'master-desarrollo-frontend',
      shortDescription: 'Dominá React, Next.js y Tailwind CSS desde cero hasta nivel experto.',
      description: 'En este curso aprenderás a construir interfaces web modernas, rápidas y accesibles utilizando las mejores tecnologías del ecosistema JavaScript actual. Ideal para quienes quieren potenciar su carrera.',
      type: 'Curso',
      published: true,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop',
      modules: {
        create: [
          {
            title: 'Módulo 1: Fundamentos Modernos',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Introducción al DOM Virtual',
                  slug: 'intro-dom-virtual',
                  content: 'En esta clase veremos por qué React usa un Virtual DOM y cómo mejora la performance.',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Dummy video
                  order: 1,
                },
                {
                  title: 'Hooks esenciales: useState y useEffect',
                  slug: 'hooks-esenciales',
                  content: 'Aprenderemos a manejar el estado y el ciclo de vida de los componentes.',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  order: 2,
                }
              ]
            }
          },
          {
            title: 'Módulo 2: Server Components (Next.js)',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'RSC: React Server Components',
                  slug: 'rsc-react-server-components',
                  content: 'Diferencias entre Client y Server components en el App Router.',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  order: 1,
                }
              ]
            }
          }
        ]
      }
    },
  })
  
  console.log(`Curso creado: ${course.title}`)

  // 4. Darle acceso al usuario al curso
  await prisma.userCourseAccess.create({
    data: {
      userId: user.id,
      courseId: course.id,
    }
  })
  
  // 5. Crear Posts de prueba
  await prisma.post.createMany({
    data: [
      {
        title: 'Mi primer post en el Master Template',
        slug: 'mi-primer-post',
        language: 'es',
        excerpt: 'Bienvenidos al nuevo blog dinámico de DGG.',
        content: '# ¡Hola Mundo!\n\nEste es un artículo generado dinámicamente desde la base de datos de Neon Postgres.\n\n- Rápido\n- Moderno\n- Multilenguaje',
        authorId: user.id,
        published: true,
      },
      {
        title: 'My first post in the Master Template',
        slug: 'my-first-post',
        language: 'en',
        excerpt: 'Welcome to the new dynamic blog of DGG.',
        content: '# Hello World!\n\nThis is a dynamically generated article from the Neon Postgres database.\n\n- Fast\n- Modern\n- Multilingual',
        authorId: user.id,
        published: true,
      }
    ]
  })
  console.log('Posts de prueba creados.')

  console.log('Seeding finalizado exitosamente.')
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
