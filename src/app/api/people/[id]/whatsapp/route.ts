import { consultedRecently, getPerson } from "@/lib/db";
import { toWaNumber } from "@/lib/phone";

export const runtime = "nodejs";

// Abre WhatsApp con el número guardado de la persona, sin exponerlo en la lista pública.
// Uso: /api/people/3/whatsapp?text=...
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? await getPerson(id) : null;
  const number = person && consultedRecently(person) ? toWaNumber(person.phone) : "";
  const text = new URL(req.url).searchParams.get("text") ?? "";
  // Sin número, WhatsApp deja elegir el contacto
  return Response.redirect(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, 302);
}
