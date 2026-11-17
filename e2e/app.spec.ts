import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads the studio and supports natural typing", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /let your hands make music/i })).toBeVisible();

  const input = page.getByLabel("Type here");
  await input.pressSequentially("abc");

  await expect(page.getByTestId("keystroke-count")).toHaveText("3");
  await expect(page.getByTestId("notes-count")).toHaveText("3");
  await expect(page.getByTestId("active-key")).toHaveText("C");
});

test("switches to Typing Flow and keeps text input available", async ({ page }) => {
  await page.getByRole("button", { name: "Typing Flow" }).click();
  await expect(page.getByText("The quiet morning begins with a single note.")).toBeVisible();

  const input = page.getByLabel("Type here");
  await input.pressSequentially("The ");
  await expect(page.getByText(/accuracy compares each typed character/i)).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
});

test("allows the keyboard map to collapse and expand", async ({ page }) => {
  await expect(page.getByRole("group", { name: "QWERTY keyboard note map" })).toBeVisible();
  await page.getByRole("button", { name: "Hide keyboard" }).click();
  await expect(page.getByRole("group", { name: "QWERTY keyboard note map" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show keyboard" }).click();
  await expect(page.getByRole("group", { name: "QWERTY keyboard note map" })).toBeVisible();
});

test("saves composition events locally without persisting source text", async ({ page }) => {
  const input = page.getByLabel("Type here");
  await input.pressSequentially("private phrase");
  await page.getByRole("button", { name: "Save composition" }).click();

  await expect(page.getByText("Untitled composition")).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem("piano-typing.compositions.v1"));
  expect(stored).not.toContain("private phrase");

  await page.reload();
  await expect(page.getByText("Untitled composition")).toBeVisible();
});

test("mute control does not disable typing", async ({ page }) => {
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect(page.getByRole("button", { name: "Unmute sound" })).toBeVisible();

  const input = page.getByLabel("Type here");
  await input.pressSequentially("still works");
  await expect(page.getByTestId("keystroke-count")).toHaveText("11");
});
