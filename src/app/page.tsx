"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReadAloud from "@/components/ReadAloud";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import TarotCard from "@/components/TarotCard";
import { drawCards, MAJOR_ARCANA, POSITIONS, TOPICS, type DrawnCard } from "@/lib/cards";
import styles from "./page.module.css";

type Step = "name" | "focus" | "pick" | "reading";

type PublicPerson = { id: number; name: string; photoUrl: string | null; used: boolean; hasPhone: boolean };

export default function Home() {
  const [step, setStep] = useState<Step>("name");
  const [people, setPeople] = useState<PublicPerson[] | null>(null);
  const [peopleError, setPeopleError] = useState(false);
  const [personId, setPersonId] = useState<number | null>(null);
  const person = people?.find((p) => p.id === personId) ?? null;
  const name = person?.name ?? "";
  const [wantsQuestion, setWantsQuestion] = useState<boolean | null>(null);
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("");

  const [deck, setDeck] = useState<DrawnCard[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<PublicPerson[]>;
      })
      .then(setPeople)
      .catch(() => setPeopleError(true));
  }, []);

  const chosen = useMemo(
    () => picked.map((i, pos) => ({ ...deck[i], position: POSITIONS[pos] })),
    [picked, deck],
  );

  function startPicking() {
    setDeck(drawCards(MAJOR_ARCANA.length));
    setPicked([]);
    setRevealedCount(0);
    setReading("");
    setStep("pick");
  }

  function pickCard(index: number) {
    if (picked.includes(index) || picked.length >= 3) return;
    setPicked([...picked, index]);
  }

  async function revealAndRead() {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    setStep("reading");
    // Cuenta como consulta desde este momento
    if (personId !== null) {
      setPeople((list) => list?.map((p) => (p.id === personId ? { ...p, used: true } : p)) ?? list);
      void fetch(`/api/people/${personId}/use`, { method: "POST" }).catch(() => {});
    }
    // Las cartas se corren a la izquierda y se abre el panel de la lectura
    await wait(350);
    setSplit(true);
    await wait(1100);
    // Dar vuelta las cartas de a una
    for (let i = 1; i <= 3; i++) {
      setRevealedCount(i);
      await wait(900);
    }

    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          question: wantsQuestion ? question : undefined,
          topic: wantsQuestion ? undefined : topic,
          cards: chosen.map((c) => ({ id: c.id, reversed: c.reversed, position: c.position })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("respuesta inválida");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setReading(text);
      }
    } catch {
      setReading("Las energías están revueltas en este momento. Probá de nuevo en un ratito.");
    } finally {
      setLoading(false);
      setDone(true);
    }
  }

  function restart() {
    setQuestion("");
    setTopic("");
    setWantsQuestion(null);
    setStep("focus");
    setReading("");
    setDone(false);
    setSplit(false);
    setPicked([]);
    setRevealedCount(0);
  }

  const focusReady = wantsQuestion ? question.trim().length > 2 : topic !== "";

  return (
    <main className={styles.main}>
      <header className={`${styles.header} ${step === "pick" || step === "reading" ? styles.compact : ""}`}>
        <span className={styles.moon}>☾ ✦ ☽</span>
        <h1>Madam Esteves</h1>
        <p className={styles.tagline}>Las cartas conocen el camino</p>
      </header>

      {step === "name" && (
        <div className={`${styles.panel} ${styles.panelWide}`}>
          <p className={styles.speech}>
            Te doy la bienvenida, alma viajera. Antes de abrir las cartas, necesito saber… ¿quién consulta hoy?
          </p>

          {peopleError && <p className={styles.hint}>No pude cargar la lista. Probá recargar la página.</p>}
          {!people && !peopleError && <p className={styles.thinking}>Buscando a los consultantes ✦</p>}
          {people?.length === 0 && (
            <p className={styles.hint}>
              Todavía no hay personas cargadas. Agregalas desde <Link href="/admin">/admin</Link>.
            </p>
          )}

          {people && people.length > 0 && (
            <div
              className={styles.people}
              // Filas que ocupa la grilla con 6 columnas: las fotos se achican si hay más gente
              style={{ ["--rows" as string]: Math.max(2, Math.ceil(people.length / 6)) }}
            >
              {people.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.personTile} ${p.used ? "" : styles.unused} ${personId === p.id ? styles.active : ""}`}
                  onClick={() => setPersonId(p.id)}
                  aria-pressed={personId === p.id}
                >
                  <span className={styles.avatar}>
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" />
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className={styles.personName}>{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <button className={styles.button} disabled={!person} onClick={() => setStep("focus")}>
            Continuar
          </button>
        </div>
      )}

      {step === "focus" && (
        <div className={styles.panel}>
          <button className={styles.back} onClick={() => setStep("name")}>
            ← No soy {name}
          </button>
          <p className={styles.speech}>
            Hola, <strong>{name.trim()}</strong>. ¿Tenés una pregunta para las cartas, o preferís que
            te hablen sobre algún tema?
          </p>

          <div className={styles.choiceRow}>
            <button
              className={`${styles.choice} ${wantsQuestion === true ? styles.active : ""}`}
              onClick={() => setWantsQuestion(true)}
            >
              Tengo una pregunta
            </button>
            <button
              className={`${styles.choice} ${wantsQuestion === false ? styles.active : ""}`}
              onClick={() => setWantsQuestion(false)}
            >
              Elegir un tema
            </button>
          </div>

          {wantsQuestion === true && (
            <textarea
              className={styles.input}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribí tu pregunta con el corazón…"
              maxLength={500}
              rows={3}
              autoFocus
            />
          )}

          {wantsQuestion === false && (
            <>
              <p className={styles.hint}>¿Sobre qué tema te interesa saber?</p>
              <div className={styles.topics}>
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.topic} ${topic === t.label ? styles.active : ""}`}
                    onClick={() => setTopic(t.label)}
                  >
                    <span className={styles.topicIcon}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {wantsQuestion !== null && (
            <button className={styles.button} disabled={!focusReady} onClick={startPicking}>
              Barajar las cartas
            </button>
          )}
        </div>
      )}

      {step === "pick" && (
        <div className={styles.pickArea}>
          <p className={styles.speech}>
            Respirá hondo, {name.trim()}, y concentrate en{" "}
            {wantsQuestion ? "tu pregunta" : `lo que querés saber sobre ${topic.toLowerCase()}`}. Elegí{" "}
            <strong>{3 - picked.length}</strong> {3 - picked.length === 1 ? "carta" : "cartas"}.
          </p>

          <div className={styles.slots}>
            {POSITIONS.map((pos, i) => (
              <div key={pos} className={styles.slot}>
                {picked[i] !== undefined ? (
                  <div className={styles.landed}>
                    <TarotCard revealed={false} size="md" />
                  </div>
                ) : (
                  <div className={styles.emptySlot} />
                )}
                <span className={styles.slotLabel}>{pos}</span>
              </div>
            ))}
          </div>

          <div className={styles.fan}>
            {deck.map((card, i) => {
              const offset = i - (deck.length - 1) / 2;
              const isPicked = picked.includes(i);
              return (
                <button
                  key={card.id}
                  className={`${styles.fanCard} ${isPicked ? styles.fanPicked : ""}`}
                  style={{ ["--offset" as string]: offset, ["--i" as string]: i }}
                  onClick={() => pickCard(i)}
                  disabled={isPicked || picked.length >= 3}
                  aria-label={`Carta ${i + 1}`}
                >
                  <TarotCard revealed={false} size="sm" />
                </button>
              );
            })}
          </div>

          {picked.length === 3 && (
            <button className={`${styles.button} ${styles.glow}`} onClick={revealAndRead}>
              Revelar mi destino
            </button>
          )}
        </div>
      )}

      {step === "reading" && (
        <div className={`${styles.readingArea} ${split ? styles.split : ""}`}>
          <div className={styles.spread}>
            <div className={styles.slots}>
              {chosen.map((card, i) => (
                <div key={card.id} className={styles.slot}>
                  <TarotCard card={card} revealed={revealedCount > i} />
                  <span className={styles.slotLabel}>{card.position}</span>
                  <span className={`${styles.cardCaption} ${revealedCount > i ? styles.visible : ""}`}>
                    {card.name}
                    {card.reversed && <em> · invertida</em>}
                  </span>
                </div>
              ))}
            </div>

            {reading && done && (
              <div className={styles.tools}>
                <ReadAloud text={reading} />
                <ShareWhatsApp
                  personId={personId}
                  hasPhone={person?.hasPhone ?? false}
                  name={name.trim()}
                  reading={reading}
                  cards={chosen}
                />
              </div>
            )}
          </div>

          <div className={styles.readingPanel}>
            <div className={styles.reading}>
              {revealedCount < 3 && <p className={styles.hint}>Las cartas se están revelando…</p>}
              {revealedCount === 3 && loading && (
                <p className={styles.thinking}>Madam Esteves está leyendo tus cartas ✦</p>
              )}
              {reading && (
                <div className={styles.readingText}>
                  <ReadingText text={reading} />
                </div>
              )}
              {reading && done && (
                <div className={styles.choiceRow}>
                  <button className={styles.button} onClick={restart}>
                    Hacer otra consulta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>Solo para entretenimiento y reflexión ✦</footer>
    </main>
  );
}

// Muestra párrafos y convierte **texto** en negrita
function ReadingText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((para, i) => (
          <p key={i}>
            {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
              chunk.startsWith("**") && chunk.endsWith("**") ? (
                <strong key={j}>{chunk.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{chunk}</span>
              ),
            )}
          </p>
        ))}
    </>
  );
}
