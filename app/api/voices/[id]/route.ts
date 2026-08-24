import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authorized } from "@/lib/auth";
import { writeManifest } from "@/lib/manifest";

export const runtime = "nodejs";

// Remove a loaded (custom) voice. Premade voices live in code and can't be deleted.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const row = db.prepare("SELECT id FROM voices WHERE id=? AND custom=1").get(id) as { id: string } | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  db.prepare("DELETE FROM voices WHERE id=?").run(id);
  writeManifest();
  return NextResponse.json({ ok: true });
}
