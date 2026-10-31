import Anthropic from "@anthropic-ai/sdk";
import { MAJOR_ARCANA, type DrawnCard } from "@/lib/cards";
import { getPerson } from "@/lib/db";
import { fallbackReading } from "@/lib/fallbackReading";

export const runtime = "nodejs";

type ReadingRequest = {
  personId: number;
  question?: string;
  topic?: string;
  cards: { id: number; reversed: boolean; position: string }[];
};

const SYSTEM_PROMPT = `Sos Madam Esteves, una tarotista cálida, mística y cercana. Hablás en español rioplatense (voseo), con un tono poético pero claro.

Vas a recibir el nombre de la persona, a veces una descripción de quién es, su pregunta o el tema que le interesa, y tres Arcanos Mayores en una tirada Pasado / Presente / Futuro (algunas pueden estar invertidas).

Cómo escribir la lectura:
- Saludá a la persona por su nombre.
- Si hay una descripción, usala para que la lectura se sienta hecha a su medida: mencioná detalles de su vida con naturalidad, como si la conocieras, sin repetir la descripción textual.
- Interpretá cada carta en su posición, conectándola con la pregunta o el tema. Tené en cuenta si está invertida.
- Después tejé las tres cartas en un mensaje integrado y cerrá con un consejo concreto y esperanzador.
- Usá **negrita** para el nombre de cada carta. No uses títulos con #.
- Entre 250 y 400 palabras.
- Es entretenimiento y reflexión: no hagas predicciones médicas, legales ni financieras tajantes; si el tema es salud o dinero, sugerí con suavidad consultar a un profesional.`;

export async function POST(req: Request) {
  const body = (await req.json()) as ReadingRequest;
  const person = Number.isInteger(body.personId) ? await getPerson(body.personId) : null;
  if (!person) {
    return Response.json({ error: "Elegí quién consulta." }, { status: 400 });
  }
  const name = person.name;
  const question = (body.question ?? "").trim().slice(0, 500);
  const topic = (body.topic ?? "").trim().slice(0, 60);

  const cards: DrawnCard[] = (body.cards ?? []).slice(0, 3).flatMap((c) => {
    const card = MAJOR_ARCANA.find((m) => m.id === c.id);
    return card ? [{ ...card, reversed: Boolean(c.reversed), position: String(c.position) }] : [];
  });

  if (cards.length !== 3) {
    return Response.json({ error: "Faltan datos para la lectura." }, { status: 400 });
  }

  const focus = question ? `tu pregunta: "${question}"` : `el tema ${(topic || "general").toLowerCase()}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(fallbackReading(name, focus, cards), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const spread = cards
    .map((c) => `- ${c.position}: ${c.name}${c.reversed ? " (invertida)" : ""}`)
    .join("\n");

  const userMessage = `Nombre: ${name}
${person.description ? `Sobre ${name}: ${person.description}\n` : ""}${question ? `Pregunta: ${question}` : `Tema que le interesa: ${topic || "general"}`}

Tirada:
${spread}`;

  // Las API keys que no están asociadas a un workspace necesitan indicar cuál usar.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {},
  );
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = client.beta.messages.stream({
          model: "claude-sonnet-5-5",
          max_tokens: 4000,
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await msgStream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n" + fallbackReading(name, focus, cards)));
        }
      } catch (err) {
        console.error("Error al generar la lectura:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n(Las energías se nublaron un momento… te dejo una lectura más simple.)\n\n" +
              fallbackReading(name, focus, cards),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
