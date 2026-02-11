import { useRef, useEffect, useCallback } from 'react';
import { db } from '../lib/db';

/**
 * useReadingPosition — Auto-save & restore reading position
 * Saves: chapterId, scrollPercent, active chapter every 3 seconds
 */
export function useReadingPosition(
  workspaceId: string | undefined,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  allChapterIds: number[]
) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>('');

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

    // Calculate paragraph index near center
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

  // Save position (debounced)
  const savePosition = useCallback(() => {
    if (!workspaceId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pos = getCurrentChapter();
      if (!pos) return;

      const key = `${pos.chapterId}-${pos.scrollPercent}-${pos.paragraphIndex}`;
      if (key === lastSavedRef.current) return; // Skip if unchanged
      lastSavedRef.current = key;

      await db.readingProgress.put({
        workspaceId,
        chapterId: pos.chapterId,
        scrollPercent: pos.scrollPercent,
        paragraphIndex: pos.paragraphIndex,
        updatedAt: new Date(),
      });
    }, 3000);
  }, [workspaceId, getCurrentChapter]);

  // Restore position on mount
  const restorePosition = useCallback(async () => {
    if (!workspaceId) return;

    const progress = await db.readingProgress.get(workspaceId);
    if (!progress) return;

    // Wait for DOM to settle
    await new Promise(r => setTimeout(r, 300));

    const el = scrollContainerRef.current;
    if (!el) return;

    // Try to find the chapter element
    const chapterEl = el.querySelector(`[data-chapter-id="${progress.chapterId}"]`);
    if (chapterEl) {
      // Try to find the paragraph
      const paragraphs = chapterEl.querySelectorAll('p');
      if (paragraphs[progress.paragraphIndex]) {
        const p = paragraphs[progress.paragraphIndex] as HTMLElement;
        el.scrollTo({ top: p.offsetTop - 80, behavior: 'auto' });
        return;
      }
      // Fallback: scroll to chapter
      (chapterEl as HTMLElement).scrollIntoView({ behavior: 'auto' });
    }
  }, [workspaceId, scrollContainerRef]);

  // Attach scroll listener for auto-save
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', savePosition, { passive: true });
    return () => {
      el.removeEventListener('scroll', savePosition);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scrollContainerRef, savePosition]);

  return { savePosition, restorePosition, getCurrentChapter };
}
