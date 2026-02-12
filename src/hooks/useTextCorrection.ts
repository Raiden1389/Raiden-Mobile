import { useState, useEffect, useCallback } from 'react';
import { applyCorrection } from '../lib/corrections';
import type { Chapter } from '../lib/db';

interface UseTextCorrectionOptions {
  workspaceId: string | undefined;
  getCurrentChapter: () => { chapterId: number; chapterOrder: number; ratio: number } | null;
  allChapters: Chapter[] | undefined;
}

/**
 * Handles text selection → auto-open correction dialog → save correction.
 * Listens to `selectionchange` and auto-opens after 400ms debounce.
 */
export function useTextCorrection({ workspaceId, getCurrentChapter, allChapters }: UseTextCorrectionOptions) {
  const [editingText, setEditingText] = useState<string | null>(null);

  // Auto-open correction dialog when text is selected
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleSelectionChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 1 && editingText === null) {
          setEditingText(text);
          sel?.removeAllRanges();
        }
      }, 400);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      clearTimeout(debounceTimer);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editingText]);

  // Fallback: manual open for empty find & replace
  const openEmpty = useCallback(() => {
    setEditingText('');
  }, []);

  // Save correction
  const handleSave = useCallback(async (oldText: string, newText: string, scope: 'chapter' | 'all') => {
    if (!workspaceId) return;

    const pos = getCurrentChapter();
    const currentOrder = allChapters?.find(c => c.id === pos?.chapterId)?.order ?? 0;

    const count = await applyCorrection(workspaceId, oldText, newText, scope, currentOrder);
    setEditingText(null);

    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    console.log(`[Edit] "${oldText}" → "${newText}" in ${count} chapter(s)`);
  }, [workspaceId, getCurrentChapter, allChapters]);

  const cancel = useCallback(() => setEditingText(null), []);

  return { editingText, openEmpty, handleSave, cancel };
}
