import { getPerson } from "@/lib/db";
import { toWaNumber } from "@/lib/phone";

export const runtime = "nodejs";

// Solo se usa el número guardado si la persona consultó hace poco,
// para que no se puedan sacar los teléfonos de todos probando IDs.
const SHARE_WINDOW_MS = 2 * 60 * 60 * 1000;

// Abre WhatsApp con el número guardado de la persona, sin exponerlo en la lista pública.
// Uso: /api/people/3/whatsapp?text=...
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? await getPerson(id) : null;
  const recent = person?.usedAt != null && Date.now() - person.usedAt < SHARE_WINDOW_MS;
  const number = person && recent ? toWaNumber(person.phone) : "";
  const text = new URL(req.url).searchParams.get("text") ?? "";
  // Sin número, WhatsApp deja elegir el contacto
  return Response.redirect(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, 302);
}
