/**
 * Shared Gmail compose URL builder.
 * Kept in a separate module so browser and test code can use it without pulling in platform transports.
 */
export function buildGmailComposeUrl(recipient: string, body: string): string {
  const subject = "Dear Redacted";
  const footnote = "\n\n---\nwrote with Dear Redacted Composer";
  const finalBody = body + footnote;

  const params = ["view=cm", "fs=1", `to=${encodeURIComponent(recipient)}`, `su=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(finalBody)}`].join("&");

  return `https://mail.google.com/mail/?${params}`;
}
