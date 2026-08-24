import { writeFileSync } from "fs";
import { join } from "path";
import db, { type TakeRow, type VoiceRow } from "./db";

// The live app writes to SQLite, but Vercel's serverless runtime has no writable
// DB. So every write also re-exports a static snapshot the deployed site reads:
//   public/takes.json  - saved takes (audio already lives in public/audio/*.mp3)
//   public/voices.json - custom voices the owner has loaded
// Committing these two files is what makes the read-only Vercel deploy work.
export function writeManifest(): void {
  const takes = db
    .prepare(
      "SELECT id,text,voice_id,voice_name,has_audio,duration_sec,char_count,stability,style,speed,created_at FROM takes WHERE has_audio=1 ORDER BY id DESC",
    )
    .all() as TakeRow[];
  const voices = db
    .prepare("SELECT id,name,descr,custom,created_at FROM voices WHERE custom=1 ORDER BY created_at DESC")
    .all() as VoiceRow[];

  const pub = join(process.cwd(), "public");
  writeFileSync(join(pub, "takes.json"), JSON.stringify(takes, null, 0));
  writeFileSync(join(pub, "voices.json"), JSON.stringify(voices, null, 0));
}
