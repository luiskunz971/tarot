"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import type { DrawnCard } from "@/lib/cards";
import styles from "./ShareWhatsApp.module.css";

type Props = {
  name: string;
  reading: string;
  cards: DrawnCard[];
};

// Arma el mensaje con el formato de WhatsApp (*negrita*)
function buildMessage(name: string, reading: string, cards: DrawnCard[]): string {
  const spread = cards
    .map((c) => `${c.position}: *${c.name}*${c.reversed ? " (invertida)" : ""}`)
    .join("\n");
  const body = reading.replace(/\*\*(.+?)\*\*/g, "*$1*");
  return `🔮 *Lectura de tarot de ${name} con Madam Esteves*\n\n${spread}\n\n${body}`;
}

// Normaliza un número argentino al formato de wa.me (549 + código de área + número)
function toWaNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  digits = digits.replace(/^0/, ""); // 011... -> 11...
  return `549${digits}`;
}

export default function ShareWhatsApp({ name, reading, cards }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");

  function send() {
    const number = toWaNumber(phone);
    const text = encodeURIComponent(buildMessage(name, reading, cards));
    // Sin número, WhatsApp deja elegir el contacto
    window.open(`https://wa.me/${number}?text=${text}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.button} onClick={() => setOpen(!open)} aria-expanded={open}>
        <FaWhatsapp className={styles.icon} aria-hidden />
        Enviar por WhatsApp
      </button>

      {open && (
        <form
          className={styles.popover}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className={styles.label} htmlFor="wa-phone">
            Número de WhatsApp
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
          <span className={styles.hint}>Con código de área, sin 0 ni 15. Vacío para elegir el contacto.</span>
          <button className={styles.send} type="submit">
            <FaWhatsapp aria-hidden /> Enviar
          </button>
        </form>
      )}
    </div>
  );
}
