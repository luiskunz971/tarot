export type TarotCard = {
  id: number;
  numeral: string;
  name: string;
  symbol: string;
  meaningUp: string;
  meaningRev: string;
};

export type DrawnCard = TarotCard & {
  reversed: boolean;
  position: string;
};

// Los 22 Arcanos Mayores
export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, numeral: "0", name: "El Loco", symbol: "✦", meaningUp: "nuevos comienzos, espontaneidad, salto de fe", meaningRev: "imprudencia, miedo a empezar, falta de rumbo" },
  { id: 1, numeral: "I", name: "El Mago", symbol: "∞", meaningUp: "voluntad, habilidad, poder de manifestar", meaningRev: "manipulación, talento desaprovechado, dispersión" },
  { id: 2, numeral: "II", name: "La Sacerdotisa", symbol: "☾", meaningUp: "intuición, misterio, sabiduría interior", meaningRev: "secretos, desconexión de la intuición, superficialidad" },
  { id: 3, numeral: "III", name: "La Emperatriz", symbol: "♀", meaningUp: "abundancia, fertilidad, creatividad, cuidado", meaningRev: "bloqueo creativo, dependencia, descuido de uno mismo" },
  { id: 4, numeral: "IV", name: "El Emperador", symbol: "♔", meaningUp: "estructura, autoridad, estabilidad", meaningRev: "rigidez, control excesivo, falta de disciplina" },
  { id: 5, numeral: "V", name: "El Hierofante", symbol: "⚷", meaningUp: "tradición, guía espiritual, aprendizaje", meaningRev: "rebeldía, cuestionar normas, dogmatismo" },
  { id: 6, numeral: "VI", name: "Los Enamorados", symbol: "♡", meaningUp: "amor, unión, elecciones importantes", meaningRev: "desequilibrio, indecisión, valores en conflicto" },
  { id: 7, numeral: "VII", name: "El Carro", symbol: "➶", meaningUp: "determinación, victoria, avance", meaningRev: "falta de control, obstáculos, dirección perdida" },
  { id: 8, numeral: "VIII", name: "La Fuerza", symbol: "♌", meaningUp: "coraje, paciencia, fuerza interior", meaningRev: "inseguridad, impulsividad, dudas" },
  { id: 9, numeral: "IX", name: "El Ermitaño", symbol: "✧", meaningUp: "introspección, búsqueda interior, soledad elegida", meaningRev: "aislamiento, retraimiento, perderse en uno mismo" },
  { id: 10, numeral: "X", name: "La Rueda de la Fortuna", symbol: "☸", meaningUp: "ciclos, destino, cambio favorable", meaningRev: "mala racha, resistencia al cambio, estancamiento" },
  { id: 11, numeral: "XI", name: "La Justicia", symbol: "⚖", meaningUp: "equilibrio, verdad, causa y efecto", meaningRev: "injusticia, evasión de responsabilidades, parcialidad" },
  { id: 12, numeral: "XII", name: "El Colgado", symbol: "⟁", meaningUp: "pausa, nueva perspectiva, entrega", meaningRev: "estancamiento, sacrificio inútil, resistencia" },
  { id: 13, numeral: "XIII", name: "La Muerte", symbol: "☠", meaningUp: "transformación, final necesario, renacer", meaningRev: "miedo al cambio, aferrarse al pasado" },
  { id: 14, numeral: "XIV", name: "La Templanza", symbol: "⚱", meaningUp: "armonía, moderación, paciencia", meaningRev: "exceso, desequilibrio, impaciencia" },
  { id: 15, numeral: "XV", name: "El Diablo", symbol: "⛧", meaningUp: "apegos, tentación, ataduras", meaningRev: "liberación, romper cadenas, recuperar el poder" },
  { id: 16, numeral: "XVI", name: "La Torre", symbol: "ϟ", meaningUp: "cambio repentino, revelación, derrumbe de lo falso", meaningRev: "evitar el desastre, miedo al cambio, crisis postergada" },
  { id: 17, numeral: "XVII", name: "La Estrella", symbol: "★", meaningUp: "esperanza, inspiración, sanación", meaningRev: "desánimo, falta de fe, desconexión" },
  { id: 18, numeral: "XVIII", name: "La Luna", symbol: "☽", meaningUp: "ilusión, sueños, lo inconsciente", meaningRev: "claridad que llega, miedos que se disipan, confusión" },
  { id: 19, numeral: "XIX", name: "El Sol", symbol: "☀", meaningUp: "alegría, éxito, vitalidad", meaningRev: "optimismo nublado, alegría postergada" },
  { id: 20, numeral: "XX", name: "El Juicio", symbol: "♆", meaningUp: "despertar, renovación, llamado interior", meaningRev: "autocrítica, dudas, no escuchar el llamado" },
  { id: 21, numeral: "XXI", name: "El Mundo", symbol: "◯", meaningUp: "plenitud, logro, cierre de ciclo", meaningRev: "algo inconcluso, falta de cierre, atajos" },
];

export const POSITIONS = ["Pasado", "Presente", "Futuro"] as const;

export const TOPICS = [
  { id: "amor", label: "Amor", icon: "♡" },
  { id: "trabajo", label: "Trabajo", icon: "⚒" },
  { id: "dinero", label: "Dinero", icon: "✦" },
  { id: "salud", label: "Salud", icon: "❀" },
  { id: "familia", label: "Familia", icon: "⌂" },
  { id: "crecimiento", label: "Crecimiento personal", icon: "☾" },
] as const;

export function drawCards(count = 3): DrawnCard[] {
  const deck = [...MAJOR_ARCANA];
  // Fisher–Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count).map((card, i) => ({
    ...card,
    reversed: Math.random() < 0.3,
    position: POSITIONS[i],
  }));
}

// Ilustración de cada carta, guardada en public/cards/
export function cardImage(id: number): string {
  return `/cards/${String(id).padStart(2, "0")}.png`;
}
