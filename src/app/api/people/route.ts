import { listPeople, photoUrl } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista pública: solo nombre y foto. La descripción queda en el servidor.
export async function GET() {
  const people = await listPeople();
  return Response.json(people.map((p) => ({ id: p.id, name: p.name, photoUrl: photoUrl(p) })));
}
