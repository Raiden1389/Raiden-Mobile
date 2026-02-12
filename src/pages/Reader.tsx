import { useState, useLayoutEffect, useRef, useCallback } from 'react';
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
  const [zenMode, setZenMode] = useState(false);
  const [zenFlash, setZenFlash] = useState(false);
  const lastTapRef = useRef(0);
  const isPaginated = settings.readingMode === 'paginated'; // #31

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

  // ── Zen Mode: double-tap toggle + fullscreen ──
  // #31 — Page-turn: tap left/right edges to scroll by viewport height
  const pageTurn = useCallback((direction: 'prev' | 'next') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageH = el.clientHeight * 0.9;
    el.scrollBy({ top: direction === 'next' ? pageH : -pageH, behavior: 'smooth' });
  }, []);

  const handleTapWithZen = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const zone = (e.clientX - rect.left) / rect.width;
    const isCenter = zone > 0.2 && zone < 0.8;

    // Double-tap center → Zen Mode
    if (isCenter && now - lastTapRef.current < 350) {
      const nextZen = !zenMode;
      setZenMode(nextZen);
      setZenFlash(true);
      setTimeout(() => setZenFlash(false), 1200);
      try { navigator.vibrate?.(nextZen ? [15, 50, 15] : 30); } catch { /* ignore */ }
      try {
        if (nextZen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else if (!nextZen && document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      } catch { /* ignore fullscreen errors */ }
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // #31 — Page-turn mode: single-tap left/right edge to flip page
    if (isPaginated && !isCenter) {
      pageTurn(zone < 0.2 ? 'prev' : 'next');
      return;
    }

    if (!zenMode) handleTap(e);
  }, [zenMode, handleTap, isPaginated, pageTurn]);

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
        if (saved) {
          // Delay to let useInfiniteScroll expand loadedRange and React re-render
          setTimeout(() => jumpToChapter(saved.chapterOrder, saved.ratio), 100);
        }
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
      {!zenMode && <ProgressBar percent={scrollPercent} accent={theme.accent} />}

      {!zenMode && (
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
      )}

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="reader-scroll"
        onClick={handleTapWithZen}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          height: '100%', overflowY: 'auto',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: `${settings.margins}px`, // #43
          paddingRight: `${settings.margins}px`, // #43
          paddingTop: '40px', paddingBottom: '80px',
          // #44 maxWidth constraint
          ...(settings.maxWidth > 0 ? { maxWidth: `${settings.maxWidth}px`, margin: '0 auto' } : {}),
          // #31 page-turn snap
          ...(isPaginated ? { scrollSnapType: 'y mandatory' as const } : {}),
        }}
      >
        {visibleChapters.map((chapter, idx) => (
          <div key={chapter.id}
            style={isPaginated ? { scrollSnapAlign: 'start' } : undefined}
          >
            <ChapterBlock
              chapter={chapter}
              fontSize={settings.fontSize}
              showDivider={idx > 0}
              theme={theme}
              paragraphSpacing={settings.paragraphSpacing}
              textAlign={settings.textAlign}
              showDropCap={settings.showDropCap}
            />
          </div>
        ))}

        <div ref={bottomSentinelRef} style={{ height: '1px' }} />
        {isComplete && <EndMarker />}
      </div>

      {/* Gradient fades */}
      {!zenMode && (
        <>
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
        </>
      )}

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
        currentChapterProgress={scrollPercent}
        readChapterIds={readChapterIds}
        theme={theme}
        onSelect={jumpToChapter}
      />
      {!zenMode && <SwipeBackIndicator progress={swipeProgress} accent={theme.accent} />}

      {/* Zen Mode indicator */}
      {zenFlash && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '48px', zIndex: 300,
          animation: 'zenFade 1.2s ease forwards',
          pointerEvents: 'none',
        }}>
          {zenMode ? '🧘' : '📖'}
        </div>
      )}

      {/* Night Light amber overlay (#8) */}
      {settings.nightLightIntensity > 0 && (
        <div style={{
          position: 'fixed', inset: 0,
          background: `rgba(255, 170, 50, ${settings.nightLightIntensity})`,
          pointerEvents: 'none', zIndex: 199,
          mixBlendMode: 'multiply',
        }} />
      )}

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
        @keyframes zenFade { 0% { opacity: 0.9; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); } }
      `}</style>
    </div>
  );
}
