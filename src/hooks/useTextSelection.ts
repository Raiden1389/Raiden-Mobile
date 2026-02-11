import { useState, useEffect, useCallback, useRef } from 'react';

interface SelectionResult {
  text: string;
}

/**
 * useTextSelection — Detect when user finishes selecting text
 * 
 * Uses touchend/mouseup + delay instead of selectionchange (more reliable on Android).
 * After user lifts finger, waits 400ms for selection to stabilize, then reads it.
 */
export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>): {
  selection: SelectionResult | null;
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<SelectionResult | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  // Check for selection after touch/mouse interactions
  const checkSelection = useCallback(() => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    checkTimerRef.current = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      console.log('[Selection] check:', text || '(empty)', 'collapsed:', sel?.isCollapsed);

      if (!sel || sel.isCollapsed || !text) {
        // Don't immediately clear — user might still be adjusting handles
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      try {
        const range = sel.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) return;
      } catch {
        return;
      }

      console.log('[Selection] ✅', text);
      setSelection({ text });
    }, 400);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // touchend — user finished dragging selection handles
    const onTouchEnd = () => checkSelection();
    // mouseup — desktop fallback
    const onMouseUp = () => checkSelection();
    // selectionchange — backup for handle adjustments
    const onSelectionChange = () => checkSelection();

    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [containerRef, checkSelection]);

  return { selection, clearSelection };
}
