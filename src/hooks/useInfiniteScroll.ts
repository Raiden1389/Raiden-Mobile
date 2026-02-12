import { useState, useEffect, useRef, useCallback } from 'react';
import type { Chapter } from '../lib/db';

/**
 * useInfiniteScroll — Manages chapter loading via IntersectionObserver
 * Handles: loadedRange, sentinel observation, scroll %, current chapter tracking
 */
export function useInfiniteScroll(
  allChapters: Chapter[] | undefined,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  getCurrentChapter: () => { chapterId: number; chapterOrder: number; ratio: number } | null
) {
  const [loadedRange, setLoadedRange] = useState({ start: 0, end: 5 });
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const [currentChapterOrder, setCurrentChapterOrder] = useState<number | undefined>(undefined);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const pendingJumpRef = useRef<number | null>(null);
  const pendingRatioRef = useRef<number | null>(null);
  const initialRestoreDone = useRef(false);

  // On mount: pre-expand loadedRange to include saved reading position
  useEffect(() => {
    if (!allChapters?.length || initialRestoreDone.current) return;
    initialRestoreDone.current = true;

    // Read from localStorage (where useReadingPosition saves)
    const wsId = allChapters[0]?.workspaceId;
    if (!wsId) return;

    const saved = localStorage.getItem(`raiden-lastChapter-${wsId}`);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const order = parsed.chapterOrder ?? parsed.chapterId;
      if (order === undefined) return;

      const idx = allChapters.findIndex(c => c.order === order);
      if (idx === -1 || idx < 5) return;

      setLoadedRange({ start: 0, end: Math.min(idx + 3, allChapters.length) });
    } catch { /* ignore */ }
  }, [allChapters]);

  // Load next chapter when sentinel is visible
  useEffect(() => {
    if (!allChapters?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadedRange(prev => ({
            ...prev,
            end: Math.min(prev.end + 1, allChapters.length),
          }));
        }
      },
      { rootMargin: '500px' }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [allChapters?.length, loadedRange.end]);

  // After render, scroll to pending jump target (with retry for large expansions)
  useEffect(() => {
    if (pendingJumpRef.current === null) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const chapterId = pendingJumpRef.current;

    const tryScroll = (attempts = 0) => {
      const target = el.querySelector(`[data-chapter-id="${chapterId}"]`) as HTMLElement;
      if (target) {
        // If ratio is stored, scroll with pixel-perfect offset
        if (pendingRatioRef.current !== null) {
          const top = target.offsetTop + target.offsetHeight * pendingRatioRef.current;
          el.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
        } else {
          el.scrollTo({ top: target.offsetTop, behavior: 'instant' as ScrollBehavior });
        }
        pendingJumpRef.current = null;
        pendingRatioRef.current = null;
        return;
      }
      // Retry — chapters may still be rendering
      if (attempts < 15) {
        requestAnimationFrame(() => tryScroll(attempts + 1));
      }
    };

    requestAnimationFrame(() => tryScroll());
  }, [loadedRange, scrollContainerRef]);

  // Track scroll progress + update current chapter title
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const totalScroll = el.scrollHeight - el.clientHeight;
    const percent = totalScroll > 0 ? Math.round((el.scrollTop / totalScroll) * 100) : 0;
    setScrollPercent(Math.min(percent, 100));

    // Track current chapter for navbar title + order
    const pos = getCurrentChapter();
    if (pos && allChapters) {
      const ch = allChapters.find(c => c.id === pos.chapterId);
      if (ch) {
        setCurrentChapterTitle(ch.title_translated || ch.title);
        setCurrentChapterOrder(ch.order);
      }
    }
  }, [getCurrentChapter, allChapters, scrollContainerRef]);

  // Jump to a specific chapter — expand loaded range if needed
  const jumpToChapter = useCallback((chapterOrder: number, ratio?: number) => {
    if (!allChapters?.length) return;
    const idx = allChapters.findIndex(c => c.order === chapterOrder);
    console.log(`[JumpTo] order=${chapterOrder}, idx=${idx}, total=${allChapters.length}`);
    if (idx === -1) return;

    const chapterId = allChapters[idx].id;
    console.log(`[JumpTo] chapterId=${chapterId}, currentRange=${JSON.stringify(loadedRange)}`);

    // Expand range to include this chapter + a few extra
    const neededEnd = Math.min(idx + 3, allChapters.length);
    pendingJumpRef.current = chapterId;
    pendingRatioRef.current = ratio ?? null;

    setLoadedRange(prev => {
      if (neededEnd <= prev.end) {
        // Already loaded — scroll immediately
        console.log(`[JumpTo] Already loaded, scrolling now`);
        requestAnimationFrame(() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          const target = el.querySelector(`[data-chapter-id="${chapterId}"]`) as HTMLElement;
          console.log(`[JumpTo] Found target: ${!!target}`);
          if (target) {
            if (ratio !== undefined) {
              const top = target.offsetTop + target.offsetHeight * ratio;
              el.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
            } else {
              el.scrollTo({ top: target.offsetTop, behavior: 'instant' as ScrollBehavior });
            }
            pendingJumpRef.current = null;
            pendingRatioRef.current = null;
          }
        });
        return prev;
      }
      console.log(`[JumpTo] Expanding range: ${prev.end} → ${neededEnd}`);
      return { ...prev, end: neededEnd };
    });
  }, [allChapters, scrollContainerRef, loadedRange]);

  const visibleChapters = allChapters?.slice(loadedRange.start, loadedRange.end) ?? [];
  const isComplete = allChapters ? loadedRange.end >= allChapters.length : false;

  return {
    visibleChapters,
    isComplete,
    scrollPercent,
    currentChapterTitle,
    currentChapterOrder,
    bottomSentinelRef,
    handleScroll,
    jumpToChapter,
  };
}
