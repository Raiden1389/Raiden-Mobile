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

interface WorkspaceInfo {
  id: string;
  title: string;
  chapterCount: number;
}

/**
 * SyncDialog — Library Sync: downloads ALL workspaces at once
 * Auto-detects Desktop sync server on same network
 */
export function SyncDialog({ onClose, onSuccess }: SyncDialogProps) {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];

  const [status, setStatus] = useState<'scanning' | 'found' | 'syncing' | 'done' | 'not_found' | 'error'>('scanning');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [currentWs, setCurrentWs] = useState('');
  const [error, setError] = useState('');
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);
  const [manifest, setManifest] = useState<{ workspaces: WorkspaceInfo[]; totalChapters: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ workspaces: number; chapters: number } | null>(null);

  const savedConnection = useLiveQuery(() => db.syncMeta.get('lastSyncConnection'));

  const discover = useCallback(async () => {
    setStatus('scanning');
    setError('');

    const hostname = window.location.hostname;
    const isHTTPS = window.location.protocol === 'https:';
    const isTunnel = hostname.includes('trycloudflare.com') || hostname.includes('ngrok') || isHTTPS;

    const urlsToTry: string[] = [];
    if (isTunnel) {
      urlsToTry.push(window.location.origin);
    } else {
      urlsToTry.push(`http://${hostname}:8888`);
    }

    const savedIp = savedConnection?.value ? JSON.parse(savedConnection.value).ip : null;
    if (savedIp) {
      const savedUrl = `http://${savedIp}:8888`;
      if (!urlsToTry.includes(savedUrl)) urlsToTry.push(savedUrl);
    }

    console.log('[SyncDialog] Trying URLs:', urlsToTry);

    for (const baseUrl of urlsToTry) {
      try {
        const res = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (data.app === 'raiden') {
            console.log(`[SyncDialog] Found Desktop at ${baseUrl}`);

            // Get manifest (list of all workspaces)
            const manifestRes = await fetch(`${baseUrl}/manifest`, { signal: AbortSignal.timeout(5000) });
            if (manifestRes.ok) {
              const manifestData = await manifestRes.json();

              const displayIp = hostname;
              const displayPort = isTunnel ? 443 : 8888;
              setServerInfo({ ip: displayIp, port: displayPort });
              setManifest(manifestData);

              // Configure syncService
              syncService.parseQR(`raiden://sync?ip=${hostname}&port=${isTunnel ? '443' : '8888'}&token=lan`);
              if (isTunnel) {
                (syncService as any).config = { serverUrl: baseUrl, token: 'lan' };
              }

              setStatus('found');
              await db.syncMeta.put({
                key: 'lastSyncConnection',
                value: JSON.stringify({ ip: hostname, port: isTunnel ? 443 : 8888 }),
              });
              return;
            }
          }
        }
      } catch (err) {
        console.log(`[SyncDialog] Failed: ${baseUrl}`, err);
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
    if (!manifest) return;
    setStatus('syncing');

    try {
      const result = await syncService.downloadLibrary((loaded, total, wsName) => {
        setProgress({ loaded, total });
        if (wsName) setCurrentWs(wsName);
      });
      setSyncResult(result);
      setStatus('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
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
          📡 Đồng bộ thư viện
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

        {/* Found — Show workspace list */}
        {status === 'found' && manifest && (
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
                {serverInfo?.ip}:{serverInfo?.port}
              </p>
            </div>

            {/* Workspace list */}
            <div style={{
              maxHeight: '200px', overflowY: 'auto',
              borderRadius: '12px', border: `1px solid ${theme.border}`,
            }}>
              {manifest.workspaces.map((ws, i) => (
                <div key={ws.id} style={{
                  padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: i < manifest.workspaces.length - 1 ? `1px solid ${theme.border}` : 'none',
                  fontSize: '13px',
                }}>
                  <span style={{
                    fontWeight: 600, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    📖 {ws.title}
                  </span>
                  <span style={{ opacity: 0.5, fontSize: '11px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                    {ws.chapterCount} ch.
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', opacity: 0.5, textAlign: 'center' }}>
              {manifest.workspaces.length} truyện · {manifest.totalChapters} chương
            </p>

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
              🔄 Tải tất cả
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

        {/* Syncing — progress with current workspace name */}
        {status === 'syncing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Đang tải truyện...</p>
            {currentWs && (
              <p style={{
                fontSize: '12px', opacity: 0.6, marginBottom: '12px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                📖 {currentWs}
              </p>
            )}
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

        {/* Done — show summary */}
        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#10b981' }}>
            <p style={{ fontSize: '40px' }}>✅</p>
            <p style={{ fontWeight: 700 }}>Hoàn tất!</p>
            {syncResult && (
              <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                {syncResult.workspaces} truyện · {syncResult.chapters} chương
              </p>
            )}
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
