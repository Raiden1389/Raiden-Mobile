import React, { useMemo } from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';
import { DropCap } from './DropCap';

// ===================================================
// READER SUB-COMPONENTS
// ===================================================

/** Render text with dialogue (quoted text) in italic */
function renderWithDialogue(text: string): React.ReactNode {
  // Match: "...", "...", «...», '...', 「...」
  const parts = text.split(/([""\u201C«»\u2018\u2019\u300C\u300D][^""\u201C«»\u2018\u2019\u300C\u300D]*[""\u201C«»\u2018\u2019\u300C\u300D])/g);
  if (parts.length <= 1) return text;
  return parts.map((part, i) => {
    if (/^[""\u201C«»\u2018\u300C]/.test(part) && /[""\u201C«»\u2019\u300D]$/.test(part)) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part}</em>;
    }
    return part;
  });
}

/** Chapter divider decorations (#54) */
const DIVIDER_DECORATIONS = ['· · ·', '✦', 'ꕥ', '❖', '◆', '∗ ∗ ∗', '⁂', '❦'];

function getDividerDecoration(title: string): string {
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return DIVIDER_DECORATIONS[hash % DIVIDER_DECORATIONS.length];
}

/** Gradient chapter divider with title + decoration variant (#54) */
export function ChapterDivider({ title, theme }: { title: string; theme: ThemeColors }) {
  const decoration = getDividerDecoration(title);
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.35 }}>
      <div style={{
        fontSize: '16px',
        letterSpacing: '8px',
        marginBottom: '12px',
        color: theme.text,
      }}>
        {decoration}
      </div>
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

/** Single chapter rendering — #58 memoized content */
export const ChapterBlock = React.memo(function ChapterBlock({
  chapter,
  fontSize,
  showDivider,
  theme,
  paragraphSpacing = 1,
  textAlign = 'justify',
  showDropCap = true,
}: {
  chapter: { id: number; order: number; title: string; title_translated?: string; content_translated?: string; content_original: string };
  fontSize: number;
  showDivider: boolean;
  theme: ThemeColors;
  paragraphSpacing?: number;
  textAlign?: 'justify' | 'left';
  showDropCap?: boolean;
}) {
  const title = chapter.title_translated || chapter.title;
  const content = chapter.content_translated || chapter.content_original || '';

  // #58: Memoize paragraph rendering to avoid recreating JSX nodes
  const renderedParagraphs = useMemo(() => {
    const paragraphs = content.split('\n').filter(p => p.trim());
    return paragraphs.map((paragraph, pIdx) => {
      const firstChar = (pIdx === 0 && showDropCap) ? paragraph.match(/\p{L}/u)?.[0] : null;
      const restText = pIdx === 0 && firstChar
        ? paragraph.slice(paragraph.indexOf(firstChar) + firstChar.length)
        : paragraph;

      return (
        <p key={pIdx} style={{ marginBottom: `${paragraphSpacing}em`, textIndent: pIdx === 0 ? 0 : '2em', textAlign }}>
          {pIdx === 0 && firstChar && (
            <DropCap char={firstChar} color={theme.accent} fontFamily="serif" />
          )}
          {renderWithDialogue(restText)}
        </p>
      );
    });
  }, [content, paragraphSpacing, textAlign, showDropCap, theme.accent]);

  return (
    <div data-chapter-id={chapter.id} data-chapter-order={chapter.order}>
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
        {renderedParagraphs}
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

/** Navbar with glassmorphism + auto-scroll */
export function ReaderNavbar({
  visible, chapterTitle, scrollPercent, theme, themeMode,
  onSettings, onCycleTheme, onToc,
  autoScrollActive, onToggleAutoScroll, autoScrollSpeed, onSpeedChange,
}: {
  visible: boolean;
  chapterTitle: string;
  scrollPercent: number;
  theme: ThemeColors;
  themeMode: string;
  onSettings: () => void;
  onCycleTheme: () => void;
  onToc?: () => void;
  autoScrollActive?: boolean;
  onToggleAutoScroll?: () => void;
  autoScrollSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}) {
  const btn: React.CSSProperties = {
    background: 'none', border: `1px solid ${theme.border}`,
    color: theme.text, borderRadius: '8px', padding: '4px 8px',
    fontSize: '12px', cursor: 'pointer',
  };
  const activeBtn: React.CSSProperties = {
    ...btn, background: `${theme.accent}25`, borderColor: theme.accent,
  };

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: `${theme.bg}dd`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 50,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: '50px' }}>
          <a href="/" style={{ color: theme.text, textDecoration: 'none', fontSize: '13px', fontWeight: 700, opacity: 0.7 }}>←</a>
          {onToc && <button onClick={(e) => { e.stopPropagation(); onToc(); }} style={btn}>📑</button>}
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, opacity: 0.5,
          flex: 1, textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          padding: '0 4px',
        }}>
          {chapterTitle || `${scrollPercent}%`}
        </span>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
          {onToggleAutoScroll && (
            <button onClick={(e) => { e.stopPropagation(); onToggleAutoScroll(); }}
              style={autoScrollActive ? activeBtn : btn}>📜</button>
          )}
          <button onClick={(e) => {
            e.stopPropagation();
            if (document.fullscreenElement) { document.exitFullscreen(); } else { document.documentElement.requestFullscreen?.(); }
          }} style={btn}>{document.fullscreenElement ? '⬜' : '📱'}</button>
          <button onClick={(e) => { e.stopPropagation(); onSettings(); }} style={btn}>⚙️</button>
          <button onClick={(e) => { e.stopPropagation(); onCycleTheme(); }} style={btn}>
            {({ dark: '🌙', forest: '🌲', slate: '🌊', sepia: '📜', light: '☀️' } as Record<string, string>)[themeMode] || '🌙'}
          </button>
        </div>
      </header>

      {/* Thin bottom bar — only when auto-scroll active */}
      {autoScrollActive && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '40px',
          background: `${theme.bg}ee`,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', zIndex: 50, padding: '0 16px',
        }}>
          <button onClick={onToggleAutoScroll} style={{ ...btn, padding: '2px 8px', fontSize: '11px' }}>⏸ Dừng</button>
          <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 700 }}>🐢</span>
          <input type="range" min={1} max={5} step={0.5} value={autoScrollSpeed}
            onChange={e => onSpeedChange?.(Number(e.target.value))}
            onClick={e => e.stopPropagation()}
            style={{ width: '100px', accentColor: theme.accent }} />
          <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 700 }}>🐇</span>
        </div>
      )}
    </>
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
