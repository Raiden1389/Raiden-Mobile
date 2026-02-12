import { useState, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';

// Hooks
import { useReadingPosition } from '../hooks/useReadingPosition';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useNavbar } from '../hooks/useNavbar';
import { useDimmer } from '../hooks/useDimmer';
import { useTocDrawer } from '../hooks/useTocDrawer';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useWakeLock } from '../hooks/useWakeLock';
import { useReadChapters } from '../hooks/useReadChapters';
import { useTextCorrection } from '../hooks/useTextCorrection';

// Components
import { SettingsPanel } from '../components/SettingsPanel';
import { EditDialog } from '../components/EditDialog';
import { TocDrawer } from '../components/TocDrawer';
import {
  ProgressBar,
  ReaderNavbar,
  ChapterBlock,
  SwipeBackIndicator,
  EndMarker,
} from '../components/ReaderParts';

// ===================================================
// READER PAGE — Pure Orchestrator
// All logic extracted into hooks, this file is layout only
// ===================================================

export function ReaderPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { settings, cycleTheme } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  const { getSavedPosition, getCurrentChapter } = useReadingPosition(workspaceId, scrollContainerRef, chapterIds);
  const { swipeProgress } = useSwipeBack();
  const { navbarVisible, handleTap, trackScroll } = useNavbar(scrollContainerRef);
  useDimmer(scrollContainerRef);
  const { tocOpen, openToc, closeToc } = useTocDrawer();
  const autoScroll = useAutoScroll({ scrollContainerRef });
  useWakeLock();
  const { readChapterIds, markAsRead } = useReadChapters(workspaceId);
  const correction = useTextCorrection({ workspaceId, getCurrentChapter, allChapters });

  const {
    visibleChapters, isComplete, scrollPercent,
    currentChapterTitle, bottomSentinelRef,
    handleScroll: infiniteHandleScroll, jumpToChapter,
  } = useInfiniteScroll(allChapters, scrollContainerRef, getCurrentChapter);

  // ── Combined scroll handler ──
  const handleScroll = () => {
    infiniteHandleScroll();
    trackScroll();
    const pos = getCurrentChapter();
    if (pos?.chapterId) markAsRead(pos.chapterId);
  };

  // ── Restore reading position ──
  useLayoutEffect(() => {
    if (allChapters && allChapters.length > 0 && !restoredRef.current) {
      restoredRef.current = true;
      getSavedPosition().then(saved => {
        if (saved) jumpToChapter(saved.chapterOrder, saved.ratio);
      });
    }
  }, [allChapters, getSavedPosition, jumpToChapter]);

  // ── Loading ──
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
        onToc={openToc}
        autoScrollActive={autoScroll.isScrolling}
        onToggleAutoScroll={autoScroll.toggle}
        autoScrollSpeed={autoScroll.speed}
        onSpeedChange={autoScroll.setSpeed}
      />

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="reader-scroll"
        onClick={handleTap}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          height: '100%', overflowY: 'auto',
          overscrollBehavior: 'none',
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
      </div>

      {/* Gradient fades */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '40px',
        background: `linear-gradient(${theme.bg}, transparent)`,
        pointerEvents: 'none', zIndex: 5,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px',
        background: `linear-gradient(transparent, ${theme.bg})`,
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* ✏️ Edit FAB — fallback for manual find & replace */}
      <button
        onClick={correction.openEmpty}
        style={{
          position: 'fixed',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          right: '16px',
          width: '44px', height: '44px',
          borderRadius: '50%', border: 'none',
          background: `${theme.accent}cc`, color: '#fff',
          fontSize: '18px',
          boxShadow: `0 2px 12px ${theme.accent}40`,
          cursor: 'pointer', zIndex: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.25s ease, opacity 0.25s ease',
          transform: navbarVisible ? 'scale(1)' : 'scale(0)',
          opacity: navbarVisible ? 0.85 : 0,
          pointerEvents: navbarVisible ? 'auto' : 'none',
        }}
      >
        ✏️
      </button>

      {/* Edit Dialog */}
      {correction.editingText !== null && (
        <EditDialog
          paragraphText={correction.editingText}
          theme={theme}
          onSave={correction.handleSave}
          onCancel={correction.cancel}
        />
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <TocDrawer
        open={tocOpen}
        onClose={closeToc}
        chapters={allChapters ?? []}
        currentChapterId={getCurrentChapter()?.chapterId ?? null}
        readChapterIds={readChapterIds}
        theme={theme}
        onSelect={jumpToChapter}
      />
      <SwipeBackIndicator progress={swipeProgress} accent={theme.accent} />

      {/* Dimmer */}
      {settings.dimmerOpacity > 0 && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          opacity: settings.dimmerOpacity, pointerEvents: 'none', zIndex: 200,
        }} />
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
