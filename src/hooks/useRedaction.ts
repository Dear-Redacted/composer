import {
  useCallback,
  useRef,
  useEffect,
  startTransition,
  RefObject,
} from "react";
import { redactContent } from "../utils/redaction";

type RedactionTimelineEvent = {
  type: "scan-scheduled" | "scan-fired" | "redacted";
  t: number;
  len?: number;
  redactionCount?: number;
};

type WindowWithRedactionTimeline = Window & {
  __redactionTimeline?: RedactionTimelineEvent[];
};

/**
 * Hook for managing redaction scheduling and deviation detection.
 * Handles the debounced redaction scanning with proper cleanup.
 */
export function useRedaction(
  editorRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  onRedacted: (newText: string) => void,
  onDeviationDetected: () => void,
  onDeviationClear: () => void,
) {
  const redactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const deviationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const REDACTION_DEBOUNCE_MS = 50;
  // In useRedaction.ts - Track cursor position before redaction

  // Minimal in-page telemetry for E2E timing tests. Tests can read
  // `window.__redactionTimeline` to inspect scheduled scans and when
  // redactions were applied. Kept intentionally tiny and optional.
  if (typeof window !== "undefined") {
    const telemetryWindow = window as WindowWithRedactionTimeline;
    if (!telemetryWindow.__redactionTimeline)
      telemetryWindow.__redactionTimeline = [];
  }

  /**
   * Perform redaction scan with debouncing
   */
  const scanForRedaction = useCallback(
    (text: string) => {
      const oldSelectionStart = editorRef.current?.selectionStart ?? 0;
      if (redactionTimeoutRef.current)
        clearTimeout(redactionTimeoutRef.current);

      // record scheduling event for telemetry
      if (typeof window !== "undefined") {
        (window as WindowWithRedactionTimeline).__redactionTimeline?.push({
          type: "scan-scheduled",
          t: Date.now(),
          len: text.length,
        });
      }
      redactionTimeoutRef.current = setTimeout(() => {
        // note scan fired
        if (typeof window !== "undefined") {
          (window as WindowWithRedactionTimeline).__redactionTimeline?.push({
            type: "scan-fired",
            t: Date.now(),
          });
        }

        const { newText, found } = redactContent(text);

        if (found) {
          onDeviationClear();
          requestAnimationFrame(() => onDeviationDetected());

          // Make the content update a non-urgent transition so inputs stay responsive
          startTransition(() => {
            onRedacted(newText);

            // ensure DOM commit has finished before touching selection
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (editorRef.current) {
                  editorRef.current.setSelectionRange(
                    oldSelectionStart,
                    oldSelectionStart,
                  );
                }
              });
            });
          });

          // record redaction applied
          if (typeof window !== "undefined") {
            (window as WindowWithRedactionTimeline).__redactionTimeline?.push({
              type: "redacted",
              t: Date.now(),
              // small hint: number of replacement chars in the new text
              redactionCount: (newText.match(/█/g) || []).length,
            });
          }

          if (deviationTimeoutRef.current)
            clearTimeout(deviationTimeoutRef.current);
          deviationTimeoutRef.current = setTimeout(
            () => onDeviationClear(),
            1200,
          );
        }
      }, REDACTION_DEBOUNCE_MS);
    },
    [editorRef, onRedacted, onDeviationDetected, onDeviationClear],
  );

  /**
   * Cleanup all timers on unmount
   */
  useEffect(() => {
    return () => {
      if (redactionTimeoutRef.current) {
        clearTimeout(redactionTimeoutRef.current);
      }
      if (deviationTimeoutRef.current) {
        clearTimeout(deviationTimeoutRef.current);
      }
    };
  }, []);

  return {
    scanForRedaction,
  };
}
