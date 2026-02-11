import { useState, useEffect, useRef, useCallback } from 'react';
import type { Chapter } from '../lib/db';

/**
 * useInfiniteScroll — Manages chapter loading via IntersectionObserver
 * Handles: loadedRange, sentinel observation, scroll %, current chapter tracking
 */
export function useInfiniteScroll(
  allChapters: Chapter[] | undefined,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  getCurrentChapter: () => { chapterId: number; scrollPercent: number; paragraphIndex: number } | null
) {
  const [loadedRange, setLoadedRange] = useState({ start: 0, end: 5 });
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

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

  // Track scroll progress + update current chapter title
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const totalScroll = el.scrollHeight - el.clientHeight;
    const percent = totalScroll > 0 ? Math.round((el.scrollTop / totalScroll) * 100) : 0;
    setScrollPercent(Math.min(percent, 100));

    // Track current chapter for navbar title
    const pos = getCurrentChapter();
    if (pos && allChapters) {
      const ch = allChapters.find(c => c.id === pos.chapterId);
      if (ch) setCurrentChapterTitle(ch.title_translated || ch.title);
    }
  }, [getCurrentChapter, allChapters, scrollContainerRef]);

  const visibleChapters = allChapters?.slice(loadedRange.start, loadedRange.end) ?? [];
  const isComplete = allChapters ? loadedRange.end >= allChapters.length : false;

  return {
    visibleChapters,
    isComplete,
    scrollPercent,
    currentChapterTitle,
    bottomSentinelRef,
    handleScroll,
  };
}
