import { useRef, useEffect, useCallback } from 'react';
import { db } from '../lib/db';

/**
 * useReadingPosition — Auto-save & restore reading position
 * Uses dual approach: saves both scrollTop (fast restore) and chapter/paragraph (precise restore)
 */
export function useReadingPosition(
  workspaceId: string | undefined,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  allChapterIds: number[]
) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Find which chapter is currently in view
  const getCurrentChapter = useCallback((): { chapterId: number; scrollPercent: number; paragraphIndex: number } | null => {
    const el = scrollContainerRef.current;
    if (!el || allChapterIds.length === 0) return null;

    const chapterEls = el.querySelectorAll('[data-chapter-id]');
    let activeChapter = allChapterIds[0];
    const viewportCenter = el.scrollTop + el.clientHeight / 2;

    chapterEls.forEach((chEl) => {
      const id = Number(chEl.getAttribute('data-chapter-id'));
      const top = (chEl as HTMLElement).offsetTop;
      if (top <= viewportCenter) {
        activeChapter = id;
      }
    });

    const paragraphs = el.querySelectorAll(`[data-chapter-id="${activeChapter}"] p`);
    let paragraphIndex = 0;
    paragraphs.forEach((p, idx) => {
      if ((p as HTMLElement).offsetTop <= viewportCenter) {
        paragraphIndex = idx;
      }
    });

    const totalScroll = el.scrollHeight - el.clientHeight;
    const scrollPercent = totalScroll > 0 ? Math.round((el.scrollTop / totalScroll) * 100) : 0;

    return { chapterId: activeChapter, scrollPercent, paragraphIndex };
  }, [scrollContainerRef, allChapterIds]);

  // Save position with short debounce (500ms)
  const savePosition = useCallback(() => {
    if (!workspaceId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const pos = getCurrentChapter();
      if (!pos) return;

      // Save to IndexedDB
      db.readingProgress.put({
        workspaceId,
        chapterId: pos.chapterId,
        scrollPercent: pos.scrollPercent,
        paragraphIndex: pos.paragraphIndex,
        updatedAt: new Date(),
      });

      // Also save raw scrollTop to localStorage for fast restore
      localStorage.setItem(`raiden-scroll-${workspaceId}`, String(el.scrollTop));
    }, 500); // 500ms debounce — short enough to catch before navigation
  }, [workspaceId, getCurrentChapter, scrollContainerRef]);

  // Restore position on mount
  const restorePosition = useCallback(async () => {
    if (!workspaceId) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    // Strategy 1: Try localStorage scrollTop (instant, most reliable)
    const savedScrollTop = localStorage.getItem(`raiden-scroll-${workspaceId}`);
    if (savedScrollTop) {
      el.scrollTop = Number(savedScrollTop);
      return;
    }

    // Strategy 2: Try IndexedDB chapter/paragraph (more precise)
    const progress = await db.readingProgress.get(workspaceId);
    if (!progress) return;

    await new Promise(r => setTimeout(r, 300));

    const chapterEl = el.querySelector(`[data-chapter-id="${progress.chapterId}"]`);
    if (chapterEl) {
      const paragraphs = chapterEl.querySelectorAll('p');
      if (paragraphs[progress.paragraphIndex]) {
        const p = paragraphs[progress.paragraphIndex] as HTMLElement;
        el.scrollTo({ top: p.offsetTop - 80, behavior: 'auto' });
        return;
      }
      (chapterEl as HTMLElement).scrollIntoView({ behavior: 'auto' });
    }
  }, [workspaceId, scrollContainerRef]);

  // Attach scroll listener
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', savePosition, { passive: true });
    return () => {
      el.removeEventListener('scroll', savePosition);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Last-chance save to localStorage (sync, always works)
      if (workspaceId && el) {
        localStorage.setItem(`raiden-scroll-${workspaceId}`, String(el.scrollTop));
      }
    };
  }, [scrollContainerRef, savePosition, workspaceId]);

  return { savePosition, restorePosition, getCurrentChapter };
}
