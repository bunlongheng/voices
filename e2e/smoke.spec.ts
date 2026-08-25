import { test, expect } from "@playwright/test";

// Smoke test of the read-only library that works on any deploy: the voice
// bubbles render, the committed manifest + audio serve, and the theme toggles.
test("library renders a voice bubble per take with audio", async ({ page, request }) => {
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

test("theme toggle flips the document theme", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  await page.getByRole("button", { name: /switch to (light|dark) theme/i }).click();
  await expect(html).not.toHaveAttribute("data-theme", before || "dark");
});
