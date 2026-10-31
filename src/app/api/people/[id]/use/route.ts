import { markUsed } from "@/lib/db";

export const runtime = "nodejs";

// Se llama al tocar "Revelar mi destino"
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "ID inválido." }, { status: 400 });
  const ok = await markUsed(id);
  return ok ? Response.json({ ok }) : Response.json({ error: "No existe esa persona." }, { status: 404 });
}
