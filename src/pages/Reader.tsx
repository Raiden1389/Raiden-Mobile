import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { applyCorrection } from '../lib/corrections';

// Hooks
import { useReadingPosition } from '../hooks/useReadingPosition';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useNavbar } from '../hooks/useNavbar';
import { useTextSelection } from '../hooks/useTextSelection';

// Components
import { SettingsPanel } from '../components/SettingsPanel';
import { SelectionBubble } from '../components/SelectionBubble';
import { EditDialog } from '../components/EditDialog';
import {
  ProgressBar,
  ReaderNavbar,
  ChapterBlock,
  SwipeBackIndicator,
  EndMarker,
} from '../components/ReaderParts';

// ===================================================
// READER PAGE — Orchestrator (hooks + components)
// ===================================================

export function ReaderPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { settings, cycleTheme } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];

  // ── Data ──
  const allChapters = useLiveQuery(
    () => workspaceId
      ? db.chapters.where('workspaceId').equals(workspaceId).sortBy('order')
      : [],
    [workspaceId]
  );

  // ── Refs ──
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  // ── Hooks ──
  const chapterIds = allChapters?.map(c => c.id) ?? [];
  const { restorePosition, getCurrentChapter } = useReadingPosition(workspaceId, scrollContainerRef, chapterIds);
  const { swipeProgress } = useSwipeBack();
  const { navbarVisible, handleTap, trackScroll } = useNavbar(scrollContainerRef);
  const { selection, clearSelection } = useTextSelection();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);

  const {
    visibleChapters,
    isComplete,
    scrollPercent,
    currentChapterTitle,
    bottomSentinelRef,
    handleScroll: infiniteHandleScroll,
  } = useInfiniteScroll(allChapters, scrollContainerRef, getCurrentChapter);

  // ── Combined scroll handler ──
  const handleScroll = () => {
    infiniteHandleScroll();
    trackScroll();
  };

  // ── Restore reading position (instant, before paint) ──
  useLayoutEffect(() => {
    if (allChapters && allChapters.length > 0 && !restoredRef.current) {
      restoredRef.current = true;
      restorePosition();
    }
  }, [allChapters, restorePosition]);

  // ── Haptic on chapter change ──
  useEffect(() => {
    if (currentChapterTitle && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [currentChapterTitle]);

  // ── Edit handlers ──
  const handleEditStart = useCallback(() => {
    if (selection) {
      setEditingText(selection.text);
      clearSelection();
    }
  }, [selection, clearSelection]);

  const handleEditSave = useCallback(async (newText: string, scope: 'chapter' | 'all') => {
    if (!editingText || !workspaceId) return;

    const pos = getCurrentChapter();
    const currentOrder = allChapters?.find(c => c.id === pos?.chapterId)?.order ?? 0;

    const count = await applyCorrection(workspaceId, editingText, newText, scope, currentOrder);
    setEditingText(null);

    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    console.log(`[Edit] Applied to ${count} chapter(s)`);
  }, [editingText, workspaceId, getCurrentChapter, allChapters]);

  // ── Loading state ──
  if (!allChapters) {
    return (
      <div style={{
        minHeight: '100vh', background: theme.bg, color: theme.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: `"${settings.fontFamily}", serif`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🦅</div>
          <div style={{ fontSize: '14px', opacity: 0.5 }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: theme.bg, color: theme.text,
      fontFamily: `"${settings.fontFamily}", serif`,
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineHeight,
      overflow: 'hidden',
    }}>
      <ProgressBar percent={scrollPercent} accent={theme.accent} />

      <ReaderNavbar
        visible={navbarVisible}
        chapterTitle={currentChapterTitle}
        scrollPercent={scrollPercent}
        theme={theme}
        themeMode={settings.theme}
        onSettings={() => setSettingsOpen(true)}
        onCycleTheme={cycleTheme}
      />

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onClick={handleTap}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          height: '100%', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '20px', paddingTop: '40px', paddingBottom: '80px',
        }}
      >
        {visibleChapters.map((chapter, idx) => (
          <ChapterBlock
            key={chapter.id}
            chapter={chapter}
            fontSize={settings.fontSize}
            showDivider={idx > 0}
            theme={theme}
          />
        ))}

        <div ref={bottomSentinelRef} style={{ height: '1px' }} />
        {isComplete && <EndMarker />}

        {/* Selection Bubble (inside scroll container for correct positioning) */}
        {selection && (
          <SelectionBubble
            text={selection.text}
            rect={selection.rect}
            theme={theme}
            scrollContainerRef={scrollContainerRef}
            onEdit={handleEditStart}
            onCopy={clearSelection}
            onDismiss={clearSelection}
          />
        )}
      </div>

      {/* Edit Dialog */}
      {editingText && (
        <EditDialog
          oldText={editingText}
          theme={theme}
          onSave={handleEditSave}
          onCancel={() => setEditingText(null)}
        />
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SwipeBackIndicator progress={swipeProgress} accent={theme.accent} />

      {/* Dimmer overlay */}
      {settings.dimmerOpacity > 0 && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          opacity: settings.dimmerOpacity, pointerEvents: 'none', zIndex: 200,
        }} />
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bubbleIn { from { transform: translateX(-50%) scale(0.8); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
