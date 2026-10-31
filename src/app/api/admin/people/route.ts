import { createPerson, listPeople, photoUrl } from "@/lib/db";
import { readPersonForm } from "@/lib/personForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const people = await listPeople();
  return Response.json(people.map((p) => ({ ...p, photoUrl: photoUrl(p) })));
}

export async function POST(req: Request) {
  const fields = await readPersonForm(req);
  if ("error" in fields) return Response.json(fields, { status: 400 });
  const id = await createPerson({ ...fields, photo: fields.photo ?? null });
  return Response.json({ id }, { status: 201 });
}
