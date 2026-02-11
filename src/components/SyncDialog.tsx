import { useState } from 'react';
import { syncService } from '../lib/sync';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { useReaderSettings } from '../contexts/ReaderContext';

interface SyncDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SyncDialog({ onClose, onSuccess }: SyncDialogProps) {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];

  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'syncing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState('');

  const handleSync = async () => {
    if (!url) return;
    setStatus('connecting');
    setError('');

    try {
      // 1. Parse & Check connection
      syncService.parseQR(url);
      const isAlive = await syncService.checkConnection();
      if (!isAlive) throw new Error('Không thể kết nối tới PC. Kiểm tra cùng mạng Wifi.');

      // 2. Extract workspaceId from URL
      const urlObj = new URL(url.replace('raiden://', 'http://'));
      const workspaceId = urlObj.searchParams.get('workspaceId');
      if (!workspaceId) throw new Error('Mã QR thiếu workspaceId');

      // 3. Sync
      setStatus('syncing');
      await syncService.downloadWorkspace(workspaceId, (loaded, total) => {
        setProgress({ loaded, total });
      });

      setStatus('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: theme.bg,
        color: theme.text,
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Đồng bộ Mobile
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '20px' }}>
          Nhập URL đồng bộ hoặc dán dữ liệu từ mã QR.
        </p>

        {status === 'idle' || status === 'error' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="raiden://sync?..."
              style={{
                width: '100%',
                height: '80px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px',
                color: theme.text,
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                ⚠️ {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.text,
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSync}
                style={{
                  flex: 2,
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme.accent,
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                Bắt đầu
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {status === 'connecting' && <p>Đang kết nối tới PC...</p>}
            {status === 'syncing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontWeight: 600, marginBottom: '12px' }}>Đang tải truyện...</p>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(progress.loaded / progress.total) * 100}%`,
                    height: '100%',
                    background: theme.accent,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.6 }}>
                  {progress.loaded} / {progress.total} chương
                </p>
              </div>
            )}
            {status === 'done' && (
              <div style={{ color: '#10b981' }}>
                <p style={{ fontSize: '40px' }}>✅</p>
                <p style={{ fontWeight: 700 }}>Hoàn tất!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
