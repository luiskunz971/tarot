import { resetAllUsage } from "@/lib/db";

export const runtime = "nodejs";

// Marca a todos como "todavía no consultó"
export async function POST() {
  const count = await resetAllUsage();
  return Response.json({ ok: true, count });
}
