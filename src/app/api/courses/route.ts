import { NextResponse } from "next/server";
import { getPublishedCourses } from "@/modules/courses/services";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'es';
    const courses = await getPublishedCourses(lang);
    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
