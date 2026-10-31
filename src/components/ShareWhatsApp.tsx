"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import type { DrawnCard } from "@/lib/cards";
import { isValidPhone } from "@/lib/phone";
import styles from "./ShareWhatsApp.module.css";

type Props = {
  personId: number | null;
  hasPhone: boolean; // si la persona ya tiene su WhatsApp guardado
  name: string;
  reading: string;
  cards: DrawnCard[];
  onPhoneSaved: () => void;
};

// Arma el mensaje con el formato de WhatsApp (*negrita*)
function buildMessage(name: string, reading: string, cards: DrawnCard[]): string {
  const spread = cards
    .map((c) => `${c.position}: *${c.name}*${c.reversed ? " (invertida)" : ""}`)
    .join("\n");
  const body = reading.replace(/\*\*(.+?)\*\*/g, "*$1*");
  return `🔮 *Lectura de tarot de ${name} con Madam Esteves*\n\n${spread}\n\n${body}`;
}

export default function ShareWhatsApp({ personId, hasPhone, name, reading, cards, onPhoneSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // El servidor busca el número guardado: no queda expuesto en la página
  const whatsappUrl = () =>
    `/api/people/${personId}/whatsapp?text=${encodeURIComponent(buildMessage(name, reading, cards))}`;

  function onClick() {
    if (hasPhone) {
      window.open(whatsappUrl(), "_blank", "noopener,noreferrer");
    } else {
      setOpen(!open);
      setError("");
    }
  }

  async function saveAndSend() {
    if (!isValidPhone(phone)) {
      setError("Revisá el número: con código de área, sin 0 ni 15.");
      return;
    }
    // La pestaña se abre ya, en el clic, para que el navegador no la bloquee
    const tab = window.open("", "_blank");
    setSaving(true);
    setError("");
    const res = await fetch(`/api/people/${personId}/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }).catch(() => null);
    setSaving(false);

    if (!res?.ok) {
      tab?.close();
      const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setError(body?.error ?? "No se pudo guardar el número. Probá de nuevo.");
      return;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = whatsappUrl();
    } else {
      window.location.href = whatsappUrl();
    }
    onPhoneSaved();
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button
        className={styles.button}
        onClick={onClick}
        aria-expanded={hasPhone ? undefined : open}
        aria-label="Enviar la lectura por WhatsApp"
      >
        <FaWhatsapp className={styles.icon} aria-hidden />
        Enviar
      </button>

      {open && !hasPhone && (
        <form
          className={styles.popover}
          onSubmit={(e) => {
            e.preventDefault();
            void saveAndSend();
          }}
        >
          <label className={styles.label} htmlFor="wa-phone">
            Tu número de WhatsApp
          </label>
          <input
            id="wa-phone"
            className={styles.input}
            type="tel"
            inputMode="tel"
            placeholder="11 2345 6789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          <span className={styles.hint}>
            Con código de área, sin 0 ni 15. Lo guardamos para la próxima vez.
          </span>
          {error && <span className={styles.error}>{error}</span>}
          <button className={styles.send} type="submit" disabled={saving}>
            <FaWhatsapp aria-hidden /> {saving ? "Guardando…" : "Guardar y enviar"}
          </button>
        </form>
      )}
    </div>
  );
}
