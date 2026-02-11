import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { SettingsPanel } from '../components/SettingsPanel';
import { useReadingPosition } from '../hooks/useReadingPosition';

// ===================================================
// READER PAGE — Phase 2: Full Reader Experience
// ===================================================

export function ReaderPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { settings, cycleTheme } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];

  // Load all chapters for this workspace (sorted by order)
  const allChapters = useLiveQuery(
    () => workspaceId
      ? db.chapters.where('workspaceId').equals(workspaceId).sortBy('order')
      : [],
    [workspaceId]
  );

  // State
  const [loadedRange, setLoadedRange] = useState<{ start: number; end: number }>({ start: 0, end: 2 });
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');

  // Refs
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const hideNavbarTimer = useRef<ReturnType<typeof setTimeout>>();
  const restoredRef = useRef(false);

  // Reading Position hook
  const chapterIds = allChapters?.map(c => c.id) ?? [];
  const { restorePosition, getCurrentChapter } = useReadingPosition(
    workspaceId,
    scrollContainerRef,
    chapterIds
  );

  // Restore reading position once chapters are loaded
  useEffect(() => {
    if (allChapters && allChapters.length > 0 && !restoredRef.current) {
      restoredRef.current = true;
      // Load enough chapters first, then restore
      setLoadedRange({ start: 0, end: Math.min(allChapters.length, 5) });
      setTimeout(() => restorePosition(), 500);
    }
  }, [allChapters, restorePosition]);

  // Load next chapter when bottom sentinel is visible
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

  // Track scroll progress + auto-hide navbar + update current chapter
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const totalScroll = el.scrollHeight - el.clientHeight;
    const percent = totalScroll > 0 ? Math.round((scrollTop / totalScroll) * 100) : 0;
    setScrollPercent(Math.min(percent, 100));

    // Auto-hide navbar on scroll down, show on scroll up
    const delta = scrollTop - lastScrollY.current;
    if (delta > 10 && navbarVisible) {
      setNavbarVisible(false);
    }
    lastScrollY.current = scrollTop;

    // Track current chapter for navbar title
    const pos = getCurrentChapter();
    if (pos && allChapters) {
      const ch = allChapters.find(c => c.id === pos.chapterId);
      if (ch) setCurrentChapterTitle(ch.title_translated || ch.title);
    }
  }, [navbarVisible, getCurrentChapter, allChapters]);

  // Tap zone handler
  const handleTap = useCallback((e: React.MouseEvent) => {
    // Don't handle if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const zone = x / rect.width;

    if (zone > 0.2 && zone < 0.8) {
      setNavbarVisible(prev => !prev);
    }
  }, []);

  // Auto-hide navbar after 4s
  useEffect(() => {
    if (navbarVisible) {
      hideNavbarTimer.current = setTimeout(() => setNavbarVisible(false), 4000);
      return () => clearTimeout(hideNavbarTimer.current);
    }
  }, [navbarVisible]);

  // Haptic on chapter change
  useEffect(() => {
    if (currentChapterTitle && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [currentChapterTitle]);

  if (!allChapters) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `"${settings.fontFamily}", serif`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🦅</div>
          <div style={{ fontSize: '14px', opacity: 0.5 }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  const visibleChapters = allChapters.slice(loadedRange.start, loadedRange.end);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.bg,
        color: theme.text,
        fontFamily: `"${settings.fontFamily}", serif`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        overflow: 'hidden',
      }}
    >
      {/* Progress Bar — 2px top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollPercent}%`,
        height: '2px',
        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}80)`,
        transition: 'width 0.15s ease-out',
        zIndex: 100,
        boxShadow: `0 0 8px ${theme.accent}40`,
      }} />

      {/* Smart Navbar (glassmorphism, auto-hide) */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: `${theme.bg}dd`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
        transform: navbarVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: navbarVisible ? 1 : 0,
      }}>
        <a
          href="/"
          style={{
            color: theme.text,
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700,
            opacity: 0.7,
            minWidth: '60px',
          }}
        >
          ← Thư viện
        </a>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          opacity: 0.5,
          flex: 1,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 8px',
        }}>
          {currentChapterTitle || `${scrollPercent}%`}
        </span>
        <div style={{ display: 'flex', gap: '8px', minWidth: '60px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
            style={{
              background: 'none',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ⚙️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
            style={{
              background: 'none',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {settings.theme === 'dark' ? '🌙' : settings.theme === 'sepia' ? '📜' : '☀️'}
          </button>
        </div>
      </header>

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onClick={handleTap}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '20px',
          paddingTop: '40px',
          paddingBottom: '80px',
        }}
      >
        {visibleChapters.map((chapter, idx) => (
          <div key={chapter.id} data-chapter-id={chapter.id}>
            {/* Chapter Divider */}
            {idx > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px 0',
                opacity: 0.35,
              }}>
                <div style={{
                  height: '1px',
                  background: `linear-gradient(to right, transparent, ${theme.text}40, transparent)`,
                  margin: '0 auto 16px',
                  maxWidth: '200px',
                }} />
                <div style={{
                  fontSize: '11px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  {chapter.title_translated || chapter.title}
                </div>
              </div>
            )}

            {/* Chapter Title */}
            <h2 style={{
              fontSize: `${settings.fontSize + 6}px`,
              fontWeight: 700,
              marginBottom: '28px',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}>
              {chapter.title_translated || chapter.title}
            </h2>

            {/* Chapter Content */}
            <div style={{ marginBottom: '60px' }}>
              {(chapter.content_translated || chapter.content_original || '')
                .split('\n')
                .filter(p => p.trim())
                .map((paragraph, pIdx) => (
                  <p key={pIdx} style={{
                    marginBottom: '1em',
                    textIndent: '2em',
                    textAlign: 'justify',
                  }}>
                    {paragraph}
                  </p>
                ))
              }
            </div>
          </div>
        ))}

        {/* Bottom Sentinel */}
        <div ref={bottomSentinelRef} style={{ height: '1px' }} />

        {/* End marker */}
        {loadedRange.end >= allChapters.length && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            opacity: 0.35,
          }}>
            <p style={{ fontSize: '32px' }}>🦅</p>
            <p style={{ fontSize: '13px', marginTop: '12px', fontWeight: 600 }}>
              Đã hết chương đã dịch
            </p>
            <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
              Quay lại Desktop để dịch tiếp!
            </p>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* CSS Dimmer overlay */}
      {settings.dimmerOpacity > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          opacity: settings.dimmerOpacity,
          pointerEvents: 'none',
          zIndex: 200,
        }} />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
