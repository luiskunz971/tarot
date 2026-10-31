import { deletePerson, setHidden, setUsed, updatePerson } from "@/lib/db";
import { readPersonForm } from "@/lib/personForm";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "ID inválido." }, { status: 400 });
  const fields = await readPersonForm(req);
  if ("error" in fields) return Response.json(fields, { status: 400 });
  const ok = await updatePerson(id, fields);
  return ok ? Response.json({ ok }) : Response.json({ error: "No existe esa persona." }, { status: 404 });
}

// Cambia a mano el estado de consulta { used: boolean } o la visibilidad { hidden: boolean }
export async function PATCH(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "ID inválido." }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { used?: unknown; hidden?: unknown };
  let ok: boolean;
  if (typeof body.hidden === "boolean") ok = await setHidden(id, body.hidden);
  else if (typeof body.used === "boolean") ok = await setUsed(id, body.used);
  else return Response.json({ error: "Falta used o hidden." }, { status: 400 });
  return ok ? Response.json({ ok }) : Response.json({ error: "No existe esa persona." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "ID inválido." }, { status: 400 });
  const ok = await deletePerson(id);
  return ok ? Response.json({ ok }) : Response.json({ error: "No existe esa persona." }, { status: 404 });
}
