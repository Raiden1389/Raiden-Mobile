import { useState, useRef, useEffect } from 'react';
import type { ThemeColors } from '../contexts/ReaderTypes';

interface Props {
  /** Pre-selected text (empty string = manual find & replace mode) */
  paragraphText: string;
  theme: ThemeColors;
  onSave: (oldText: string, newText: string, scope: 'chapter' | 'all') => void;
  onCancel: () => void;
}

/**
 * EditDialog — Correction dialog
 * 
 * Mode 1: paragraphText filled → shows "máy tính xách tay" with strikethrough, user types "laptop"
 * Mode 2: paragraphText empty → user types both find and replace (fallback)
 */
export function EditDialog({ paragraphText, theme, onSave, onCancel }: Props) {
  const hasPreselection = paragraphText.length > 0;
  const [findText, setFindText] = useState(paragraphText);
  const [replaceText, setReplaceText] = useState('');
  const [scope, setScope] = useState<'chapter' | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSave = () => {
    const find = findText.trim();
    const replace = replaceText.trim();
    if (find && replace && find !== replace) {
      onSave(find, replace, scope);
    }
  };

  const isDark = theme.bg === '#000000';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 500,
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        width: '100%',
        background: isDark ? '#1a1a1a' : '#fff',
        color: theme.text,
        borderRadius: '20px 20px 0 0',
        padding: '20px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Drag handle */}
        <div style={{
          width: '40px', height: '4px', borderRadius: '2px',
          background: theme.border, margin: '0 auto 16px',
        }} />

        {/* Title */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
          ✏️ {hasPreselection ? 'Sửa lỗi dịch' : 'Tìm & Sửa'}
        </h3>

        {/* Find text — pre-filled or editable */}
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: '#ef444420', border: '1px solid #ef444440',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {hasPreselection ? 'Sẽ thay thế' : 'Tìm từ sai'}
          </div>
          {hasPreselection ? (
            <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4, wordBreak: 'break-word' }}>
              <s style={{ opacity: 0.6 }}>{paragraphText}</s>
            </div>
          ) : (
            <input
              type="text"
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="Gõ từ/cụm từ cần sửa..."
              style={{
                width: '100%', padding: '0',
                border: 'none', background: 'transparent',
                color: theme.text, fontSize: '15px', fontWeight: 700,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Replace input */}
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: '#10b98120', border: `2px solid ${theme.accent}`,
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Thay bằng
          </div>
          <input
            ref={inputRef}
            type="text"
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Gõ từ/cụm từ đúng..."
            style={{
              width: '100%', padding: '0',
              border: 'none', background: 'transparent',
              color: theme.text, fontSize: '15px', fontWeight: 700,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Scope */}
        <div style={{ marginBottom: '16px' }}>
          {(['chapter', 'all'] as const).map(s => (
            <label
              key={s}
              onClick={() => setScope(s)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: '8px', padding: '6px 0',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: scope === s ? 700 : 400,
                opacity: scope === s ? 1 : 0.5,
              }}
            >
              <span style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${scope === s ? theme.accent : theme.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {scope === s && (
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.accent }} />
                )}
              </span>
              {s === 'chapter' ? 'Chỉ chương này' : 'Tất cả từ đây trở đi'}
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: 'transparent', color: theme.text,
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!findText.trim() || !replaceText.trim() || findText.trim() === replaceText.trim()}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px',
              border: 'none',
              background: (findText.trim() && replaceText.trim()) ? theme.accent : theme.border,
              color: '#fff', fontSize: '14px', fontWeight: 700,
              cursor: (findText.trim() && replaceText.trim()) ? 'pointer' : 'default',
              opacity: (findText.trim() && replaceText.trim()) ? 1 : 0.5,
            }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
