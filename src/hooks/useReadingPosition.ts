import { useRef, useEffect, useCallback } from 'react';

const SAVE_KEY = (wsId: string) => `raiden-lastChapter-${wsId}`;

interface SavedPosition {
  chapterOrder: number;
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
  const getCurrentChapter = useCallback((): { chapterId: number; chapterOrder: number; ratio: number } | null => {
    const el = scrollContainerRef.current;
    if (!el || allChapterIds.length === 0) return null;

    const chapterEls = el.querySelectorAll('[data-chapter-id]');
    let activeEl: HTMLElement | null = null;
    let activeId = allChapterIds[0];
    let activeOrder = 0;
    const viewportCenter = el.scrollTop + el.clientHeight / 2;

    chapterEls.forEach((chEl) => {
      const htmlEl = chEl as HTMLElement;
      const id = Number(chEl.getAttribute('data-chapter-id'));
      const order = Number(chEl.getAttribute('data-chapter-order') || '0');
      if (htmlEl.offsetTop <= viewportCenter) {
        activeId = id;
        activeOrder = order;
        activeEl = htmlEl;
      }
    });

    if (!activeEl) return { chapterId: activeId, chapterOrder: activeOrder, ratio: 0 };

    // ratio = how far viewport-top is within this chapter (0→1)
    const offset = el.scrollTop - (activeEl as HTMLElement).offsetTop;
    const height = (activeEl as HTMLElement).offsetHeight;
    const ratio = height > 0 ? Math.min(Math.max(offset / height, 0), 1) : 0;

    return { chapterId: activeId, chapterOrder: activeOrder, ratio };
  }, [scrollContainerRef, allChapterIds]);

  // Save on scroll — throttled 300ms
  const savePosition = useCallback(() => {
    if (!workspaceId || throttleRef.current) return;
    throttleRef.current = true;

    setTimeout(() => {
      throttleRef.current = false;
      const pos = getCurrentChapter();
      if (!pos) return;

      const key = JSON.stringify({ o: pos.chapterOrder, r: Math.round(pos.ratio * 1000) / 1000 });
      if (key !== lastSavedRef.current) {
        lastSavedRef.current = key;
        localStorage.setItem(SAVE_KEY(workspaceId), JSON.stringify({
          chapterOrder: pos.chapterOrder,
          ratio: Math.round(pos.ratio * 1000) / 1000,
          // Legacy compat
          chapterId: pos.chapterId,
        }));
      }
    }, 300);
  }, [workspaceId, getCurrentChapter]);

  // Get saved position — try localStorage, fallback IndexedDB migration
  const getSavedPosition = useCallback(async (): Promise<SavedPosition | null> => {
    if (!workspaceId) return null;

    const saved = localStorage.getItem(SAVE_KEY(workspaceId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed.chapterOrder !== undefined) {
          return { chapterOrder: parsed.chapterOrder, ratio: parsed.ratio ?? 0 };
        }
        // Legacy: had chapterId but no chapterOrder — can't reliably map, treat as order 0
        if (typeof parsed === 'object' && parsed.chapterId) {
          return { chapterOrder: parsed.chapterId, ratio: parsed.ratio ?? 0 };
        }
        if (typeof parsed === 'number') {
          return { chapterOrder: parsed, ratio: 0 };
        }
      } catch { /* fall through */ }
      const num = Number(saved);
      if (!isNaN(num)) return { chapterOrder: num, ratio: 0 };
    }

    // Migration fallback: old IndexedDB readingProgress
    try {
      const { db } = await import('../lib/db');
      const progress = await db.readingProgress.get(workspaceId);
      if (progress?.chapterId) {
        const pos: SavedPosition = { chapterOrder: progress.chapterId, ratio: 0 };
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
            chapterOrder: pos.chapterOrder,
            ratio: Math.round(pos.ratio * 1000) / 1000,
            chapterId: pos.chapterId,
          }));
        }
      }
    };
  }, [scrollContainerRef, savePosition, workspaceId, getCurrentChapter]);

  return { savePosition, getSavedPosition, getCurrentChapter };
}
