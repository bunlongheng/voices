import { test, expect } from "@playwright/test";

// Smoke test of the read-only library: the voice circles render (one per take),
// tapping one opens its detail page with the full text, and the audio serves.
test("tapping a voice circle opens its detail with the text", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("voices", { exact: false }).first()).toBeVisible();

  const manifest = await request.get("/takes.json");
  expect(manifest.ok()).toBeTruthy();
  const takes = (await manifest.json()) as Array<{ id: number; voice_name: string; text: string }>;
  expect(takes.length).toBeGreaterThan(0);
  const first = takes[0];

  // a tappable circle per take, labelled by its voice
  const circle = page.getByRole("button", { name: new RegExp(`Open ${first.voice_name}`, "i") });
  await expect(circle.first()).toBeVisible();

  // tapping opens the detail page showing the take's full text
  // (force: the circles float by design, so the target never fully "settles")
  await circle.first().click({ force: true });
  await expect(page.getByText(first.text.slice(0, 40))).toBeVisible();
  await expect(page.getByRole("button", { name: /back to voices/i })).toBeVisible();

  // the audio serves
  const audio = await request.get(`/audio/${first.id}.mp3`);
  expect(audio.ok()).toBeTruthy();
  expect(audio.headers()["content-type"]).toContain("audio");
});
