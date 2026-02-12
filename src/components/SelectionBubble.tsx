import { useEffect, useCallback } from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';

interface Props {
  text: string;
  rect: DOMRect;
  theme: ThemeColors;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onEdit: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}

/**
 * SelectionBubble — Floating action bubble above selected text
 * Shows ✏️ Edit and 📋 Copy buttons
 */
export function SelectionBubble({ text, rect, theme, scrollContainerRef, onEdit, onCopy, onDismiss }: Props) {
  // Dismiss on outside tap
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-bubble]')) {
        onDismiss();
      }
    };
    // Delay to avoid dismissing immediately from the selection event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onDismiss]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    onCopy();
  }, [text, onCopy]);

  // Calculate position relative to scroll container
  const containerRect = scrollContainerRef.current?.getBoundingClientRect();
  const top = rect.top - (containerRect?.top ?? 0) - 48;
  const left = rect.left - (containerRect?.left ?? 0) + rect.width / 2;

  return (
    <div
      data-bubble
      style={{
        position: 'absolute',
        top: `${Math.max(top, 4)}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        padding: '6px 8px',
        borderRadius: '12px',
        background: theme.text === '#D1D1D1' ? '#2a2a2a' : '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 60,
        animation: 'bubbleIn 0.15s ease',
      }}
    >
      <button
        onClick={onEdit}
        style={{
          background: theme.accent,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ✏️ Sửa
      </button>
      <button
        onClick={handleCopy}
        style={{
          background: 'transparent',
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        📋 Copy
      </button>
      {/* Share button (#5) — Web Share API */}
      {typeof navigator.share === 'function' && (
        <button
          onClick={() => {
            navigator.share({ text }).catch(() => {
              navigator.clipboard.writeText(text);
            });
          }}
          style={{
            background: 'transparent',
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          📤
        </button>
      )}
    </div>
  );
}
