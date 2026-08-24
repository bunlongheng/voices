// Re-export the static snapshot (public/takes.json + public/voices.json) that the
// read-only Vercel deploy reads. Run after editing the DB outside the API, or to
// regenerate the committed manifest. Usage: npm run export:manifest
import { writeManifest } from "@/lib/manifest";

writeManifest();
console.log("wrote public/takes.json and public/voices.json");
