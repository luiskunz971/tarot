import "server-only";
import type { PersonInput, PhotoInput } from "./db";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Lee y valida el formulario de una persona (multipart/form-data)
export async function readPersonForm(req: Request): Promise<PersonInput | { error: string }> {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  const description = String(form.get("description") ?? "").trim().slice(0, 1500);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 30);
  if (!name) return { error: "El nombre es obligatorio." };
  const phoneDigits = phone.replace(/\D/g, "").length;
  if (phone && (phoneDigits < 8 || phoneDigits > 15 || /[^\d\s+()-]/.test(phone))) {
    return { error: "El número de WhatsApp no parece válido." };
  }

  let photo: PhotoInput | null | undefined = undefined;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) return { error: "La foto tiene que ser JPG, PNG o WebP." };
    if (file.size > MAX_PHOTO_BYTES) return { error: "La foto es demasiado grande (máximo 2 MB)." };
    photo = { data: new Uint8Array(await file.arrayBuffer()), type: file.type };
  } else if (form.get("removePhoto") === "1") {
    photo = null;
  }

  return { name, description, phone, photo };
}
