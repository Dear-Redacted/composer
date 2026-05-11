import { useState, useCallback, useRef, useEffect, useMemo } from "react";

/**
 * Hook for managing transient status messages with automatic cleanup.
 * Ensures timers are properly cleaned up on unmount.
 */
export function useStatusMessage() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Display a status message that auto-clears after a duration
   */
  const showMessage = useCallback((message: string, duration: number = 3000) => {
    setStatusMessage(message);

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to clear message
    timeoutRef.current = setTimeout(() => {
      setStatusMessage(null);
    }, duration);
  }, []);

  /**
   * Clear the message immediately and cancel pending timeout
   */
  const clearMessage = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatusMessage(null);
  }, []);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useMemo(
    () => ({
      statusMessage,
      showMessage,
      clearMessage
    }),
    [statusMessage, showMessage, clearMessage]
  );
}
