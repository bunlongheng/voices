import { join } from "path";

// Where synthesized audio lives. Kept separate from the DB module so storage
// paths and the sqlite connection are independent concerns.
const PUB_AUDIO = join(process.cwd(), "public", "audio");

// on-disk path (written by the API) + public URL (read by the browser)
export const audioPath = (id: number | string) => join(PUB_AUDIO, `${id}.mp3`);
export const audioUrl = (id: number | string) => `/audio/${id}.mp3`;
export const audioDir = () => PUB_AUDIO;
