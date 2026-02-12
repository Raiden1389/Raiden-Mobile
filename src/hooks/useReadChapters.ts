import { useState, useCallback } from 'react';

/**
 * Track which chapters have been read (for TOC markers)
 * Persisted in localStorage per workspace.
 */
export function useReadChapters(workspaceId: string | undefined) {
  const READ_KEY = `raiden-readChapters-${workspaceId}`;

  const [readChapterIds, setReadChapterIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(READ_KEY);
      return saved ? new Set(JSON.parse(saved) as number[]) : new Set();
    } catch { return new Set(); }
  });

  const markAsRead = useCallback((chapterId: number) => {
    if (readChapterIds.has(chapterId)) return;
    setReadChapterIds(prev => {
      const next = new Set(prev);
      next.add(chapterId);
      localStorage.setItem(READ_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [readChapterIds, READ_KEY]);

  return { readChapterIds, markAsRead };
}
