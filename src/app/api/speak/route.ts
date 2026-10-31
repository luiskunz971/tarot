import { Readable } from "node:stream";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

// Voz argentina. Alternativa masculina: "es-AR-TomasNeural".
const VOICE = process.env.TTS_VOICE || process.env.AZURE_SPEECH_VOICE || "es-AR-ElenaNeural";

// Un ritmo un poco más lento, como una tarotista
const RATE = "-10%";
const PITCH = "-2%";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => escapeXml(p.trim()))
    .filter(Boolean);
}

const audioHeaders = { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" };

// Voz gratuita: el servicio de "Leer en voz alta" de Microsoft Edge. No pide clave.
// No acepta SSML propio (por ejemplo <break>), así que las pausas salen de los saltos de párrafo.
async function speakWithEdge(text: string): Promise<Response> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(paragraphs(text).join("\n\n"), { rate: RATE, pitch: PITCH });

  // Juntamos el audio entero antes de responder: si el servicio falla a mitad,
  // devolvemos un error y el navegador usa su propia voz.
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of audioStream as Readable) chunks.push(chunk as Buffer);
  } finally {
    tts.close();
  }
  return new Response(new Uint8Array(Buffer.concat(chunks)), { headers: audioHeaders });
}

// Voz de Azure (opcional): se usa si están configuradas AZURE_SPEECH_KEY y AZURE_SPEECH_REGION.
async function speakWithAzure(text: string, key: string, region: string): Promise<Response> {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-AR">
  <voice name="${VOICE}">
    <prosody rate="${RATE}" pitch="${PITCH}">${paragraphs(text).join('<break time="700ms"/>')}</prosody>
  </voice>
</speak>`;

  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
      "User-Agent": "madame-selene-tarot",
    },
    body: ssml,
  });

  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  return new Response(res.body, { headers: audioHeaders });
}

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  const clean = (text ?? "").replace(/\*\*/g, "").trim().slice(0, 5000);
  if (!clean) {
    return Response.json({ error: "No hay texto para leer." }, { status: 400 });
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  try {
    return key && region ? await speakWithAzure(clean, key, region) : await speakWithEdge(clean);
  } catch (err) {
    // El navegador usa su propia voz si esto falla
    console.error("Error al generar la voz:", err);
    return Response.json({ error: "No se pudo generar la voz." }, { status: 502 });
  }
}
