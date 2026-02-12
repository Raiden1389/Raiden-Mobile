import { useEffect, useRef } from 'react';

/**
 * useVersionCheck — Polls /api/version every 60s to detect new PWA builds.
 * When a new build is detected, triggers SW update + page reload.
 * Only auto-reloads when on Library page (not during reading).
 */
export function useVersionCheck(autoReload = true) {
  const lastHashRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const newHash = data.hash;

        if (!newHash || newHash === 'unknown' || newHash === 'no-dist') return;

        if (lastHashRef.current === null) {
          // First check — just store the hash
          lastHashRef.current = newHash;
          return;
        }

        if (newHash !== lastHashRef.current) {
          console.log(`[VersionCheck] New build detected: ${lastHashRef.current} → ${newHash}`);
          lastHashRef.current = newHash;

          // Force SW to fetch new files
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg) {
            await reg.update();
          }

          // Auto-reload if on Library page
          if (autoReload) {
            // Small delay to let SW activate
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      } catch {
        // Network error — probably offline, ignore
      }
    };

    // Initial check after 5s (don't block app startup)
    const timeout = setTimeout(check, 5000);

    // Then check every 60s
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoReload]);
}
