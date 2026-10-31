import "server-only";
import { createClient, type Client } from "@libsql/client";

// En Vercel se usa Turso (SQLite en la nube) para que los datos sobrevivan a los deploys.
// En local, si no hay TURSO_DATABASE_URL, se usa el archivo local.db.

export type Person = {
  id: number;
  name: string;
  description: string;
  phone: string; // número de WhatsApp, tal como se cargó
  hasPhoto: boolean;
  updatedAt: number;
  usedAt: number | null; // última vez que tocó "Revelar mi destino"
  useCount: number;
  hidden: boolean; // oculto en la pantalla principal
};

let client: Client | null = null;
let ready: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url && process.env.VERCEL) {
    throw new Error("Falta TURSO_DATABASE_URL: en Vercel los archivos locales se borran en cada deploy.");
  }
  client = createClient({
    url: url ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

async function db(): Promise<Client> {
  const c = getClient();
  ready ??= c
    .execute(
      `CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        photo BLOB,
        photo_type TEXT,
        updated_at INTEGER NOT NULL
      )`,
    )
    .then(async () => {
      // Columnas agregadas después de la primera versión
      const cols = await c.execute("PRAGMA table_info(people)");
      const names = cols.rows.map((r) => String(r.name));
      const addColumn = async (sql: string) => {
        try {
          await c.execute(sql);
        } catch (err) {
          // Otra instancia pudo haberla agregado al mismo tiempo
          if (!String(err).includes("duplicate column")) throw err;
        }
      };
      if (!names.includes("used_at")) await addColumn("ALTER TABLE people ADD COLUMN used_at INTEGER");
      if (!names.includes("phone")) await addColumn("ALTER TABLE people ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
      if (!names.includes("use_count")) {
        await addColumn("ALTER TABLE people ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0");
      }
      if (!names.includes("hidden")) await addColumn("ALTER TABLE people ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0");
    })
    .catch((err) => {
      ready = null; // reintentar en el próximo pedido
      throw err;
    });
  await ready;
  return c;
}

function toPerson(row: Record<string, unknown>): Person {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    phone: String(row.phone ?? ""),
    hasPhoto: Number(row.has_photo) === 1,
    updatedAt: Number(row.updated_at),
    usedAt: row.used_at == null ? null : Number(row.used_at),
    useCount: Number(row.use_count ?? 0),
    hidden: Number(row.hidden ?? 0) === 1,
  };
}

const PERSON_COLUMNS =
  "id, name, description, phone, photo IS NOT NULL AS has_photo, updated_at, used_at, use_count, hidden";

export async function listPeople(): Promise<Person[]> {
  const c = await db();
  const res = await c.execute(`SELECT ${PERSON_COLUMNS} FROM people ORDER BY name COLLATE NOCASE`);
  return res.rows.map((r) => toPerson(r as Record<string, unknown>));
}

export async function getPerson(id: number): Promise<Person | null> {
  const c = await db();
  const res = await c.execute({ sql: `SELECT ${PERSON_COLUMNS} FROM people WHERE id = ?`, args: [id] });
  const row = res.rows[0];
  return row ? toPerson(row as Record<string, unknown>) : null;
}

export async function getPhoto(id: number): Promise<{ data: Uint8Array; type: string } | null> {
  const c = await db();
  const res = await c.execute({ sql: "SELECT photo, photo_type FROM people WHERE id = ?", args: [id] });
  const row = res.rows[0];
  if (!row || !row.photo) return null;
  return { data: new Uint8Array(row.photo as ArrayBuffer), type: String(row.photo_type ?? "image/jpeg") };
}

export type PhotoInput = { data: Uint8Array; type: string };

export type PersonInput = {
  name: string;
  description: string;
  phone: string;
  // undefined = no cambiar, null = borrar, PhotoInput = reemplazar
  photo: PhotoInput | null | undefined;
};

export async function createPerson(p: PersonInput): Promise<number> {
  const c = await db();
  const res = await c.execute({
    sql: "INSERT INTO people (name, description, phone, photo, photo_type, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [p.name, p.description, p.phone, p.photo?.data ?? null, p.photo?.type ?? null, Date.now()],
  });
  return Number(res.lastInsertRowid);
}

export async function updatePerson(id: number, p: PersonInput): Promise<boolean> {
  const c = await db();
  const res =
    p.photo === undefined
      ? await c.execute({
          sql: "UPDATE people SET name = ?, description = ?, phone = ?, updated_at = ? WHERE id = ?",
          args: [p.name, p.description, p.phone, Date.now(), id],
        })
      : await c.execute({
          sql: "UPDATE people SET name = ?, description = ?, phone = ?, photo = ?, photo_type = ?, updated_at = ? WHERE id = ?",
          args: [p.name, p.description, p.phone, p.photo?.data ?? null, p.photo?.type ?? null, Date.now(), id],
        });
  return res.rowsAffected > 0;
}

// Los datos de WhatsApp de una persona solo se usan si consultó hace poco,
// para que desde la página pública no se puedan leer ni cambiar los de otros.
const SHARE_WINDOW_MS = 2 * 60 * 60 * 1000;

export function consultedRecently(p: Person): boolean {
  return p.usedAt !== null && Date.now() - p.usedAt < SHARE_WINDOW_MS;
}

// Guarda el número solo si la persona todavía no tenía uno
export async function setPhoneIfEmpty(id: number, phone: string): Promise<boolean> {
  const c = await db();
  const res = await c.execute({
    sql: "UPDATE people SET phone = ? WHERE id = ? AND phone = ''",
    args: [phone, id],
  });
  return res.rowsAffected > 0;
}

export async function markUsed(id: number): Promise<boolean> {
  const c = await db();
  const res = await c.execute({
    sql: "UPDATE people SET used_at = ?, use_count = use_count + 1 WHERE id = ?",
    args: [Date.now(), id],
  });
  return res.rowsAffected > 0;
}

// Marca a mano si la persona ya consultó. Al desmarcar se borra también el contador.
export async function setUsed(id: number, used: boolean): Promise<boolean> {
  const c = await db();
  const res = used
    ? await c.execute({ sql: "UPDATE people SET used_at = ? WHERE id = ?", args: [Date.now(), id] })
    : await c.execute({ sql: "UPDATE people SET used_at = NULL, use_count = 0 WHERE id = ?", args: [id] });
  return res.rowsAffected > 0;
}

// Muestra u oculta a la persona en la pantalla principal
export async function setHidden(id: number, hidden: boolean): Promise<boolean> {
  const c = await db();
  const res = await c.execute({ sql: "UPDATE people SET hidden = ? WHERE id = ?", args: [hidden ? 1 : 0, id] });
  return res.rowsAffected > 0;
}

// Deja a todos como "todavía no consultó"
export async function resetAllUsage(): Promise<number> {
  const c = await db();
  const res = await c.execute("UPDATE people SET used_at = NULL, use_count = 0");
  return res.rowsAffected;
}

export async function deletePerson(id: number): Promise<boolean> {
  const c = await db();
  const res = await c.execute({ sql: "DELETE FROM people WHERE id = ?", args: [id] });
  return res.rowsAffected > 0;
}

export function photoUrl(p: Person): string | null {
  return p.hasPhoto ? `/api/people/${p.id}/photo?v=${p.updatedAt}` : null;
}
