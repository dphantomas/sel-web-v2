import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/modules/media/cloudinary";
import { env } from "@/env";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";

export async function GET(req: NextRequest) {
  if (env.ENABLE_CLOUDINARY !== "true") {
    return NextResponse.json({ error: "Cloudinary no habilitado" }, { status: 400 });
  }

  // Protección: Solo usuarios logueados o admins pueden firmar subidas
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const customFolder = searchParams.get('folder') || '';

  // Forzamos el root folder desde el environment
  const folder = customFolder 
    ? `${env.CLOUDINARY_ROOT_FOLDER}/${customFolder}`
    : env.CLOUDINARY_ROOT_FOLDER;

  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign, 
    env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({ timestamp, signature, folder });
}

export async function POST(req: NextRequest) {
  if (env.ENABLE_CLOUDINARY !== "true") {
    return NextResponse.json({ error: "Cloudinary no habilitado" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { paramsToSign } = body;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign, 
      env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({ signature });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
