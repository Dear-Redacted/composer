import { describe, expect, it } from "vitest";
import { HEADER_PREFIX, redactContent } from "../src/utils/redaction";

describe("redactContent", () => {
  it("replaces forbidden words with same-length bars", () => {
    const result = redactContent(`${HEADER_PREFIX}Scandal now`);

    expect(result.found).toBe(true);
    expect(result.newText).toBe(`${HEADER_PREFIX}███████ now`);
  });

  it("preserves exact string length after redaction", () => {
    const originalText = `${HEADER_PREFIX}Scandal now`;
    const result = redactContent(originalText);

    expect(result.found).toBe(true);
    expect(result.newText.length).toBe(originalText.length);
  });

  it("redacts phrases without appending extra spaces", () => {
    const phrase = "Palm Beach police";
    const result = redactContent(`${HEADER_PREFIX}${phrase}`);

    expect(result.found).toBe(true);
    // Verified 1:1 replacement, no trailing space added by the logic
    expect(result.newText).toBe(`${HEADER_PREFIX}${"█".repeat(phrase.length)}`);
  });

  it("leaves ordinary text unchanged", () => {
    const text = `${HEADER_PREFIX}careful phrasing remains`;
    const result = redactContent(text);

    expect(result.found).toBe(false);
    expect(result.newText).toBe(text);
  });

  it("does not redact ordinary text that only partially overlaps a phrase", () => {
    const result = redactContent(`${HEADER_PREFIX}Federal Bureau, Finland`);

    expect(result.found).toBe(false);
    expect(result.newText).toBe(`${HEADER_PREFIX}Federal Bureau, Finland`);
  });

  it("does not redact a phrase when it is part of a longer word", () => {
    const result = redactContent(`${HEADER_PREFIX}Palm Beach policeX`);

    expect(result.found).toBe(false);
    expect(result.newText).toBe(`${HEADER_PREFIX}Palm Beach policeX`);
  });
});
