import "server-only";
import type { PhotoInput } from "./db";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PersonFields = {
  name: string;
  description: string;
  // undefined = no cambiar, null = borrar
  photo: PhotoInput | null | undefined;
};

// Lee y valida el formulario de una persona (multipart/form-data)
export async function readPersonForm(req: Request): Promise<PersonFields | { error: string }> {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  const description = String(form.get("description") ?? "").trim().slice(0, 1500);
  if (!name) return { error: "El nombre es obligatorio." };

  let photo: PhotoInput | null | undefined = undefined;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) return { error: "La foto tiene que ser JPG, PNG o WebP." };
    if (file.size > MAX_PHOTO_BYTES) return { error: "La foto es demasiado grande (máximo 2 MB)." };
    photo = { data: new Uint8Array(await file.arrayBuffer()), type: file.type };
  } else if (form.get("removePhoto") === "1") {
    photo = null;
  }

  return { name, description, photo };
}
