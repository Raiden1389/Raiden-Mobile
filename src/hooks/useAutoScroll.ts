import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAutoScrollOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useAutoScroll({ scrollContainerRef }: UseAutoScrollOptions) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(2); // 1-5, pixels per frame tick
  const intervalRef = useRef<number | null>(null);

  const stopRef = useRef(() => { });

  const stop = useCallback(() => {
    if (intervalRef.current) {
      cancelAnimationFrame(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScrolling(false);
  }, []);

  // Keep ref updated
  useEffect(() => { stopRef.current = stop; }, [stop]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsScrolling(true);
    const tick = () => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop += speed * 0.5;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          stopRef.current();
          return;
        }
      }
      intervalRef.current = requestAnimationFrame(tick);
    };
    intervalRef.current = requestAnimationFrame(tick);
  }, [scrollContainerRef, speed]);

  const toggle = useCallback(() => {
    if (isScrolling) stop();
    else start();
  }, [isScrolling, start, stop]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) cancelAnimationFrame(intervalRef.current);
    };
  }, []);

  // Restart animation with new speed (no setState, direct ref manipulation)
  useEffect(() => {
    if (intervalRef.current) {
      cancelAnimationFrame(intervalRef.current);
      intervalRef.current = null;
      // Restart tick with new speed
      const tick = () => {
        const el = scrollContainerRef.current;
        if (el) {
          el.scrollTop += speed * 0.5;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
            stopRef.current();
            return;
          }
        }
        intervalRef.current = requestAnimationFrame(tick);
      };
      intervalRef.current = requestAnimationFrame(tick);
    }
  }, [speed, scrollContainerRef]);

  return { isScrolling, speed, setSpeed, toggle, stop };
}
