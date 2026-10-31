"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ReadAloud.module.css";

type Status = "idle" | "loading" | "speaking";

// Voces del navegador, por si no está configurada la voz argentina de Azure
const PREFERRED_VOICES = ["Paulina", "Mónica", "Monica", "Marisol", "Sabina", "Helena", "Laura", "Elvira", "Dalia", "Google español"];

function pickBrowserVoice(): SpeechSynthesisVoice | undefined {
  const spanish = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  const argentine = spanish.find((v) => v.lang === "es-AR");
  if (argentine) return argentine;
  for (const name of PREFERRED_VOICES) {
    const v = spanish.find((s) => s.name.includes(name));
    if (v) return v;
  }
  return spanish[0];
}

// Divide en oraciones: Chrome corta las frases largas si se leen de una sola vez.
function toSentences(text: string): string[] {
  const clean = text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return clean.match(/[^.!?…]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
}

export default function ReadAloud({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioTextRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function stop() {
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("idle");
  }

  function playAudio(url: string) {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
    audio.onended = () => setStatus("idle");
    audio.onerror = () => setStatus("idle");
    setStatus("speaking");
    void audio.play();
  }

  function speakWithBrowser() {
    if (!("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const voice = pickBrowserVoice();
    const sentences = toSentences(text);
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = voice?.lang ?? "es-AR";
      if (voice) u.voice = voice;
      u.rate = 0.88;
      u.pitch = 0.95;
      if (i === sentences.length - 1) u.onend = () => setStatus("idle");
      u.onerror = () => setStatus("idle");
      synth.speak(u);
    });
    setStatus("speaking");
  }

  async function speak() {
    // Si ya generamos el audio de este texto, lo reproducimos de nuevo
    if (audioUrlRef.current && audioTextRef.current === text) {
      playAudio(audioUrlRef.current);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("sin voz de Azure");
      const blob = await res.blob();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = URL.createObjectURL(blob);
      audioTextRef.current = text;
      playAudio(audioUrlRef.current);
    } catch {
      speakWithBrowser();
    }
  }

  const label =
    status === "loading"
      ? "Madam Esteves se prepara…"
      : status === "speaking"
        ? "■ Detener"
        : "▶ Que Madam Esteves te lo lea";

  return (
    <div className={styles.wrap}>
      <div className={`${styles.avatar} ${status !== "idle" ? styles.speaking : ""}`} aria-hidden>
        <span className={styles.crystal}>🔮</span>
      </div>
      <button
        className={styles.button}
        onClick={status === "speaking" ? stop : speak}
        disabled={status === "loading"}
      >
        {label}
      </button>
    </div>
  );
}
