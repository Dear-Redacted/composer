import { test, expect } from "@playwright/test";

test.describe("Redacted Confessional E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#main-editor");
  });

  test("new document initializes and save stores modified content", async ({
    page,
  }) => {
    // 1. Open new document flow and confirm
    await page.click("#nav-new");
    await page.click('button:has-text("New Document")');

    const editor = page.locator("#main-editor");
    await expect(editor).toHaveValue("Dear ");

    // 2. Type some normal text
    await editor.pressSequentially("Diary, today was a good day.", {
      delay: 20,
    });

    // 3. Save document and verify localStorage key contains the NEW text
    await page.click("#nav-save");
    const saved = await page.evaluate(() => localStorage.getItem("untitled"));
    expect(saved).toBe("Dear Diary, today was a good day.");
  });

  test("redacts forbidden words dynamically and shows deviation alert", async ({
    page,
  }) => {
    const editor = page.locator("#main-editor");

    // Position cursor at the end and type a forbidden word
    // (Assuming "Scandal" is a forbidden word based on your unit tests)
    // We add a space at the end because your new logic requires a word boundary to trigger!
    await editor.pressSequentially("This is a huge Scandal ", { delay: 50 });

    // 1. Verify the text was redacted (1:1 character swap)
    await expect(editor).toHaveValue("Dear This is a huge ███████ ");

    // 2. Verify the deviation UI triggered
    // Based on App.tsx, the status bar text changes
    const statusText = page.locator(".status-bar");
    await expect(statusText).toContainText(/Deviation Detected/i);

    // Optional: Wait for the timeout to clear the deviation (1.2 seconds in useRedaction)
    await page.waitForTimeout(1300);
    await expect(statusText).toContainText(/Terminal: Connected/i);
  });
});
