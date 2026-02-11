import { useState, useRef, useEffect } from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';

interface Props {
  oldText: string;
  theme: ThemeColors;
  onSave: (newText: string, scope: 'chapter' | 'all') => void;
  onCancel: () => void;
}

/**
 * EditDialog — Full-screen modal for text correction
 * Shows original text (readonly) and input for replacement
 */
export function EditDialog({ oldText, theme, onSave, onCancel }: Props) {
  const [newText, setNewText] = useState(oldText);
  const [scope, setScope] = useState<'chapter' | 'all'>('all');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSave = () => {
    if (newText.trim() && newText !== oldText) {
      onSave(newText.trim(), scope);
    }
  };

  const isDark = theme.bg === '#000000';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: isDark ? '#1a1a1a' : '#fff',
        color: theme.text,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          ✏️ Sửa văn bản
        </h3>

        {/* Original text */}
        <label style={{ fontSize: '11px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Văn bản gốc
        </label>
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: isDark ? '#0a0a0a' : '#f5f5f5',
          fontSize: '14px',
          lineHeight: 1.6,
          marginTop: '6px',
          marginBottom: '16px',
          maxHeight: '80px',
          overflow: 'auto',
          wordBreak: 'break-word',
        }}>
          {oldText}
        </div>

        {/* New text input */}
        <label style={{ fontSize: '11px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Sửa thành
        </label>
        <textarea
          ref={inputRef}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: `2px solid ${theme.accent}`,
            background: isDark ? '#0a0a0a' : '#fff',
            color: theme.text,
            fontSize: '14px',
            lineHeight: 1.6,
            marginTop: '6px',
            marginBottom: '16px',
            minHeight: '60px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {/* Scope radio */}
        <div style={{ marginBottom: '20px' }}>
          {(['chapter', 'all'] as const).map(s => (
            <label
              key={s}
              onClick={() => setScope(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: scope === s ? 700 : 400,
                opacity: scope === s ? 1 : 0.6,
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `2px solid ${scope === s ? theme.accent : theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {scope === s && (
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: theme.accent,
                  }} />
                )}
              </span>
              {s === 'chapter' ? 'Chỉ chương này' : 'Tất cả chương từ đây trở đi'}
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!newText.trim() || newText === oldText}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: newText !== oldText ? theme.accent : theme.border,
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: newText !== oldText ? 'pointer' : 'default',
              opacity: newText !== oldText ? 1 : 0.5,
            }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
