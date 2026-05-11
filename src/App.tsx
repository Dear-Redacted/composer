/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { HEADER_PREFIX, INITIAL_CONTENT } from "./utils/redaction";
import { useStatusMessage } from "./hooks/useStatusMessage";
import { useRedaction } from "./hooks/useRedaction";
import { useDocumentActions } from "./hooks/useDocumentActions";

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
  const gutterRef = useRef<HTMLDivElement>(null);

  // compute visible lines for gutter
  const lines = content.split("\n");

  // Use extracted hooks
  const { statusMessage, showMessage } = useStatusMessage();
  const { scanForRedaction } = useRedaction(
    newText => {
      setContent(newText);
      // Removed manual cursor positioning completely! The browser handles it.
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

  const handleScroll = useCallback(() => {
    if (editorRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

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
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[var(--app-bg)] p-4 font-mono text-[var(--app-fg)] sm:p-6 lg:p-8">
      {/* Visual Effects */}
      <div className="screen-grain" />

      {/* Central Terminal Container */}
      <div className="editor-container relative z-20 flex h-full w-full flex-col gap-5 p-6 sm:gap-6 sm:p-8 md:p-10 lg:p-14">
        {/* Status Bar */}
        <div className="status-bar flex items-center gap-6 border-b border-[var(--app-border)] pb-5 uppercase">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-[12px] tracking-[1.5px] text-[var(--app-fg-muted)]">Communications Terminal: Connected</span>
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
          <div ref={gutterRef} aria-hidden="true" className="editor-gutter absolute left-0 top-0 bottom-0 overflow-auto pointer-events-none select-none">
            <div>
              {lines.map((_, i) => (
                <div key={i} className="editor-line-number text-[18px] leading-[1.8] opacity-40">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <textarea
            ref={editorRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            style={{ paddingLeft: 40 }}
            className="w-full h-full min-h-0 resize-none border-none bg-transparent text-[18px] leading-[1.8] whitespace-pre-wrap text-[var(--app-fg)]/75 caret-[var(--app-fg-muted)] outline-none placeholder:text-[var(--app-fg-muted)] focus:ring-0"
            placeholder=". . ."
            id="main-editor"
            role="main"
          />
        </div>

        {/* Footer Navigation */}
        <div className="footer-nav grid gap-4 border-t border-[var(--app-border)] pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
            <button
              onClick={handleNew}
              className="group flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:text-[var(--app-fg)]"
              id="nav-new"
            >
              <span className="h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
              New Document
            </button>
            <button
              onClick={handleOpen}
              className="group flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:text-[var(--app-fg)]"
              id="nav-open"
            >
              <span className="h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
              Open Document
            </button>

            <button
              onClick={handleSave}
              className="group flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:text-[var(--app-fg)]"
              id="nav-save"
            >
              <span className="h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
              Save Document
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              className="group flex items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:text-[var(--app-fg)]"
              id="nav-send"
            >
              <span className="h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
              Send via E-Mail
            </button>
          </div>

          <div className="justify-end flex items-center gap-3 text-right lg:min-w-[14rem]">
            <div className="text-[9px] tracking-widest text-[var(--app-fg-muted)]">
              {statusMessage ? <span className="block max-w-[14rem] truncate animate-pulse">{statusMessage}</span> : <span className="block h-[1em]" />}
            </div>

            <button
              onClick={handleCopyBody}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-[var(--app-border)] px-3 py-2 text-[11px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)]"
              id="nav-copy"
              aria-label="Copy body text"
              title="Copy body text"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 opacity-90 transition-opacity group-hover:opacity-100" aria-hidden="true">
                <rect x="5" y="5" width="8" height="8" rx="1.25" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 11.5V4.75A1.75 1.75 0 0 1 4.75 3h6.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Social Links & Download */}
        <div className="footer-social flex items-center justify-between gap-4 border-t border-[var(--app-border)] pt-5">
          <div className="flex items-center gap-3 py-1 text-[var(--app-fg-muted)]">
            <a href="https://github.com/Dear-Redacted" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity" title="GitHub">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/dear.redacted.exhibit/" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="Instagram">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 640 640">
                <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z" />
              </svg>
            </a>
            <a href="https://www.threads.com/@dear.redacted.exhibit" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="Threads">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 640 640">
                <path d="M427.5 299.7C429.7 300.6 431.7 301.6 433.8 302.5C463 316.6 484.4 337.7 495.6 363.9C511.3 400.4 512.8 459.7 465.3 507.1C429.1 543.3 385 559.6 322.7 560.1L322.4 560.1C252.2 559.6 198.3 536 162 489.9C129.7 448.9 113.1 391.8 112.5 320.3L112.5 319.8C113 248.3 129.6 191.2 161.9 150.2C198.2 104.1 252.2 80.5 322.4 80L322.7 80C393 80.5 447.6 104 485 149.9C503.4 172.6 517 199.9 525.6 231.6L485.2 242.4C478.1 216.6 467.4 194.6 453 177C423.8 141.2 380 122.8 322.5 122.4C265.5 122.9 222.4 141.2 194.3 176.8C168.1 210.1 154.5 258.3 154 320C154.5 381.7 168.1 429.9 194.3 463.3C222.3 498.9 265.5 517.2 322.5 517.7C373.9 517.3 407.9 505.1 436.2 476.8C468.5 444.6 467.9 405 457.6 380.9C451.5 366.7 440.5 354.9 425.7 346C422 372.9 413.9 394.3 401 410.8C383.9 432.6 359.6 444.4 328.3 446.1C304.7 447.4 282 441.7 264.4 430.1C243.6 416.3 231.4 395.3 230.1 370.8C227.6 322.5 265.8 287.8 325.3 284.4C346.4 283.2 366.2 284.1 384.5 287.2C382.1 272.4 377.2 260.6 369.9 252C359.9 240.3 344.3 234.3 323.7 234.2L323 234.2C306.4 234.2 284 238.8 269.7 260.5L235.3 236.9C254.5 207.8 285.6 191.8 323.1 191.8L323.9 191.8C386.5 192.2 423.8 231.3 427.6 299.5L427.4 299.7L427.5 299.7zM271.5 368.5C272.8 393.6 299.9 405.3 326.1 403.8C351.7 402.4 380.7 392.4 385.6 330.6C372.4 327.7 357.8 326.2 342.2 326.2C337.4 326.2 332.6 326.3 327.8 326.6C284.9 329 270.6 349.8 271.6 368.4L271.5 368.5z" />
              </svg>
            </a>
            <a href="https://bsky.app/profile/dear-redacted.bsky.social" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="Bluesky">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 640 640">
                <path d="M439.8 358.7C436.5 358.3 433.1 357.9 429.8 357.4C433.2 357.8 436.5 358.3 439.8 358.7zM320 291.1C293.9 240.4 222.9 145.9 156.9 99.3C93.6 54.6 69.5 62.3 53.6 69.5C35.3 77.8 32 105.9 32 122.4C32 138.9 41.1 258 47 277.9C66.5 343.6 136.1 365.8 200.2 358.6C203.5 358.1 206.8 357.7 210.2 357.2C206.9 357.7 203.6 358.2 200.2 358.6C106.3 372.6 22.9 406.8 132.3 528.5C252.6 653.1 297.1 501.8 320 425.1C342.9 501.8 369.2 647.6 505.6 528.5C608 425.1 533.7 372.5 439.8 358.6C436.5 358.2 433.1 357.8 429.8 357.3C433.2 357.7 436.5 358.2 439.8 358.6C503.9 365.7 573.4 343.5 593 277.9C598.9 258 608 139 608 122.4C608 105.8 604.7 77.7 586.4 69.5C570.6 62.4 546.4 54.6 483.2 99.3C417.1 145.9 346.1 240.4 320 291.1z" />
              </svg>
            </a>
            <a href="https://x.com/redact_exhibit" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="X (Twitter)">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.693-5.836 6.693H2.882l7.643-8.742L1.227 2.25h6.677l4.615 6.108L17.689 2.25h.555zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com/in/dear-redacted" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="Linkedin">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 640 640">
                <path d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM165 266.2L231.5 266.2L231.5 480L165 480L165 266.2zM236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160C219.5 160 236.7 177.2 236.7 198.5zM413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480L413.9 480z" />
              </svg>
            </a>
            <a href="https://patreon.com/DearRedacted" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-100" title="Donate">
              {/*Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 640 640">
                <path d="M311.6 95C297.5 75.5 274.9 64 250.9 64C209.5 64 176 97.5 176 138.9L176 141.3C176 205.7 258 274.7 298.2 304.6C311.2 314.3 328.7 314.3 341.7 304.6C381.9 274.6 463.9 205.7 463.9 141.3L463.9 138.9C463.9 97.5 430.4 64 389 64C365 64 342.4 75.5 328.3 95L320 106.7L311.6 95zM141.3 405.5L98.7 448L64 448C46.3 448 32 462.3 32 480L32 544C32 561.7 46.3 576 64 576L384.5 576C413.5 576 441.8 566.7 465.2 549.5L591.8 456.2C609.6 443.1 613.4 418.1 600.3 400.3C587.2 382.5 562.2 378.7 544.4 391.8L424.6 480L312 480C298.7 480 288 469.3 288 456C288 442.7 298.7 432 312 432L384 432C401.7 432 416 417.7 416 400C416 382.3 401.7 368 384 368L231.8 368C197.9 368 165.3 381.5 141.3 405.5z" />
              </svg>
            </a>
          </div>

          <div className="justify-self-end flex items-center gap-2 text-right text-[9px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] ">
            {typeof window !== "undefined" && !window.redactedComposer ? (
              <a
                href="https://github.com/Dear-Redacted/Composer/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-[var(--app-border)] px-3 py-2 text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)]"
              >
                Download Composer
              </a>
            ) : null}

            <button
              onClick={() => setTheme(currentTheme => (currentTheme === "dark" ? "light" : "dark"))}
              className="group inline-flex items-center justify-center rounded-full border border-[var(--app-border)] px-3 py-2 text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)]"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={theme === "light"}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              id="theme-toggle"
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 opacity-90 transition-opacity group-hover:opacity-100" aria-hidden="true">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
                  <path
                    d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.2 3.2l1.06 1.06M11.74 11.74l1.06 1.06M12.8 3.2l-1.06 1.06M4.26 11.74l-1.06 1.06"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden="true">
                  <path
                    d="M10.9 9.7A4.5 4.5 0 0 1 6.3 5.1c0-.75.18-1.45.5-2.07A5.5 5.5 0 1 0 13.6 9c-.63.32-1.33.5-2.08.5a4.6 4.6 0 0 1-.62.2Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
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
