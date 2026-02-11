import { useEffect, useRef } from 'react';

/**
 * useWakeLock — Prevent screen from turning off while reading.
 * Automatically acquires on mount, releases on unmount.
 * Re-acquires when tab becomes visible again.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Acquired');
      } catch (e) {
        console.log('[WakeLock] Failed:', e);
      }
    };

    acquire();

    // Re-acquire when tab becomes visible (wakeLock auto-releases on tab hide)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLockRef.current?.release().catch(() => { });
      wakeLockRef.current = null;
      console.log('[WakeLock] Released');
    };
  }, []);
}
