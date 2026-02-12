import { useState, useEffect, useRef, useCallback } from 'react';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP, type FontFamily, type ThemeMode, type ThemeColors } from '../contexts/ReaderTypes';

// ===================================================
// SETTINGS PANEL — Bottom sheet for reader customization
// ===================================================

const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Literata', value: 'Literata' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Source Serif', value: 'Source Serif 4' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Noto Serif', value: 'Noto Serif' },
  { label: 'Inter', value: 'Inter' },
];

const THEME_OPTIONS: { key: ThemeMode; label: string; emoji: string }[] = [
  { key: 'dark', label: 'Tối', emoji: '🌙' },
  { key: 'forest', label: 'Forest', emoji: '🌲' },
  { key: 'slate', label: 'Slate', emoji: '🌊' },
  { key: 'sepia', label: 'Sepia', emoji: '📜' },
  { key: 'light', label: 'Sáng', emoji: '☀️' },
];

/** Segmented control — extracted to module level to avoid re-creation during render */
function SegmentedControl<T extends string>({ options, value, onChange, labels, theme }: {
  options: T[]; value: T; onChange: (v: T) => void; labels: Record<T, string>; theme: ThemeColors;
}) {
  return (
    <div style={{
      display: 'flex', padding: '3px', borderRadius: '10px',
      background: `${theme.text}0a`, border: `1px solid ${theme.border}`,
    }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: value === opt ? `${theme.accent}20` : 'transparent',
          color: value === opt ? theme.accent : theme.text,
          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: value === opt ? `inset 0 0 0 1px ${theme.accent}40` : 'none',
        }}>
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    settings, setTheme, setFontFamily, setFontSize, setLineHeight,
    setDimmerOpacity, setParagraphSpacing, setTextAlign, setNightLightIntensity,
    setReadingMode, setMargins, setMaxWidth, setShowDropCap, resetSettings,
  } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const panelRef = useRef<HTMLDivElement>(null);
  const [storageUsed, setStorageUsed] = useState('...');
  const [storageQuota, setStorageQuota] = useState(0);
  const [storagePercent, setStoragePercent] = useState(0);

  // Estimate storage (#60)
  useEffect(() => {
    if (open && navigator.storage?.estimate) {
      navigator.storage.estimate().then(est => {
        const used = est.usage || 0;
        const quota = est.quota || 0;
        const mb = (used / (1024 * 1024)).toFixed(1);
        setStorageUsed(`${mb} MB`);
        setStorageQuota(quota);
        setStoragePercent(quota > 0 ? (used / quota) * 100 : 0);
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

  const previewTheme = THEME_MAP[settings.theme];

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 300,
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: '100%', maxHeight: '80vh',
          background: theme.bg, color: theme.text,
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.25s ease',
          overflowY: 'auto',
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: theme.text, opacity: 0.2 }} />
        </div>

        {/* Reading Mode (#31) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Chế độ đọc</span>
          <SegmentedControl
            options={['scroll', 'paginated']}
            value={settings.readingMode}
            onChange={setReadingMode}
            labels={{ scroll: '📜 Cuộn liên tục', paginated: '📄 Lật trang' }}
            theme={theme}
          />
        </div>

        {/* Theme — Segmented Control (#26) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Theme</span>
          <div style={{
            display: 'flex', padding: '3px', borderRadius: '12px',
            background: `${theme.text}0a`, border: `1px solid ${theme.border}`,
          }}>
            {THEME_OPTIONS.map(t => {
              const tc = THEME_MAP[t.key];
              const isActive = settings.theme === t.key;
              return (
                <button key={t.key}
                  onClick={() => { setTheme(t.key); try { navigator.vibrate?.(15); } catch { /* ignore */ } }}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: '10px',
                    border: 'none',
                    background: isActive ? tc.bg : 'transparent',
                    color: isActive ? tc.text : theme.text,
                    fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? `0 2px 8px rgba(0,0,0,0.2), inset 0 0 0 1.5px ${tc.accent}` : 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{t.emoji}</span>
                  <span style={{ opacity: isActive ? 1 : 0.5 }}>{t.label}</span>
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
              <button key={f.value} onClick={() => setFontFamily(f.value)} style={{
                flex: '1 1 45%', padding: '10px', borderRadius: '10px',
                border: settings.fontFamily === f.value ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                background: 'transparent', color: theme.text,
                fontFamily: `"${f.value}", serif`, fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size + Live Preview (#47) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Cỡ chữ: {settings.fontSize}px</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', opacity: 0.4 }}>A</span>
            <input type="range" min={14} max={28} step={1} value={settings.fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.accent }} />
            <span style={{ fontSize: '20px', opacity: 0.4, fontWeight: 700 }}>A</span>
          </div>
          {/* Live Preview (#47 — Vietnamese sample with diacritics) */}
          <div style={{
            marginTop: '8px', padding: '12px', borderRadius: '8px',
            background: previewTheme.bg, color: previewTheme.text,
            border: `1px solid ${previewTheme.border}`,
            fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight,
            fontFamily: `"${settings.fontFamily}", serif`,
            textAlign: settings.textAlign,
            paddingLeft: `${settings.margins}px`, paddingRight: `${settings.margins}px`,
            transition: 'all 0.2s ease',
          }}>
            "Hắn nhìn lên trời, ánh trăng buông xuống lạnh lẽo. Đây thật sự là tiên giới sao?"
          </div>
        </div>

        {/* Line Height */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Khoảng cách dòng: {settings.lineHeight.toFixed(1)}</span>
          <input type="range" min={1.4} max={2.2} step={0.1} value={settings.lineHeight}
            onChange={e => setLineHeight(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }} />
        </div>

        {/* Paragraph Spacing (#9) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Khoảng cách đoạn: {settings.paragraphSpacing.toFixed(1)}em</span>
          <input type="range" min={0.5} max={2.5} step={0.1} value={settings.paragraphSpacing}
            onChange={e => setParagraphSpacing(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }} />
        </div>

        {/* Text Alignment (#10) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Căn chữ</span>
          <SegmentedControl
            options={['justify', 'left'] as const as ('justify' | 'left')[]}
            value={settings.textAlign}
            onChange={setTextAlign}
            labels={{ justify: '☰ Đều hai bên', left: '☷ Trái' }}
            theme={theme}
          />
        </div>

        {/* Margins (#43) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Lề trái/phải: {settings.margins}px</span>
          <input type="range" min={8} max={48} step={2} value={settings.margins}
            onChange={e => setMargins(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }} />
        </div>

        {/* Max Width (#44) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>
            Chiều rộng tối đa: {settings.maxWidth === 0 ? 'Không giới hạn' : `${settings.maxWidth}px`}
          </span>
          <input type="range" min={0} max={1200} step={50} value={settings.maxWidth}
            onChange={e => setMaxWidth(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }} />
          <div style={{ fontSize: '10px', opacity: 0.3, marginTop: '4px' }}>
            0 = full width | Hữu ích cho tablet/landscape
          </div>
        </div>

        {/* Drop Cap Toggle (#45) */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...labelStyle, marginBottom: 0 }}>Drop Cap (chữ cái đầu to)</span>
          <button
            onClick={() => setShowDropCap(!settings.showDropCap)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              border: 'none', cursor: 'pointer',
              background: settings.showDropCap ? theme.accent : `${theme.text}20`,
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#fff', position: 'absolute', top: '2px',
              left: settings.showDropCap ? '22px' : '2px',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        {/* Night Light (#8) */}
        <div style={sectionStyle}>
          <span style={labelStyle}>
            Ánh sáng ấm: {settings.nightLightIntensity > 0 ? `${Math.round(settings.nightLightIntensity * 100)}%` : 'Tắt'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px' }}>💡</span>
            <input type="range" min={0} max={0.5} step={0.05} value={settings.nightLightIntensity}
              onChange={e => setNightLightIntensity(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#f59e0b' }} />
            <span style={{ fontSize: '14px' }}>🔥</span>
          </div>
        </div>

        {/* Dimmer */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Độ tối: {Math.round(settings.dimmerOpacity * 100)}%</span>
          <input type="range" min={0} max={0.7} step={0.05} value={settings.dimmerOpacity}
            onChange={e => setDimmerOpacity(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.accent }} />
        </div>

        {/* Reset Settings (#46) */}
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <button
            onClick={() => {
              if (confirm('Reset tất cả settings về mặc định?')) resetSettings();
            }}
            style={{
              padding: '8px 20px', borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: 'transparent', color: theme.text,
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              opacity: 0.5, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
          >
            🔄 Reset mặc định
          </button>
        </div>

        {/* Storage Info (#60) */}
        <div style={{
          fontSize: '11px', opacity: storagePercent > 80 ? 1 : 0.3,
          textAlign: 'center', fontWeight: 600,
          color: storagePercent > 80 ? '#f59e0b' : theme.text,
        }}>
          {storagePercent > 80 && '⚠️ '}
          Dung lượng: {storageUsed}
          {storageQuota > 0 && ` / ${(storageQuota / (1024 * 1024 * 1024)).toFixed(1)} GB`}
          {storagePercent > 80 && ` (${storagePercent.toFixed(0)}%)`}
        </div>
      </div>
    </div>
  );
}
