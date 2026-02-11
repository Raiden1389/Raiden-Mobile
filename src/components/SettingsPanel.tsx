import { useState, useEffect, useRef, useCallback } from 'react';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP, type FontFamily } from '../contexts/ReaderTypes';

// ===================================================
// SETTINGS PANEL — Bottom sheet for reader customization
// ===================================================

const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Literata', value: 'Literata' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Noto Serif', value: 'Noto Serif' },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, setTheme, setFontFamily, setFontSize, setLineHeight, setDimmerOpacity } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const panelRef = useRef<HTMLDivElement>(null);
  const [storageUsed, setStorageUsed] = useState('...');

  // Estimate storage
  useEffect(() => {
    if (open && navigator.storage?.estimate) {
      navigator.storage.estimate().then(est => {
        const mb = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
        setStorageUsed(`${mb} MB`);
      });
    }
  }, [open]);

  // Close on outside click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.5,
    marginBottom: '10px',
    display: 'block',
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: '100%',
          maxHeight: '70vh',
          background: theme.bg,
          color: theme.text,
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.25s ease',
          overflowY: 'auto',
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            background: theme.text,
            opacity: 0.2,
          }} />
        </div>

        {/* Theme */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Theme</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['dark', 'sepia', 'light'] as const).map(t => {
              const tc = THEME_MAP[t];
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: settings.theme === t ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                    background: tc.bg,
                    color: tc.text,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'dark' ? '🌙 Tối' : t === 'sepia' ? '📜 Sepia' : '☀️ Sáng'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Font</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FONT_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setFontFamily(f.value)}
                style={{
                  flex: '1 1 45%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: settings.fontFamily === f.value ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.text,
                  fontFamily: `"${f.value}", serif`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Cỡ chữ: {settings.fontSize}px</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', opacity: 0.4 }}>A</span>
            <input
              type="range"
              min={14}
              max={28}
              step={1}
              value={settings.fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.accent }}
            />
            <span style={{ fontSize: '20px', opacity: 0.4, fontWeight: 700 }}>A</span>
          </div>
          <div style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '8px',
            background: `${theme.text}0a`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: `"${settings.fontFamily}", serif`,
          }}>
            Đoạn văn mẫu để xem trước...
          </div>
        </div>

        {/* Line Height */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Khoảng cách dòng: {settings.lineHeight.toFixed(1)}</span>
          <input
            type="range"
            min={1.4}
            max={2.2}
            step={0.1}
            value={settings.lineHeight}
            onChange={e => setLineHeight(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }}
          />
        </div>

        {/* Dimmer */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Độ tối: {Math.round(settings.dimmerOpacity * 100)}%</span>
          <input
            type="range"
            min={0}
            max={0.7}
            step={0.05}
            value={settings.dimmerOpacity}
            onChange={e => setDimmerOpacity(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }}
          />
        </div>

        {/* Storage Info */}
        <div style={{
          fontSize: '11px',
          opacity: 0.3,
          textAlign: 'center',
          fontWeight: 600,
        }}>
          Dung lượng: {storageUsed}
        </div>
      </div>
    </div>
  );
}
