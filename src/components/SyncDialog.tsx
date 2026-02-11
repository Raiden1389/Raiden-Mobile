import { useState, useEffect, useCallback, useRef } from 'react';
import { syncService } from '../lib/sync';
import { db } from '../lib/db';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { useReaderSettings } from '../contexts/ReaderContext';
import { useLiveQuery } from 'dexie-react-hooks';

interface SyncDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * SyncDialog — Auto-detects Desktop sync server on same PC
 * Zero config: uses window.location.hostname to find the server
 */
export function SyncDialog({ onClose, onSuccess }: SyncDialogProps) {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];

  const [status, setStatus] = useState<'scanning' | 'found' | 'syncing' | 'done' | 'not_found' | 'error'>('scanning');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState('');
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number; workspaceId?: string } | null>(null);

  // Get saved connection from last sync
  const savedConnection = useLiveQuery(() => db.syncMeta.get('lastSyncConnection'));

  // Auto-discover sync server
  const discover = useCallback(async () => {
    setStatus('scanning');
    setError('');

    // Strategy 1: Same host as PWA (most likely)
    const pcIp = window.location.hostname;
    const port = 8888;

    // Also try saved connection IP if different
    const savedIp = savedConnection?.value ? JSON.parse(savedConnection.value).ip : null;
    const ipsToTry = [pcIp, savedIp].filter(Boolean) as string[];
    // Remove duplicates
    const uniqueIps = [...new Set(ipsToTry)];

    for (const ip of uniqueIps) {
      try {
        const res = await fetch(`http://${ip}:${port}/status`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.app === 'raiden') {
            // Found server! Get workspace info from manifest
            const manifestRes = await fetch(`http://${ip}:${port}/manifest`, {
              signal: AbortSignal.timeout(3000),
            });
            if (manifestRes.ok) {
              // Get workspace info
              const wsRes = await fetch(`http://${ip}:${port}/workspace`, {
                signal: AbortSignal.timeout(3000),
              });
              const wsData = wsRes.ok ? await wsRes.json() : null;

              setServerInfo({ ip, port, workspaceId: wsData?.id });

              // Connect syncService (no token needed for LAN)
              syncService.parseQR(`raiden://sync?ip=${ip}&port=${port}&token=lan&workspaceId=${wsData?.id || ''}`);
              setStatus('found');

              // Save this connection for future
              await db.syncMeta.put({
                key: 'lastSyncConnection',
                value: JSON.stringify({ ip, port }),
              });
              return;
            }
          }
        }
      } catch {
        // Try next IP
      }
    }

    setStatus('not_found');
  }, [savedConnection]);

  const didDiscover = useRef(false);
  useEffect(() => {
    if (didDiscover.current) return;
    didDiscover.current = true;
    discover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    if (!serverInfo?.workspaceId) return;
    setStatus('syncing');

    try {
      await syncService.downloadWorkspace(serverInfo.workspaceId, (loaded, total) => {
        setProgress({ loaded, total });
      });
      setStatus('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const isDark = theme.bg === '#000000';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: isDark ? '#1a1a1a' : '#fff',
        color: theme.text,
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          📡 Đồng bộ
        </h2>

        {/* Scanning */}
        {status === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>📡</div>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Đang tìm máy tính...</p>
            <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
              Kiểm tra {window.location.hostname}:8888
            </p>
          </div>
        )}

        {/* Found — One-tap sync */}
        {status === 'found' && serverInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px', borderRadius: '16px',
              background: '#10b98115', border: '1px solid #10b98130',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                Tìm thấy Desktop!
              </p>
              <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', fontFamily: 'monospace' }}>
                {serverInfo.ip}:{serverInfo.port}
              </p>
            </div>

            <button
              onClick={handleSync}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '14px', border: 'none',
                background: theme.accent, color: '#fff',
                fontSize: '16px', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Tải truyện ngay
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '10px',
                borderRadius: '10px',
                border: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.text,
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        )}

        {/* Syncing */}
        {status === 'syncing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>Đang tải truyện...</p>
            <div style={{
              width: '100%', height: '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                height: '100%', background: theme.accent,
                transition: 'width 0.3s',
              }} />
            </div>
            <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.6 }}>
              {progress.loaded} / {progress.total} chương
            </p>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#10b981' }}>
            <p style={{ fontSize: '40px' }}>✅</p>
            <p style={{ fontWeight: 700 }}>Hoàn tất!</p>
          </div>
        )}

        {/* Not found */}
        {status === 'not_found' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>😔</div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Không tìm thấy Desktop</p>
              <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                Mở app Translator trên PC → bấm 📱 Sync trước
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  border: `1px solid ${theme.border}`, background: 'transparent',
                  color: theme.text, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              <button
                onClick={discover}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  border: 'none', background: theme.accent,
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>⚠️ {error}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: `1px solid ${theme.border}`, background: 'transparent',
                color: theme.text, fontWeight: 600, cursor: 'pointer',
              }}>Đóng</button>
              <button onClick={discover} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: 'none', background: theme.accent,
                color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}>Thử lại</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
