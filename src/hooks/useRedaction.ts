import { useCallback, useRef, useEffect, startTransition } from "react";
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
  onRedacted: (newText: string) => void, // <-- removed selectionStart
  onDeviationDetected: () => void,
  onDeviationClear: () => void
) {
  const redactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REDACTION_DEBOUNCE_MS = 150;

  // Minimal in-page telemetry for E2E timing tests. Tests can read
  // `window.__redactionTimeline` to inspect scheduled scans and when
  // redactions were applied. Kept intentionally tiny and optional.
  if (typeof window !== "undefined") {
    const telemetryWindow = window as WindowWithRedactionTimeline;
    if (!telemetryWindow.__redactionTimeline) telemetryWindow.__redactionTimeline = [];
  }

  /**
   * Perform redaction scan with debouncing
   */
  const scanForRedaction = useCallback(
    (text: string) => {
      // <-- removed selectionStart
      if (redactionTimeoutRef.current) clearTimeout(redactionTimeoutRef.current);

      // record scheduling event for telemetry
      if (typeof window !== "undefined") {
        (window as WindowWithRedactionTimeline).__redactionTimeline?.push({
          type: "scan-scheduled",
          t: Date.now(),
          len: text.length
        });
      }
      redactionTimeoutRef.current = setTimeout(() => {
        // note scan fired
        if (typeof window !== "undefined") {
          (window as WindowWithRedactionTimeline).__redactionTimeline?.push({ type: "scan-fired", t: Date.now() });
        }

        const { newText, found } = redactContent(text);

        if (found) {
          onDeviationClear();
          requestAnimationFrame(() => onDeviationDetected());

          // Make the content update a non-urgent transition so inputs stay responsive
          startTransition(() => {
            onRedacted(newText);
          });

          // record redaction applied
          if (typeof window !== "undefined") {
            (window as WindowWithRedactionTimeline).__redactionTimeline?.push({
              type: "redacted",
              t: Date.now(),
              // small hint: number of replacement chars in the new text
              redactionCount: (newText.match(/█/g) || []).length
            });
          }

          if (deviationTimeoutRef.current) clearTimeout(deviationTimeoutRef.current);
          deviationTimeoutRef.current = setTimeout(() => onDeviationClear(), 1200);
        }
      }, REDACTION_DEBOUNCE_MS);
    },
    [onRedacted, onDeviationDetected, onDeviationClear]
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
    scanForRedaction
  };
}
