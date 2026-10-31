"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import type { DrawnCard } from "@/lib/cards";
import { toWaNumber } from "@/lib/phone";
import styles from "./ShareWhatsApp.module.css";

type Props = {
  personId: number | null;
  hasPhone: boolean; // si la persona tiene su WhatsApp cargado en /admin
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

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function ShareWhatsApp({ personId, hasPhone, name, reading, cards }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");

  const text = () => encodeURIComponent(buildMessage(name, reading, cards));

  // Al número guardado de la persona (el servidor lo busca, no se expone en la página)
  function sendToPerson() {
    openInNewTab(`/api/people/${personId}/whatsapp?text=${text()}`);
    setOpen(false);
  }

  // A otro número, o sin número para elegir el contacto en WhatsApp
  function sendToOther() {
    openInNewTab(`https://wa.me/${toWaNumber(phone)}?text=${text()}`);
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button
        className={styles.button}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Enviar la lectura por WhatsApp"
      >
        <FaWhatsapp className={styles.icon} aria-hidden />
        Enviar
      </button>

      {open && (
        <form
          className={styles.popover}
          onSubmit={(e) => {
            e.preventDefault();
            sendToOther();
          }}
        >
          {hasPhone && personId !== null && (
            <>
              <button type="button" className={styles.send} onClick={sendToPerson}>
                <FaWhatsapp aria-hidden /> Enviar al WhatsApp de {name}
              </button>
              <span className={styles.divider}>o a otro número</span>
            </>
          )}
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
            autoFocus={!hasPhone}
          />
          <span className={styles.hint}>Con código de área, sin 0 ni 15. Vacío para elegir el contacto.</span>
          <button className={hasPhone ? styles.sendSecondary : styles.send} type="submit">
            <FaWhatsapp aria-hidden /> Enviar
          </button>
        </form>
      )}
    </div>
  );
}
