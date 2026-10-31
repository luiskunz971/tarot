"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";

type AdminPerson = {
  id: number;
  name: string;
  description: string;
  phone: string;
  photoUrl: string | null;
  usedAt: number | null;
  useCount: number;
};

type FormState = {
  id: number | null; // null = persona nueva
  name: string;
  description: string;
  phone: string;
  photo: Blob | null;
  preview: string | null;
  removePhoto: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  description: "",
  phone: "",
  photo: null,
  preview: null,
  removePhoto: false,
};

// Achica la foto a 400px como máximo y la pasa a JPEG, para que pese poco en la base
async function resizeImage(file: File, max = 400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto"))), "image/jpeg", 0.85),
  );
}

export default function AdminPage() {
  const [people, setPeople] = useState<AdminPerson[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/people");
    if (res.ok) setPeople(await res.json());
    else setMessage({ text: "No pude cargar la lista de personas.", error: true });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(p: AdminPerson) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      phone: p.phone,
      photo: null,
      preview: p.photoUrl,
      removePhoto: false,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const blob = await resizeImage(file);
      setForm((f) => ({ ...f, photo: blob, preview: URL.createObjectURL(blob), removePhoto: false }));
    } catch {
      setMessage({ text: "No pude leer esa imagen. Probá con otra.", error: true });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const data = new FormData();
    data.set("name", form.name);
    data.set("description", form.description);
    data.set("phone", form.phone);
    if (form.photo) data.set("photo", form.photo, "foto.jpg");
    if (form.removePhoto) data.set("removePhoto", "1");

    const res = await fetch(form.id ? `/api/admin/people/${form.id}` : "/api/admin/people", {
      method: form.id ? "PUT" : "POST",
      body: data,
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ text: body.error ?? "No se pudo guardar.", error: true });
      return;
    }
    setMessage({ text: form.id ? "Cambios guardados ✦" : `${form.name} ya está en la lista ✦` });
    setForm(EMPTY_FORM);
    await load();
  }

  async function toggleUsed(p: AdminPerson) {
    const res = await fetch(`/api/admin/people/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ used: !p.usedAt }),
    });
    if (!res.ok) {
      setMessage({ text: "No se pudo cambiar el estado.", error: true });
      return;
    }
    await load();
  }

  async function resetAll() {
    if (!confirm("¿Marcar a todos como que todavía no consultaron?")) return;
    const res = await fetch("/api/admin/usage-reset", { method: "POST" });
    if (!res.ok) {
      setMessage({ text: "No se pudo reiniciar.", error: true });
      return;
    }
    setMessage({ text: "Listo: todos quedaron sin consultar ✦" });
    await load();
  }

  async function remove(p: AdminPerson) {
    if (!confirm(`¿Borrar a ${p.name}? No se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/people/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage({ text: "No se pudo borrar.", error: true });
      return;
    }
    if (form.id === p.id) setForm(EMPTY_FORM);
    await load();
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Madam Esteves</h1>
        <p>Consultantes</p>
        <Link href="/" className={styles.link}>
          ← Volver al tarot
        </Link>
      </header>

      <form className={styles.card} onSubmit={save}>
        <h2>{form.id ? `Editar a ${form.name || "…"}` : "Agregar persona"}</h2>

        <div className={styles.formGrid}>
          <label className={styles.photoPicker}>
            {form.preview && !form.removePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.preview} alt="" />
            ) : (
              <span>+ Foto</span>
            )}
            <input type="file" accept="image/*" onChange={(e) => void onPhoto(e.target.files?.[0])} hidden />
          </label>

          <div className={styles.fields}>
            <label>
              Nombre
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={60}
                required
              />
            </label>
            <label>
              WhatsApp
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={30}
                placeholder="11 2345 6789 (con código de área, sin 0 ni 15)"
              />
            </label>
            <label>
              Descripción
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={1500}
                rows={5}
                placeholder="Quién es, a qué se dedica, qué le preocupa, qué le gusta… Madam Esteves lo va a usar en la lectura."
              />
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          {form.preview && !form.removePhoto && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setForm({ ...form, photo: null, preview: null, removePhoto: true })}
            >
              Quitar foto
            </button>
          )}
          {form.id && (
            <button type="button" className={styles.secondary} onClick={() => setForm(EMPTY_FORM)}>
              Cancelar
            </button>
          )}
          <button type="submit" className={styles.primary} disabled={saving || !form.name.trim()}>
            {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Agregar"}
          </button>
        </div>

        {message && <p className={message.error ? styles.error : styles.ok}>{message.text}</p>}
      </form>

      <section className={styles.list}>
        {people.some((p) => p.usedAt) && (
          <div className={styles.listHeader}>
            <span>
              {people.filter((p) => p.usedAt).length} de {people.length} ya consultaron
            </span>
            <button className={styles.secondary} onClick={() => void resetAll()}>
              Reiniciar a todos
            </button>
          </div>
        )}
        {people.length === 0 && <p className={styles.empty}>Todavía no hay nadie cargado.</p>}
        {people.map((p) => (
          <article key={p.id} className={styles.person}>
            <span className={styles.avatar}>
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt="" />
              ) : (
                p.name.charAt(0).toUpperCase()
              )}
            </span>
            <div className={styles.personInfo}>
              <strong>{p.name}</strong>
              {p.phone && <span className={styles.phone}>· {p.phone}</span>}
              <p>{p.description || <em>Sin descripción</em>}</p>
              <span className={p.usedAt ? styles.used : styles.notUsed}>
                {!p.usedAt
                  ? "Todavía no consultó"
                  : p.useCount > 0
                    ? `Consultó ${p.useCount} ${p.useCount === 1 ? "vez" : "veces"} · última: ${new Date(p.usedAt).toLocaleDateString("es-AR")}`
                    : `Marcado como que consultó · ${new Date(p.usedAt).toLocaleDateString("es-AR")}`}
              </span>
            </div>
            <div className={styles.personActions}>
              <button className={styles.secondary} onClick={() => void toggleUsed(p)}>
                {p.usedAt ? "Marcar sin consultar" : "Marcar consultó"}
              </button>
              <button className={styles.secondary} onClick={() => edit(p)}>
                Editar
              </button>
              <button className={styles.danger} onClick={() => void remove(p)}>
                Borrar
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
