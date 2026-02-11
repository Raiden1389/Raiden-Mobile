import { useEffect, useCallback, useRef } from 'react';
import { useReaderSettings } from '../contexts/ReaderContext';

/**
 * useDimmer — Left-edge vertical swipe to control screen brightness
 * Touch start on left 30px → vertical drag adjusts dimmerOpacity
 */
export function useDimmer(scrollContainerRef: React.RefObject<HTMLDivElement | null>) {
  const { settings, setDimmerOpacity } = useReaderSettings();
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startOpacity = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > 30) return;

    isDragging.current = true;
    startY.current = touch.clientY;
    startOpacity.current = settings.dimmerOpacity;
  }, [settings.dimmerOpacity]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const dy = startY.current - touch.clientY;
    const delta = (dy / 300) * 0.7;
    const newOpacity = Math.max(0, Math.min(0.7, startOpacity.current + delta));
    setDimmerOpacity(newOpacity);
  }, [setDimmerOpacity]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollContainerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
