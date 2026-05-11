/**
 * Browser-based email composition using Gmail web interface
 * Fallback transport when running outside Electron
 */

import { buildGmailComposeUrl } from "./emailComposer.shared";

/**
 * Open Gmail compose in browser
 * @param recipient Email address
 * @param body Email body text
 * @throws Error if popup is blocked or opening fails
 */
export async function openGmailComposeBrowser(recipient: string, body: string): Promise<void> {
  const gmailUrl = buildGmailComposeUrl(recipient, body);

  const opened = window.open(gmailUrl, "_blank");
  if (!opened) {
    throw new Error("Browser popup was blocked. Please enable popups and try again.");
  }
}
