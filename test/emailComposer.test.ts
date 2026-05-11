import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGmailComposeUrl, openGmailCompose } from "../src/utils/emailComposer";

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).redactedComposer;
});

describe("buildGmailComposeUrl", () => {
  it("encodes the recipient, subject, and body", () => {
    const url = buildGmailComposeUrl("person@example.com", "Dear ███");
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://mail.google.com");
    expect(parsed.searchParams.get("to")).toBe("person@example.com");
    expect(parsed.searchParams.get("su")).toBe("Dear Redacted");
    expect(parsed.searchParams.get("body")).toContain("Dear ███");
    expect(parsed.searchParams.get("body")).toContain("wrote with Dear Redacted Composer");
  });
});

describe("openGmailCompose", () => {
  it("uses the Electron bridge when available", async () => {
    const openGmailCompose_mock = vi.fn().mockResolvedValue({ success: true, data: null });

    // Inject mock, bypassing strict type checking of the other file system methods
    (window as any).redactedComposer = {
      openGmailCompose: openGmailCompose_mock
    };

    await expect(openGmailCompose("person@example.com", "Dear note")).resolves.toBeUndefined();
    expect(openGmailCompose_mock).toHaveBeenCalledWith("person@example.com", "Dear note");
  });

  it("throws when the Electron bridge reports a failure", async () => {
    (window as any).redactedComposer = {
      openGmailCompose: vi.fn().mockResolvedValue({ success: false, error: "blocked" })
    };

    await expect(openGmailCompose("person@example.com", "Dear note")).rejects.toThrow("Failed to open Gmail: blocked");
  });

  it("uses the fallback error message when the Electron bridge fails without a message", async () => {
    (window as any).redactedComposer = {
      openGmailCompose: vi.fn().mockResolvedValue({ success: false })
    };

    await expect(openGmailCompose("person@example.com", "Dear note")).rejects.toThrow("Failed to open Gmail: Unknown error");
  });

  it("throws when the Electron bridge is missing", async () => {
    // Simulate the case where redactedComposer exists but openGmailCompose is not available
    (window as any).redactedComposer = Object.freeze({});

    await expect(openGmailCompose("person@example.com", "Dear note")).rejects.toThrow("Electron bridge not available");
  });

  it("falls back to window.open in the browser", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    await expect(openGmailCompose("person@example.com", "Dear note")).resolves.toBeUndefined();
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining("mail.google.com"), "_blank");
  });

  it("throws when the browser popup is blocked", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    await expect(openGmailCompose("person@example.com", "Dear note")).rejects.toThrow("Browser popup was blocked. Please enable popups and try again.");
    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});
