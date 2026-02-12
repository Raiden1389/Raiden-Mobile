import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LibraryHeaderProps {
  isDark: boolean;
  accent: string;
  textColor: string;
  border: string;
  totalPending: number;
  totalChapters: number;
  workspaceCount: number;
  isPushing: boolean;
  onPush: () => void;
  onSync: () => void;
  version: string;
  buildId: string;
  isOnline: boolean;
}

export function LibraryHeader({ isDark, accent, textColor, border, totalPending, totalChapters, workspaceCount, isPushing, onPush, onSync, version, buildId, isOnline }: LibraryHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const nav = useNavigate();

  // Listen for SW update signal
  useEffect(() => {
    const handler = () => setHasUpdate(true);
    window.addEventListener('sw-update-ready', handler);
    return () => window.removeEventListener('sw-update-ready', handler);
  }, []);

  const [checking, setChecking] = useState(false);

  const handleUpdate = async () => {
    setMenuOpen(false);

    // If update already detected, apply immediately
    if (hasUpdate) {
      const updateFn = (window as unknown as Record<string, unknown>).__updateSW;
      if (typeof updateFn === 'function') {
        (updateFn as (reloadPage?: boolean) => void)(true);
      } else {
        window.location.reload();
      }
      return;
    }

    // Force SW to check server for new version
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.update();
        // Wait a moment for SW to process
        await new Promise(r => setTimeout(r, 2000));
        if (hasUpdate) {
          const updateFn = (window as unknown as Record<string, unknown>).__updateSW;
          if (typeof updateFn === 'function') {
            (updateFn as (reloadPage?: boolean) => void)(true);
          }
        } else {
          alert('✅ Đã là bản mới nhất!');
        }
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    } finally {
      setChecking(false);
    }
  };

  return (
    <header style={{
      padding: '20px 20px 16px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))'
        : `linear-gradient(135deg, ${accent}12, ${accent}06)`,
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : border}`,
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo + stats */}
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, margin: 0,
            letterSpacing: '-0.02em',
            background: isDark
              ? 'linear-gradient(135deg, #fff, #a5b4fc)'
              : `linear-gradient(135deg, ${textColor}, ${accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🦅 Raiden Reader
          </h1>
          <p style={{
            fontSize: '11px', opacity: 0.5, margin: '2px 0 0',
            fontWeight: 500, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            v{version} ({buildId}) · {workspaceCount} truyện · {totalChapters} chương
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: '10px', fontWeight: 700,
              color: isOnline ? '#10b981' : '#ef4444',
              animation: isOnline ? 'none' : 'offline-pulse 2s infinite',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: isOnline ? '#10b981' : '#ef4444',
                boxShadow: isOnline ? '0 0 4px #10b981' : '0 0 4px #ef4444',
              }} />
              {isOnline ? '' : 'Offline'}
            </span>
          </p>
        </div>

        {/* ⋮ Menu button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              background: 'none', border: 'none',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              fontSize: '22px', cursor: 'pointer',
              padding: '4px 8px', borderRadius: '8px',
              position: 'relative',
            }}
          >
            ⋮
            {(totalPending > 0 || hasUpdate) && (
              <span style={{
                position: 'absolute', top: '2px', right: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: hasUpdate ? '#22c55e' : '#ef4444',
                boxShadow: hasUpdate ? '0 0 6px rgba(34,197,94,0.6)' : '0 0 6px rgba(239,68,68,0.6)',
                animation: 'pulse-badge 2s infinite',
              }} />
            )}
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              />
              <div style={{
                position: 'absolute', top: '100%', right: 0,
                marginTop: '8px', zIndex: 100,
                minWidth: '200px',
                background: isDark ? 'rgba(30,30,50,0.95)' : 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(20px)',
                borderRadius: '14px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                animation: 'slideDown 0.15s ease',
              }}>
                <button
                  onClick={() => { setMenuOpen(false); onSync(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    color: isDark ? '#e0e0e0' : '#333',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📡</span>
                  Sync từ PC
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onPush(); }}
                  disabled={isPushing}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    color: totalPending > 0
                      ? (isDark ? '#fbbf24' : '#d97706')
                      : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
                    fontSize: '14px', fontWeight: 600, cursor: isPushing ? 'wait' : 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{isPushing ? '⏳' : '↑'}</span>
                  Gửi sửa lỗi về PC
                  {totalPending > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ef4444', color: '#fff',
                      borderRadius: '10px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: 800,
                    }}>
                      {totalPending}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setMenuOpen(false); nav('/corrections'); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📝</span>
                  Lịch sử sửa lỗi
                </button>

                {/* Update app button */}
                <button
                  onClick={handleUpdate}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    background: hasUpdate
                      ? (isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)')
                      : 'none',
                    color: hasUpdate
                      ? '#22c55e'
                      : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
                    fontSize: '14px', fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{checking ? '⏳' : '🔄'}</span>
                  {checking ? 'Đang kiểm tra...' : hasUpdate ? 'Cập nhật mới!' : 'Kiểm tra cập nhật'}
                  {hasUpdate && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#22c55e', color: '#fff',
                      borderRadius: '10px', padding: '2px 8px',
                      fontSize: '10px', fontWeight: 800,
                    }}>NEW</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
