import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useNavbar — Controls navbar visibility with auto-hide + tap toggle
 */
export function useNavbar(scrollContainerRef: React.RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-hide on scroll down
  const trackScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const delta = el.scrollTop - lastScrollY.current;
    if (delta > 10 && visible) {
      setVisible(false);
    }
    lastScrollY.current = el.scrollTop;
  }, [visible, scrollContainerRef]);

  // Tap center zone to toggle
  const handleTap = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const zone = (e.clientX - rect.left) / rect.width;

    if (zone > 0.2 && zone < 0.8) {
      setVisible(prev => !prev);
    }
  }, []);

  // Auto-hide after 4s
  useEffect(() => {
    if (visible) {
      hideTimer.current = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(hideTimer.current);
    }
  }, [visible]);

  return { navbarVisible: visible, handleTap, trackScroll, setNavbarVisible: setVisible };
}
