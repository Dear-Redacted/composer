/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { HEADER_PREFIX, INITIAL_CONTENT } from "./utils/redaction";
import { useStatusMessage } from "./hooks/useStatusMessage";
import { useRedaction } from "./hooks/useRedaction";
import { useDocumentActions } from "./hooks/useDocumentActions";
import Footer from "./components/Footer";
import CopyIcon from "./assets/icons/utils/copy.svg?react";

type WindowWithTestContent = Window & {
  __testSetContent?: (txt: string) => void;
};

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "dear-redacted-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // Ignore storage failures and fall back to the system preference.
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const ConfirmModal = lazy(() => import("./components/ConfirmModal"));
const EmailModal = lazy(() => import("./components/EmailModal"));

export default function App() {
  const [content, setContent] = useState<string>(INITIAL_CONTENT);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  // "isRedacting" state is no longer being used, prefixed with underscore to satisfy lint rules
  const [_isRedacting, setIsRedacting] = useState(false);
  const [deviationDetected, setDeviationDetected] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");

  // --- NEW STATE FOR FILE MANAGEMENT ---
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<"new" | "open" | null>(null);
  // -------------------------------------

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Use extracted hooks
  const { statusMessage, showMessage } = useStatusMessage();
  const { scanForRedaction } = useRedaction(
    editorRef,
    newText => {
      setContent(newText);

      // Keep this for the UI redaction indicator timing
      requestAnimationFrame(() => setIsRedacting(false));
    },
    () => setDeviationDetected(true),
    () => setDeviationDetected(false)
  );
  const { copyToClipboard, openDocument, saveDocument, saveDocumentAs, sendViaEmail } = useDocumentActions(showMessage);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures in constrained environments.
    }
  }, [theme]);

  useEffect(() => {
    // Test-only helper: allow E2E to set content and trigger a scan
    if (typeof window !== "undefined") {
      (window as WindowWithTestContent).__testSetContent = (txt: string) => {
        setContent(txt);
        // trigger a scan immediately for tests (mirrors paste behavior)
        try {
          scanForRedaction(txt);
        } catch {
          // swallow in tests
        }
      };
    }
  }, [scanForRedaction]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        delete (window as WindowWithTestContent).__testSetContent;
      }
    };
  }, []);

  useEffect(() => {
    const fileName = currentFile ? currentFile.split(/[/\\]/).pop() : "Untitled";
    const title = `${fileName}${isDirty ? "*" : ""} - Dear Redacted`;

    document.title = title; // Update HTML title just in case

    if (window.redactedComposer?.setWindowTitle) {
      window.redactedComposer.setWindowTitle(title);
    }
  }, [currentFile, isDirty]);

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);

      // Mark as dirty as soon as they type
      if (!isDirty) setIsDirty(true);

      // Check what caused the input
      const lastChar = val.slice(-1);
      const isWordBoundary = /[\s.,!?;:\n]/.test(lastChar);
      const isPasteOrBulk = Math.abs(val.length - content.length) > 1;

      // Only run the Trie scan if a word boundary is hit, or text was pasted
      if (isWordBoundary || isPasteOrBulk) {
        setIsRedacting(true);
        scanForRedaction(val);
      } else {
        // If just typing standard letters, ensure redaction overlay is off
        setIsRedacting(false);
      }
    },
    [content, isDirty, scanForRedaction]
  );



  // --- ACTION HANDLERS ---
  const executeNew = useCallback(() => {
    setContent(INITIAL_CONTENT);
    setCurrentFile(null);
    setIsDirty(false);
    showMessage("New document initialized.", 3000);
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(HEADER_PREFIX.length, HEADER_PREFIX.length);
      }
    });
  }, [showMessage]);

  const executeOpen = useCallback(async () => {
    const result = await openDocument();
    if (result) {
      setContent(result.content);
      setCurrentFile(result.filePath);
      setIsDirty(false);
      showMessage("Document loaded.", 2000);
      // Trigger redaction scan immediately after loading content
      scanForRedaction(result.content);
    }
  }, [openDocument, showMessage, scanForRedaction]);

  const handleNew = useCallback(async () => {
    if (isDirty) setPendingAction("new");
    else await executeNew();
  }, [isDirty, executeNew]);

  const handleOpen = useCallback(async () => {
    if (isDirty) setPendingAction("open");
    else await executeOpen();
  }, [isDirty, executeOpen]);

  const handleCopyBody = useCallback(async () => {
    await copyToClipboard(content);
  }, [content, copyToClipboard]);

  const handleSave = useCallback(async () => {
    const newPath = await saveDocument(content, currentFile);
    if (newPath) {
      setCurrentFile(newPath !== "web-download" ? newPath : null);
      setIsDirty(false);
    }
  }, [content, currentFile, saveDocument]);

  const handleSaveAs = useCallback(async () => {
    const newPath = await saveDocumentAs(content);
    if (newPath) {
      setCurrentFile(newPath);
      setIsDirty(false);
    }
  }, [content, saveDocumentAs]);

  const confirmPendingAction = useCallback(() => {
    if (pendingAction === "new") executeNew();
    if (pendingAction === "open") executeOpen();
    setPendingAction(null);
  }, [pendingAction, executeNew, executeOpen]);

  const handleSend = useCallback(async () => {
    if (!email) return;

    try {
      await sendViaEmail(email, content);
      // Keep the modal open so user can see the success message, then close it after a delay
      setTimeout(() => {
        setShowEmailModal(false);
        setEmail("");
      }, 2000);
    } catch {
      // Keep the modal open and email field intact for retry
    }
  }, [email, content, sendViaEmail]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const shortcutKey = e.key.toLowerCase();
      const isShortcut = e.ctrlKey || e.metaKey;

      if (isShortcut && !e.altKey) {
        if (shortcutKey === "n") {
          e.preventDefault();
          handleNew();
        } else if (shortcutKey === "o") {
          e.preventDefault();
          handleOpen();
        } else if (shortcutKey === "s") {
          e.preventDefault();
          if (e.shiftKey) handleSaveAs();
          else handleSave();
        }
      }
    },
    [handleNew, handleOpen, handleSave, handleSaveAs]
  );

  // focus editor on mount and place caret after header
  useEffect(() => {
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(HEADER_PREFIX.length, HEADER_PREFIX.length);
      }
    });
  }, []);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[var(--app-bg)] p-4 text-[var(--app-fg)] sm:p-6 lg:p-8 text-[15px] sm:text-[17px] md:text-[18px] lg:text-[21px]">
    {/* Font Size Set until block redaction done */}
      
      {/* Visual Effects */}
      <div className="screen-grain" />

      {/* Central Terminal Container */}
      <div className="editor-container relative z-20 flex h-full w-full flex-col gap-5 p-6 sm:gap-6 sm:p-8 md:p-10 lg:p-14">
        {/* Status Bar */}
        <div className="status-bar flex items-center gap-6 border-b border-[var(--app-border)] pb-5 uppercase">
          <div className="flex items-center gap-6 flex-wrap">
            <h1 className="terminal-status text-[12px] tracking-[1.5px] text-[var(--app-fg-muted)]">Composer Terminal: Connected</h1>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-[11px] tracking-widest text-[var(--app-container)] opacity-75 sm:block">
              <span className={`transition-colors duration-300 ease-in ${deviationDetected ? "text-[var(--app-fg-muted)]" : "text-[var(--app-container)]"}`}>Deviation Detected</span>
            </div>

            {/* Wrapped the circle to mirror the exact spatial footprint of the copy SVG below */}
            <div className="flex items-center justify-center h-3.5 w-3.5">
              <div className={`flex h-2 w-2 rounded-full transition-colors duration-300 ease-in ${deviationDetected ? "bg-[var(--app-error)]" : "bg-[var(--app-success)]"}`}></div>
            </div>
          </div>
        </div>

        {/* Main Writing Area */}
        <div className="flex-1 relative overflow-hidden group min-h-0">
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{ paddingLeft: 0 }}
            className="w-full h-full min-h-0 resize-none border-none bg-transparent  leading-[1.8] whitespace-pre-wrap text-[var(--app-fg)]/75 caret-[var(--app-fg-muted)] outline-none placeholder:text-[var(--app-fg-muted)] focus:ring-0 letter-spacing: 0;"
            placeholder=". . ."
            id="main-editor"
            role="main"
          />

          {/* Sticky Overlay: Copy Button & Status Message */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-3 text-right">
            <div className="text-[9px] tracking-widest text-[var(--app-fg-muted)]">
              {statusMessage ? (
                <span className="block max-w-[14rem] truncate animate-pulse">
                  {statusMessage}
                </span>
              ) : (
                <span className="block h-[1em]" />
              )}
            </div>

            <button
              onClick={handleCopyBody}
              className="group inline-flex items-center justify-center gap-2 bg-[var(--app-container)] rounded-full border border-[var(--app-border)] px-3 py-2 text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)]"
              id="editor-copy"
              aria-label="Copy body text"
              title="Copy body text"
            >
              <CopyIcon
                className="h-3.5 w-3.5 fill-current opacity-90 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <Footer
          deviationDetected={deviationDetected}
          theme={theme}
          onNew={handleNew}
          onOpen={handleOpen}
          onSave={handleSave}
          onOpenEmailModal={() => setShowEmailModal(true)}
          onToggleTheme={() => setTheme(currentTheme => (currentTheme === "dark" ? "light" : "dark"))}
        />
      </div>

      <Suspense fallback={null}>
        {/* Email Modal */}
        <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSend={handleSend} email={email} onEmailChange={setEmail} />

        {/* Dynamic Confirm Modal for New / Open */}
        <ConfirmModal
          isOpen={pendingAction !== null}
          title={pendingAction === "new" ? "Start new document?" : "Open document?"}
          message="Current progress will be lost. Proceed?"
          confirmLabel="Proceed"
          cancelLabel="Cancel"
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      </Suspense>
    </div>
  );
}
