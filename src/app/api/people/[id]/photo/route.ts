import { getPhoto } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("ID inválido", { status: 400 });
  const photo = await getPhoto(id);
  if (!photo) return new Response("Sin foto", { status: 404 });
  return new Response(photo.data as BodyInit, {
    headers: {
      "Content-Type": photo.type,
      // La URL lleva ?v=<fecha de actualización>, así que se puede cachear para siempre
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
