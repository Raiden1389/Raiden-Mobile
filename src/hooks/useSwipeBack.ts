import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useSwipeBack — Android-style swipe from left edge to go back
 * Shows a visual arrow indicator while swiping
 */
export function useSwipeBack() {
  const navigate = useNavigate();
  const [swipeProgress, setSwipeProgress] = useState(0); // 0-1
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const isVertical = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    // Only trigger from left edge (first 25px)
    if (touch.clientX > 25) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = true;
    isVertical.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = Math.abs(touch.clientY - touchStartY.current);

    // If vertical movement is dominant, cancel swipe
    if (dy > 30 && dx < dy) {
      isSwiping.current = false;
      isVertical.current = true;
      setSwipeProgress(0);
      return;
    }

    if (dx > 0) {
      const progress = Math.min(dx / 150, 1); // 150px = full swipe
      setSwipeProgress(progress);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current && !isVertical.current) return;

    if (swipeProgress > 0.5) {
      // Navigate back
      navigate('/');
    }

    isSwiping.current = false;
    setSwipeProgress(0);
  }, [swipeProgress, navigate]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { swipeProgress };
}
