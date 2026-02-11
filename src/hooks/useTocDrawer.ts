import { useState, useCallback } from 'react';

/**
 * useTocDrawer — Manages table of contents drawer state
 */
export function useTocDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const openToc = useCallback(() => setIsOpen(true), []);
  const closeToc = useCallback(() => setIsOpen(false), []);
  const toggleToc = useCallback(() => setIsOpen(o => !o), []);

  return { tocOpen: isOpen, openToc, closeToc, toggleToc };
}
