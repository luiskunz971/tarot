import type { DrawnCard } from "./cards";

// Lectura simple armada con los significados del mazo.
// Se usa cuando no hay ANTHROPIC_API_KEY configurada.
export function fallbackReading(name: string, focus: string, cards: DrawnCard[]): string {
  const lines = [
    `${name}, las cartas se abrieron para hablarte sobre ${focus}.`,
    ...cards.map((c) => {
      const meaning = c.reversed ? c.meaningRev : c.meaningUp;
      const orientation = c.reversed ? " (invertida)" : "";
      return `**${c.position} — ${c.name}${orientation}:** esta carta trae ${meaning}.`;
    }),
    "Mirá cómo se conectan: lo que viviste da forma a tu presente, y lo que hagas hoy abre el camino que muestra la última carta. Confiá en tu intuición.",
  ];
  return lines.join("\n\n");
}
