import { useRef, useEffect, useCallback } from 'react';

const SAVE_KEY = (wsId: string) => `raiden-lastChapter-${wsId}`;

interface SavedPosition {
  chapterId: number;
  ratio: number; // 0→1, relative position within chapter
}

/**
 * useReadingPosition — Pixel-perfect chapter tracking with ratio
 * Saves { chapterId, ratio } to localStorage on scroll (throttled 300ms).
 * ratio = how far down the chapter viewport-top is (0 = top, 1 = bottom).
 * Survives font size changes because ratio * newHeight ≈ same position.
 */
export function useReadingPosition(
  workspaceId: string | undefined,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  allChapterIds: number[]
) {
  const lastSavedRef = useRef<string | null>(null);
  const throttleRef = useRef(false);

  // Find which chapter is currently in view + compute ratio
  const getCurrentChapter = useCallback((): { chapterId: number; ratio: number } | null => {
    const el = scrollContainerRef.current;
    if (!el || allChapterIds.length === 0) return null;

    const chapterEls = el.querySelectorAll('[data-chapter-id]');
    let activeEl: HTMLElement | null = null;
    let activeId = allChapterIds[0];
    const viewportCenter = el.scrollTop + el.clientHeight / 2;

    chapterEls.forEach((chEl) => {
      const htmlEl = chEl as HTMLElement;
      const id = Number(chEl.getAttribute('data-chapter-id'));
      if (htmlEl.offsetTop <= viewportCenter) {
        activeId = id;
        activeEl = htmlEl;
      }
    });

    if (!activeEl) return { chapterId: activeId, ratio: 0 };

    // ratio = how far viewport-top is within this chapter (0→1)
    const offset = el.scrollTop - (activeEl as HTMLElement).offsetTop;
    const height = (activeEl as HTMLElement).offsetHeight;
    const ratio = height > 0 ? Math.min(Math.max(offset / height, 0), 1) : 0;

    return { chapterId: activeId, ratio };
  }, [scrollContainerRef, allChapterIds]);

  // Save on scroll — throttled 300ms
  const savePosition = useCallback(() => {
    if (!workspaceId || throttleRef.current) return;
    throttleRef.current = true;

    setTimeout(() => {
      throttleRef.current = false;
      const pos = getCurrentChapter();
      if (!pos) return;

      const key = JSON.stringify({ c: pos.chapterId, r: Math.round(pos.ratio * 1000) / 1000 });
      if (key !== lastSavedRef.current) {
        lastSavedRef.current = key;
        localStorage.setItem(SAVE_KEY(workspaceId), JSON.stringify({
          chapterId: pos.chapterId,
          ratio: Math.round(pos.ratio * 1000) / 1000, // 3 decimal precision
        }));
      }
    }, 300);
  }, [workspaceId, getCurrentChapter]);

  // Get saved position — try localStorage, fallback IndexedDB migration
  const getSavedPosition = useCallback(async (): Promise<SavedPosition | null> => {
    if (!workspaceId) return null;

    // New format: { chapterId, ratio }
    const saved = localStorage.getItem(SAVE_KEY(workspaceId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed.chapterId) {
          return { chapterId: parsed.chapterId, ratio: parsed.ratio ?? 0 };
        }
        // Legacy: just a number
        if (typeof parsed === 'number') {
          return { chapterId: parsed, ratio: 0 };
        }
      } catch { /* fall through */ }
      // Legacy: plain string number
      const num = Number(saved);
      if (!isNaN(num)) return { chapterId: num, ratio: 0 };
    }

    // Migration fallback: old IndexedDB readingProgress
    try {
      const { db } = await import('../lib/db');
      const progress = await db.readingProgress.get(workspaceId);
      if (progress?.chapterId) {
        const pos: SavedPosition = { chapterId: progress.chapterId, ratio: 0 };
        localStorage.setItem(SAVE_KEY(workspaceId), JSON.stringify(pos));
        return pos;
      }
    } catch { /* ignore */ }

    return null;
  }, [workspaceId]);

  // Attach scroll listener + save on unmount
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', savePosition, { passive: true });
    return () => {
      el.removeEventListener('scroll', savePosition);
      // Last-chance save
      if (workspaceId) {
        const pos = getCurrentChapter();
        if (pos) {
          localStorage.setItem(SAVE_KEY(workspaceId), JSON.stringify({
            chapterId: pos.chapterId,
            ratio: Math.round(pos.ratio * 1000) / 1000,
          }));
        }
      }
    };
  }, [scrollContainerRef, savePosition, workspaceId, getCurrentChapter]);

  return { savePosition, getSavedPosition, getCurrentChapter };
}
