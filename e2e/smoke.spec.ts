import { test, expect } from "@playwright/test";

// Smoke test of the core read-only flow that works on any deploy: the playground
// loads, voices render, the library shows the committed takes, and audio serves.
test("playground loads with voices and the speak control", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("voices", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /speak/i })).toBeVisible();
  // premade voices are always present
  await expect(page.getByText("Rachel")).toBeVisible();
  await expect(page.getByText("Daniel")).toBeVisible();
  // the three delivery sliders
  for (const s of ["stability", "style", "speed"]) {
    await expect(page.getByRole("slider", { name: s })).toBeVisible();
  }
});

test("library tab lists saved takes and serves their audio", async ({ page, request }) => {
  await page.goto("/?tab=library");
  const cards = page.getByRole("button", { name: "Play" });
  await expect(cards.first()).toBeVisible();
  // the committed manifest drives the read-only deploy
  const manifest = await request.get("/takes.json");
  expect(manifest.ok()).toBeTruthy();
  const takes = (await manifest.json()) as Array<{ id: number }>;
  expect(takes.length).toBeGreaterThan(0);
  // the first take's audio file actually serves
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
