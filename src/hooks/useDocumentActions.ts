import { useCallback } from "react";
import { isValidEmail } from "../utils/emailValidator";

type OpenDocumentResult = {
  filePath: string;
  content: string;
} | null;

/**
 * Hook for document-level actions: save, send, copy
 */
export function useDocumentActions(
  onShowMessage: (message: string, duration?: number) => void,
) {
  /**
   * Handle copy-to-clipboard with fallback for older browsers
   */
  const copyToClipboard = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers - schedule to idle to avoid blocking
          type IdleScheduler = (cb: () => void) => number;
          const requestIdle: IdleScheduler | undefined = (
            window as unknown as { requestIdleCallback?: IdleScheduler }
          ).requestIdleCallback;
          const scheduleIdleWork: IdleScheduler =
            requestIdle ?? ((cb: () => void) => window.setTimeout(cb, 50));

          await new Promise<void>((resolve) => {
            scheduleIdleWork(() => {
              const fallbackField = document.createElement("textarea");
              fallbackField.value = text;
              fallbackField.setAttribute("readonly", "true");
              fallbackField.style.position = "fixed";
              fallbackField.style.left = "-9999px";
              fallbackField.style.top = "0";
              document.body.appendChild(fallbackField);
              fallbackField.focus();
              fallbackField.select();
              const copied = document.execCommand("copy");
              if (fallbackField.parentNode)
                document.body.removeChild(fallbackField);

              if (!copied) {
                resolve();
              } else {
                resolve();
              }
            });
          });
        }

        onShowMessage("Body copied.", 2500);
      } catch {
        onShowMessage("Copy failed.", 2500);
      }
    },
    [onShowMessage],
  );

  /**
   * Handle opening a document
   */
  const openDocument = useCallback(async (): Promise<OpenDocumentResult> => {
    if (window.redactedComposer?.openFile) {
      return await window.redactedComposer.openFile();
    }

    // Web fallback: use a hidden file input to let the user pick a file
    return await new Promise<OpenDocumentResult>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.md,.py,.html,.js,.jsx,.ts,.tsx,.css,.json";
      input.style.display = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        if (input && input.parentNode) input.parentNode.removeChild(input);
      };

      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          onShowMessage("No file selected.", 2000);
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const content =
            typeof reader.result === "string" ? reader.result : "";
          cleanup();
          onShowMessage("Document loaded.", 2000);
          resolve({ filePath: file.name, content });
        };
        reader.onerror = () => {
          cleanup();
          onShowMessage("Failed to read file.", 3000);
          resolve(null);
        };
        reader.readAsText(file, "utf-8");
      });

      // Trigger file picker
      input.click();
    });
  }, [onShowMessage]);

  /**
   * Handle document save (persist and download)
   */
  const saveDocument = useCallback(
    async (content: string, currentPath: string | null) => {
      if (
        window.redactedComposer?.saveFile &&
        window.redactedComposer?.saveFileAs
      ) {
        if (currentPath) {
          // Overwrite existing file
          await window.redactedComposer.saveFile(currentPath, content);
          onShowMessage("Document saved.", 2000);
          return currentPath;
        } else {
          // No path yet, trigger Save As
          const newPath = await window.redactedComposer.saveFileAs(content);
          if (newPath) {
            onShowMessage("Document saved.", 2000);
          }
          return newPath; // null if they clicked cancel
        }
      } else {
        // Web fallback: lazily load download only when needed to keep bundle small
        localStorage.setItem("untitled", content);
        import("../utils/fileExport")
          .then((mod) => {
            mod.downloadTextFile(content);
          })
          .catch(() => {
            // Silently fail if download fails in web fallback
          });
        onShowMessage("Saving document...", 3000);
        return "web-download";
      }
    },
    [onShowMessage],
  );

  /**
   * Handle Save As explicitly
   */
  const saveDocumentAs = useCallback(
    async (content: string) => {
      if (window.redactedComposer?.saveFileAs) {
        const newPath = await window.redactedComposer.saveFileAs(content);
        if (newPath) {
          onShowMessage("Document saved.", 2000);
        }
        return newPath;
      }
      return null;
    },
    [onShowMessage],
  );

  /**
   * Handle sending via Gmail
   * Uses cheap email validation before dynamic import to avoid loading modules on invalid input
   */
  const sendViaEmail = useCallback(
    async (recipient: string, content: string): Promise<void> => {
      // Validate email early to avoid dynamic import overhead for obviously invalid input
      if (!isValidEmail(recipient)) {
        onShowMessage("Invalid email address.", 3000);
        throw new Error("Invalid email address");
      }

      onShowMessage("Opening Gmail...");

      try {
        const { openGmailCompose } = await import("../utils/emailComposer");
        await openGmailCompose(recipient, content);
        onShowMessage(
          "Gmail opened successfully. Complete the send in your browser.",
          2000,
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        onShowMessage(`Error: ${errorMsg}`, 4000);
        throw error;
      }
    },
    [onShowMessage],
  );

  return {
    copyToClipboard,
    openDocument,
    saveDocument,
    saveDocumentAs,
    sendViaEmail,
  };
}
