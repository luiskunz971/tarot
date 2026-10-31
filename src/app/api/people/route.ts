import { listPeople, photoUrl } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista pública (sin los ocultos): nombre, foto y cuántas veces consultó. La descripción y el teléfono quedan en el servidor.
export async function GET() {
  const people = await listPeople();
  return Response.json(
    people.filter((p) => !p.hidden).map((p) => ({ id: p.id, name: p.name, photoUrl: photoUrl(p), used: p.usedAt !== null, useCount: p.useCount, hasPhone: p.phone !== "" })),
  );
}
