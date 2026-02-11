import { useEffect, useState, type ReactNode } from 'react';

/**
 * PageTransition — Fade + slide-up animation on page mount
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation after first paint
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      minHeight: '100dvh',
    }}>
      {children}
    </div>
  );
}
