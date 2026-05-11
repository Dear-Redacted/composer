/**
 * Electron-based email composition using IPC bridge
 * Secure transport that builds Gmail URLs server-side
 */

declare const window: Window & {
  redactedComposer?: {
    openGmailCompose(recipient: string, body: string): Promise<void>;
  };
};

/**
 * Open Gmail compose via Electron IPC bridge
 * The main process validates email and builds URL server-side
 * @param recipient Email address
 * @param body Email body text
 * @throws Error if IPC communication fails or email is invalid
 */
export async function openGmailComposeElectron(recipient: string, body: string): Promise<void> {
  if (!window.redactedComposer?.openGmailCompose) {
    throw new Error("Electron bridge not available");
  }

  const result = await window.redactedComposer.openGmailCompose(recipient, body);

  if (!result?.success) {
    throw new Error(`Failed to open Gmail: ${result?.error ?? "Unknown error"}`);
  }
}
