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
  theme: ThemeColors;
  onSelect: (chapterId: number) => void;
}

/**
 * TocDrawer — Slide-in table of contents from left
 * Shows chapter list with read/reading/unread status
 */
export function TocDrawer({ open, onClose, chapters, currentChapterId, theme, onSelect }: TocDrawerProps) {
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
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
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

        {/* Chapter list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {chapters.map((ch, idx) => {
            const title = ch.title_translated || ch.title;
            const isCurrent = ch.id === currentChapterId;
            const isRead = currentChapterId ? ch.id < currentChapterId : false;

            return (
              <button
                key={ch.id}
                onClick={() => { onSelect(ch.id); onClose(); }}
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
