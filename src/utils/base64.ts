export function toBase64(value: string) {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }

  return Buffer.from(value, "utf8").toString("base64");
}

export function fromBase64(value: string) {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(value);
  }

  return Buffer.from(value, "base64").toString("utf8");
}
