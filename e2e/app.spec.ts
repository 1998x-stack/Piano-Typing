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
  const stored = await page.evaluate(async () => {
    return new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open("piano-typing", 2);
      request.onsuccess = () => {
        const tx = request.result.transaction("compositions", "readonly");
        const all = tx.objectStore("compositions").getAll();
        all.onsuccess = () => resolve(all.result);
        all.onerror = () => reject(all.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  expect(JSON.stringify(stored)).not.toContain("private phrase");

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


test("supports character layout and custom scale controls", async ({ page }) => {
  await page.getByLabel("Keyboard mapping").selectOption("character");
  await page.getByLabel("Scale", { exact: true }).selectOption("custom");
  await page.getByLabel("Scale intervals (semitones)").fill("0, 3, 7");
  await page.getByRole("button", { name: "Apply scale" }).click();
  await page.getByLabel("Root note").selectOption("65");
  const input = page.getByLabel("Type here");
  await input.pressSequentially("az");
  await expect(page.getByTestId("notes-count")).toHaveText("2");
  await page.reload();
  await expect(page.getByLabel("Keyboard mapping")).toHaveValue("character");
  await expect(page.getByLabel("Scale", { exact: true })).toHaveValue("custom");
  await expect(page.getByLabel("Root note")).toHaveValue("65");
});

test("commits Chinese IME characters once without interim synthetic notes", async ({ page }) => {
  const input = page.getByLabel("Type here");
  await input.dispatchEvent("compositionstart", { data: "" });
  await input.dispatchEvent("keydown", { key: "z", code: "KeyZ", isComposing: true });
  await expect(page.getByTestId("notes-count")).toHaveText("0");
  await input.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent("compositionend", {
      bubbles: true, cancelable: true, data: "中文"
    }));
  });
  await expect(page.getByTestId("notes-count")).toHaveText("2");
});


test("renames, exports MIDI, and deletes a saved composition", async ({ page }) => {
  await page.getByLabel("Type here").pressSequentially("studio");
  await page.getByRole("button", { name: "Save composition" }).click();
  await expect(page.getByText("Untitled composition")).toBeVisible();
  await page.getByRole("button", { name: "Rename Untitled composition" }).click();
  await page.getByRole("textbox", { name: /Rename composition/ }).fill("My first melody");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByText("My first melody")).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export My first melody as MIDI" }).click()
  ]);
  expect(download.suggestedFilename()).toBe("My-first-melody.mid");
  await page.getByRole("button", { name: "Delete My first melody" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByText("My first melody")).toHaveCount(0);
});

test("migrates legacy localStorage compositions to versioned IndexedDB", async ({ page }) => {
  const legacy = [{
    id: "legacy-a", title: "Legacy melody", createdAt: "2026-11-17T10:00:00.000Z",
    durationMs: 500, preset: "felt-piano",
    notes: [{ id: "note-a", code: "KeyA", midi: 60, atMs: 0, durationMs: 400 }]
  }];
  await page.evaluate((items) => localStorage.setItem("piano-typing.compositions.v1", JSON.stringify(items)), legacy);
  await page.reload();
  await expect(page.getByText("Legacy melody")).toBeVisible();
  await expect.poll(async () => page.evaluate(
    () => localStorage.getItem("piano-typing.compositions.v1")
  )).toBeNull();
});
