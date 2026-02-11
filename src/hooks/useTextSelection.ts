import { useState, useEffect, useCallback, useRef } from 'react';

interface TextSelection {
  text: string;
  rect: DOMRect;
}

/**
 * useTextSelection — Tracks text selection in the reader
 * Returns selected text and its bounding rect for positioning the bubble
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSelectionChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({ text, rect });
    }, 200);
  }, []);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleSelectionChange]);

  return { selection, clearSelection };
}
