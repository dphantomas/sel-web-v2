import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

// Crear curso. Este handler estaba en `courses/courses/route.js` (carpeta
// duplicada de un refactor a medias): el panel llama a `/api/admin/courses` y
// daba 404 porque la ruta correcta no existía. Movido acá, al lugar que consume
// AdminCoursesPanel.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, description, shortDescription, image, type, modality, published, language, translationGroupId } = body;

    if (!title || !slug || !type) {
      return NextResponse.json({ error: "Faltan campos obligatorios (title, slug, type)" }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({ where: { slug } });
    if (existingCourse) {
      return NextResponse.json({ error: "Ya existe un curso con ese slug." }, { status: 400 });
    }

    const DEFAULT_COURSE_IMAGE = "/assets/default-course.jpg";
    const finalImage = image || DEFAULT_COURSE_IMAGE;

    const newCourse = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        image: finalImage,
        type,
        modality: modality || "Virtual",
        published: published || false,
        language: language || "es",
        // Sin inventar un UUID: si viene vacío queda null (no agrupa nada). Sólo
        // se setea cuando es una traducción de otro curso (mismo grupo).
        translationGroupId: translationGroupId || null,
      },
      include: {
        instances: true,
      },
    });

    return NextResponse.json({ message: "Curso creado", course: newCourse }, { status: 201 });
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor al crear curso" }, { status: 500 });
  }
}
