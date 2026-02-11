import React from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';

// ===================================================
// READER SUB-COMPONENTS
// ===================================================

/** Gradient chapter divider with title */
export function ChapterDivider({ title, theme }: { title: string; theme: ThemeColors }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.35 }}>
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
        {title}
      </div>
    </div>
  );
}

/** Single chapter rendering */
export const ChapterBlock = React.memo(function ChapterBlock({
  chapter,
  fontSize,
  showDivider,
  theme,
}: {
  chapter: { id: number; title: string; title_translated?: string; content_translated?: string; content_original: string };
  fontSize: number;
  showDivider: boolean;
  theme: ThemeColors;
}) {
  const title = chapter.title_translated || chapter.title;
  const content = chapter.content_translated || chapter.content_original || '';

  return (
    <div data-chapter-id={chapter.id}>
      {showDivider && <ChapterDivider title={title} theme={theme} />}

      <h2 style={{
        fontSize: `${fontSize + 6}px`,
        fontWeight: 700,
        marginBottom: '28px',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h2>

      <div style={{ marginBottom: '60px' }}>
        {content
          .split('\n')
          .filter(p => p.trim())
          .map((paragraph, pIdx) => (
            <p key={pIdx} style={{ marginBottom: '1em', textIndent: '2em', textAlign: 'justify' }}>
              {paragraph}
            </p>
          ))
        }
      </div>
    </div>
  );
});

/** Progress bar at top */
export function ProgressBar({ percent, accent }: { percent: number; accent: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: `${percent}%`,
      height: '2px',
      background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
      transition: 'width 0.15s ease-out',
      zIndex: 100,
      boxShadow: `0 0 8px ${accent}40`,
    }} />
  );
}

/** Swipe-back visual indicator */
export function SwipeBackIndicator({ progress, accent }: { progress: number; accent: string }) {
  if (progress <= 0) return null;
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${progress * 60}px`,
      background: `linear-gradient(to right, ${progress > 0.5 ? '#22c55e' : accent}30, transparent)`,
      zIndex: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      transition: 'width 0.05s',
    }}>
      <span style={{
        fontSize: '20px',
        opacity: progress,
        transform: `scale(${0.5 + progress * 0.5})`,
      }}>←</span>
    </div>
  );
}

/** Navbar with glassmorphism */
export function ReaderNavbar({
  visible,
  chapterTitle,
  scrollPercent,
  theme,
  themeMode,
  onSettings,
  onCycleTheme,
}: {
  visible: boolean;
  chapterTitle: string;
  scrollPercent: number;
  theme: ThemeColors;
  themeMode: string;
  onSettings: () => void;
  onCycleTheme: () => void;
}) {
  return (
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
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      opacity: visible ? 1 : 0,
    }}>
      <a href="/" style={{
        color: theme.text, textDecoration: 'none',
        fontSize: '13px', fontWeight: 700, opacity: 0.7, minWidth: '60px',
      }}>
        ← Thư viện
      </a>
      <span style={{
        fontSize: '11px', fontWeight: 700, opacity: 0.5,
        flex: 1, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        padding: '0 8px',
      }}>
        {chapterTitle || `${scrollPercent}%`}
      </span>
      <div style={{ display: 'flex', gap: '8px', minWidth: '60px', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          style={{
            background: 'none', border: `1px solid ${theme.border}`,
            color: theme.text, borderRadius: '8px', padding: '4px 10px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >⚙️</button>
        <button
          onClick={(e) => { e.stopPropagation(); onCycleTheme(); }}
          style={{
            background: 'none', border: `1px solid ${theme.border}`,
            color: theme.text, borderRadius: '8px', padding: '4px 10px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          {themeMode === 'dark' ? '🌙' : themeMode === 'sepia' ? '📜' : '☀️'}
        </button>
      </div>
    </header>
  );
}

/** End-of-chapters marker */
export function EndMarker() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.35 }}>
      <p style={{ fontSize: '32px' }}>🦅</p>
      <p style={{ fontSize: '13px', marginTop: '12px', fontWeight: 600 }}>Đã hết chương đã dịch</p>
      <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>Quay lại Desktop để dịch tiếp!</p>
    </div>
  );
}
