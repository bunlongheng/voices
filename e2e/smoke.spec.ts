import { test, expect } from "@playwright/test";

// Smoke test of the read-only library that works on any deploy: the voice
// circles render (one per take, labelled by voice) and the audio serves.
test("library renders a voice circle per take with audio", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("voices", { exact: false }).first()).toBeVisible();

  // the committed manifest drives the read-only deploy
  const manifest = await request.get("/takes.json");
  expect(manifest.ok()).toBeTruthy();
  const takes = (await manifest.json()) as Array<{ id: number; voice_name: string }>;
  expect(takes.length).toBeGreaterThan(0);

  // one tappable circle per take, labelled by its voice
  const bubble = page.getByRole("button", { name: new RegExp(`Play ${takes[0].voice_name}`, "i") });
  await expect(bubble.first()).toBeVisible();

  // the first take's audio actually serves
  const audio = await request.get(`/audio/${takes[0].id}.mp3`);
  expect(audio.ok()).toBeTruthy();
  expect(audio.headers()["content-type"]).toContain("audio");
});
