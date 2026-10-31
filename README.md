# Madam Esteves · Tarot

Una tarotista virtual hecha con Next.js + TypeScript. Te pide tu nombre, te pregunta qué querés consultar (una pregunta propia o un tema), te deja elegir 3 cartas de un abanico de Arcanos Mayores, las da vuelta y te hace una lectura personalizada **Pasado / Presente / Futuro**.

La lectura la escribe Claude (`claude-sonnet-5-5`) y aparece en pantalla a medida que se genera. Si no hay API key configurada, la app arma una lectura simple con los significados de las cartas.

## Cómo correrla

```bash
npm install
cp .env.example .env.local   # y poné tu ANTHROPIC_API_KEY
npm run dev
```

Abrí http://localhost:3000.

## Estructura

- `src/app/page.tsx`: los pasos de la consulta (nombre → pregunta o tema → elegir cartas → lectura).
- `src/components/TarotCard.tsx`: la carta con la animación de vuelta.
- `src/lib/cards.ts`: los 22 Arcanos Mayores, sus significados y el barajado.
- `src/app/api/reading/route.ts`: genera la lectura con Claude y la envía en streaming.
- `src/lib/fallbackReading.ts`: lectura de respaldo sin API key.
- `src/lib/db.ts`: base de datos de consultantes (Turso / SQLite).
- `src/app/admin/page.tsx`: panel para cargar consultantes.
- `src/middleware.ts`: protege /admin con contraseña.

## Voz argentina

El botón "Que Madam Esteves te lo lea" usa la voz `es-AR-ElenaNeural` de Azure Speech. Para activarla:

1. Creá un recurso **Speech** en el portal de Azure (el plan gratis F0 alcanza).
2. Copiá la *Key* y la *Region* en `.env.local` como `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`.

Sin esas variables, la app usa la voz del navegador.

## Consultantes y panel /admin

En la primera pantalla se elige quién consulta de una lista. Las personas se cargan en **/admin** (nombre, descripción y foto). La descripción se le pasa a Madam Esteves para personalizar la lectura y nunca se muestra en la parte pública.

- `/admin` pide usuario y contraseña: el usuario puede ser cualquiera y la contraseña es `ADMIN_PASSWORD`.
- Los datos se guardan en SQLite: en local, en el archivo `local.db`; en Vercel, en **Turso** (SQLite en la nube), así no se pierden con cada deploy.
- Las fotos se achican a 400 px antes de subirlas y se guardan en la misma base.

### Deploy en Vercel

1. En el proyecto de Vercel, andá a **Storage → Marketplace → Turso** y creá una base (plan gratis). Eso agrega `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` a las variables de entorno. También podés crear la base en turso.tech y cargar esas dos variables a mano.
2. Agregá `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY` (y `ANTHROPIC_WORKSPACE_ID`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` si los usás).
3. Hacé deploy. La tabla se crea sola la primera vez.

## Voz

La lectura en voz alta usa la voz argentina `es-AR-ElenaNeural` a través del servicio gratuito de "Leer en voz alta" de Microsoft Edge (paquete `msedge-tts`), sin necesidad de API key. Funciona en cualquier navegador porque el audio se genera en el servidor.

- Para la voz masculina, poné `TTS_VOICE=es-AR-TomasNeural` en `.env.local`.
- Si configurás `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`, se usa Azure (más estable, con pausas entre párrafos).
- Si el servidor no puede generar la voz, el navegador lee con su propia voz.
