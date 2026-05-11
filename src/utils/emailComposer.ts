import { isValidEmail } from "./emailValidator";
export { buildGmailComposeUrl } from "./emailComposer.shared";

declare global {
  interface Window {
    redactedComposer?: Readonly<{
      openGmailCompose: (recipient: string, body: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      // --- NEW NATIVE METHODS ---
      openFile: () => Promise<{ filePath: string; content: string } | null>;
      saveFileAs: (content: string) => Promise<string | null>;
      saveFile: (filePath: string, content: string) => Promise<boolean>;
      setWindowTitle: (title: string) => void;
    }>;
  }
}

// Re-export for backward compatibility
export { isValidEmail };

/**
 * Detects if running in Electron desktop environment
 * @returns true if in Electron, false if in browser
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== "undefined" && typeof window.redactedComposer !== "undefined";
}

// Note: platform-specific transports are loaded dynamically to keep web bundle small.

/**
 * Opens Gmail compose in the appropriate environment
 * For Electron: uses the IPC bridge to open Gmail with recipient and body
 * For web: uses window.open directly with constructed URL
 *
 * @param recipient - Validated email recipient
 * @param editorContent - Current editor content to send
 * @throws Error if email is invalid or opening fails
 */
export async function openGmailCompose(recipient: string, editorContent: string): Promise<void> {
  if (!isValidEmail(recipient)) {
    throw new Error(`Invalid email: ${recipient}`);
  }

  if (isElectronEnvironment()) {
    // Load Electron transport only when needed (keeps web bundle small)
    const mod = await import("./emailComposer.electron");
    return mod.openGmailComposeElectron(recipient, editorContent);
  }

  // Load browser transport on demand
  const mod = await import("./emailComposer.browser");
  return mod.openGmailComposeBrowser(recipient, editorContent);
}
