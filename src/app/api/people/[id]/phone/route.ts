import { consultedRecently, getPerson, setPhoneIfEmpty } from "@/lib/db";
import { isValidPhone } from "@/lib/phone";

export const runtime = "nodejs";

// Guarda el WhatsApp de quien acaba de consultar, si todavía no lo tenía.
// Para cambiar un número ya cargado hay que usar /admin.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? await getPerson(id) : null;
  if (!person) return Response.json({ error: "No existe esa persona." }, { status: 404 });
  if (!consultedRecently(person)) {
    return Response.json({ error: "Solo se puede guardar después de una consulta." }, { status: 403 });
  }
  if (person.phone) return Response.json({ error: "Ya tiene un número guardado." }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as { phone?: unknown };
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  if (!isValidPhone(phone)) {
    return Response.json({ error: "El número no parece válido." }, { status: 400 });
  }

  const ok = await setPhoneIfEmpty(id, phone);
  return ok ? Response.json({ ok }) : Response.json({ error: "Ya tiene un número guardado." }, { status: 409 });
}
