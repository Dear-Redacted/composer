// src/utils/trie.ts
import { FORBIDDEN_TERMS } from "../constants";

export interface RedactionMatch {
  start: number;
  end: number;
}

interface TrieNode {
  children: Map<string, TrieNode>;
  isTerminal: boolean;
}

const buildTrie = (terms: readonly string[]) => {
  const root: TrieNode = { children: new Map(), isTerminal: false };

  for (const term of terms) {
    let node = root;
    for (const character of term) {
      let nextNode = node.children.get(character);
      if (!nextNode) {
        nextNode = { children: new Map(), isTerminal: false };
        node.children.set(character, nextNode);
      }
      node = nextNode;
    }
    node.isTerminal = true;
  }

  return root;
};

const FORBIDDEN_TERM_TRIE = buildTrie(FORBIDDEN_TERMS);

const MAX_KEYWORD_LENGTH = Math.max(
  ...FORBIDDEN_TERMS.map(term => term.length)
);

const WORD_CHAR_PATTERN = /[\p{L}\p{N}_]/u;

const isWordChar = (character: string | undefined) => character !== undefined && WORD_CHAR_PATTERN.test(character);

export const findMatchAt = (text: string, startIndex: number): RedactionMatch | null => {
  const precedingCharacter = text[startIndex - 1];

  if (isWordChar(precedingCharacter)) return null;

  let node = FORBIDDEN_TERM_TRIE;
  let currentIndex = startIndex;
  let bestEndIndex = -1;

  while (
    currentIndex < text.length &&
    currentIndex - startIndex < MAX_KEYWORD_LENGTH
  ) {
    const character = text[currentIndex].toLowerCase();
    const nextNode = node.children.get(character);

    if (!nextNode) break;

    node = nextNode;
    currentIndex += 1;

    if (node.isTerminal) {
      bestEndIndex = currentIndex;
    }
  }

  if (bestEndIndex === -1) return null;

  const trailingCharacter = text[bestEndIndex];

  if (isWordChar(trailingCharacter)) return null;

  return { start: startIndex, end: bestEndIndex };
};
