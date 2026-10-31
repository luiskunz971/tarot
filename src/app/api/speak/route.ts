export const runtime = "nodejs";

// Voz argentina de Azure. Alternativa masculina: "es-AR-TomasNeural".
const VOICE = process.env.AZURE_SPEECH_VOICE || "es-AR-ElenaNeural";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    // Sin credenciales: el navegador usa su propia voz
    return Response.json({ error: "Voz de Azure no configurada." }, { status: 501 });
  }

  const { text } = (await req.json()) as { text?: string };
  const clean = (text ?? "").replace(/\*\*/g, "").trim().slice(0, 5000);
  if (!clean) {
    return Response.json({ error: "No hay texto para leer." }, { status: 400 });
  }

  // Pausas entre párrafos y un ritmo un poco más lento, como una tarotista
  const body = clean
    .split(/\n{2,}/)
    .map((p) => escapeXml(p.trim()))
    .filter(Boolean)
    .join('<break time="700ms"/>');

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-AR">
  <voice name="${VOICE}">
    <prosody rate="-10%" pitch="-2%">${body}</prosody>
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

  if (!res.ok) {
    console.error("Error de Azure TTS:", res.status, await res.text());
    return Response.json({ error: "No se pudo generar la voz." }, { status: 502 });
  }

  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
