import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT y DELETE estaban en la carpeta duplicada `courses/courses/[id]/route.js`
// (refactor a medias): el panel pega a `/api/admin/courses/[id]` y daba 405
// porque acá sólo vivía el GET. Movidos al mismo archivo que el GET real.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "Admin" && session.user.role !== "Transmisor")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Falta el ID del curso" }, { status: 400 });
    }

    const body = await req.json();
    const { title, slug, type, modality, description, shortDescription, image, published, language, translationGroupId } = body;

    const DEFAULT_COURSE_IMAGE = "/assets/default-course.jpg";
    const finalImage = (image === "" || !image) && image !== undefined ? DEFAULT_COURSE_IMAGE : image;

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(modality && { modality }),
        description: description !== undefined ? description : undefined, // Permite null/vacío
        shortDescription: shortDescription !== undefined ? shortDescription : undefined,
        image: finalImage !== undefined ? finalImage : undefined,
        ...(published !== undefined && { published }),
        ...(language && { language }),
        // Sólo se toca si el body lo trae explícito (permite vincular/desvincular
        // una traducción); undefined lo deja como está.
        ...(translationGroupId !== undefined && { translationGroupId: translationGroupId || null }),
      },
      include: {
        instances: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    return NextResponse.json({ message: "Curso actualizado", course: updatedCourse });
  } catch (error) {
    console.error("Error actualizando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Falta el ID del curso" }, { status: 400 });
    }

    // El esquema Prisma tiene onDelete: Cascade para instancias, módulos, accesos
    // de usuarios, etc. Al borrar el curso se borra todo su árbol dependiente.
    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ message: "Curso eliminado" });
  } catch (error) {
    console.error("Error eliminando curso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
