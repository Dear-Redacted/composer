// src/utils/redaction.ts
import { REDACTION_CHAR } from "../constants";
import { findMatchAt } from "./trie";

export interface RedactionResult {
  newText: string;
  found: boolean;
}

// Use a header prefix including trailing space so the caret sits after the word
export const HEADER_PREFIX = "Dear ";
export const INITIAL_CONTENT = `${HEADER_PREFIX}`;

export function redactContent(text: string): RedactionResult {
  const header = text.slice(0, HEADER_PREFIX.length);
  const body = text.slice(HEADER_PREFIX.length);

  let found = false;
  let out = "";
  let lastIndex = 0;

  for (let index = 0; index < body.length; index += 1) {
    const match = findMatchAt(body, index);

    if (!match) continue;

    found = true;
    out += body.slice(lastIndex, match.start);

    // 1:1 replacement, NO appended space
    const replacement = REDACTION_CHAR.repeat(match.end - match.start);
    out += replacement;

    lastIndex = match.end;
    index = match.end - 1;
  }

  if (!found) {
    return { newText: text, found };
  }

  out += body.slice(lastIndex);

  return { newText: header + out, found };
}
