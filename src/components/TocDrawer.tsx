import { useState } from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';

interface TocChapter {
  id: number;
  title: string;
  title_translated?: string;
  order: number;
}

interface TocDrawerProps {
  open: boolean;
  onClose: () => void;
  chapters: TocChapter[];
  currentChapterId: number | null;
  currentChapterProgress?: number;
  readChapterIds?: Set<number>;
  theme: ThemeColors;
  onSelect: (chapterId: number) => void;
}

/**
 * TocDrawer — Slide-in table of contents from left
 * Shows chapter list with read/reading/unread status
 */
export function TocDrawer({ open, onClose, chapters, currentChapterId, currentChapterProgress, readChapterIds, theme, onSelect }: TocDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 300,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        width: 'min(300px, 80vw)',
        background: theme.bg,
        borderRight: `1px solid ${theme.border}`,
        zIndex: 301,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideRight 0.25s ease',
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: chapters.length > 20 ? '10px' : 0 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              📑 Mục lục
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                fontSize: '20px', cursor: 'pointer',
                color: theme.text, opacity: 0.5,
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>
          {/* #34 — Chapter Jump Input (shown when >20 chapters) */}
          {chapters.length > 20 && <ChapterJumpInput total={chapters.length} theme={theme} onJump={(num) => { onSelect(num); onClose(); }} />}
        </div>

        {/* Chapter list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {chapters.map((ch, idx) => {
            const title = ch.title_translated || ch.title;
            const isCurrent = ch.id === currentChapterId;
            const isRead = readChapterIds ? readChapterIds.has(ch.id) : (currentChapterId ? ch.id < currentChapterId : false);

            return (
              <button
                key={ch.id}
                onClick={() => { onSelect(ch.order); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: `1px solid ${theme.border}40`,
                  background: isCurrent ? `${theme.accent}15` : 'transparent',
                  color: theme.text,
                  fontSize: '13px',
                  fontWeight: isCurrent ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: isRead ? 0.5 : 1,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: '12px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                  {isCurrent ? '📖' : isRead ? '✅' : '⬜'}
                </span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {idx + 1}. {title}
                </span>
                {/* Progress % for current chapter (#2) */}
                {isCurrent && currentChapterProgress !== undefined && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: `${theme.accent}20`,
                    color: theme.accent,
                    flexShrink: 0,
                  }}>
                    {Math.round(currentChapterProgress)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer stat */}
        <div style={{
          padding: '10px 16px',
          borderTop: `1px solid ${theme.border}`,
          fontSize: '11px',
          opacity: 0.4,
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {chapters.length} chương
        </div>
      </div>

      <style>{`
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}

/** #34 — Mini input for jumping to a chapter by number */
function ChapterJumpInput({ total, theme, onJump }: { total: number; theme: ThemeColors; onJump: (order: number) => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (num >= 1 && num <= total) {
      onJump(num);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
      <input
        type="number"
        min={1}
        max={total}
        placeholder={`Chương (1-${total})`}
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          flex: 1, padding: '6px 10px', borderRadius: '8px',
          border: `1px solid ${theme.border}`, background: `${theme.text}08`,
          color: theme.text, fontSize: '12px', fontWeight: 600,
          outline: 'none',
        }}
      />
      <button type="submit" style={{
        padding: '6px 12px', borderRadius: '8px',
        border: 'none', background: `${theme.accent}20`,
        color: theme.accent, fontSize: '12px', fontWeight: 800,
        cursor: 'pointer',
      }}>
        ↪
      </button>
    </form>
  );
}
