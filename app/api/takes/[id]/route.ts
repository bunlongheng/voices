import { NextRequest, NextResponse } from "next/server";
import { existsSync, rmSync } from "fs";
import db, { type TakeRow } from "@/lib/db";
import { audioPath } from "@/lib/audio";
import { authorized } from "@/lib/auth";
import { writeManifest } from "@/lib/manifest";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = db.prepare("SELECT * FROM takes WHERE id=?").get(id) as TakeRow | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const row = db.prepare("SELECT id FROM takes WHERE id=?").get(id) as { id: number } | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  db.prepare("DELETE FROM takes WHERE id=?").run(id);
  const p = audioPath(id);
  if (existsSync(p)) rmSync(p);
  writeManifest();
  return NextResponse.json({ ok: true });
}
