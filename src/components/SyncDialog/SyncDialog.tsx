import { THEME_MAP } from '../../contexts/ReaderTypes';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { useSync } from '../../hooks/useSync';
import type { WorkspaceInfo } from '../../hooks/useSync';
import './syncDialog.css';

interface SyncDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SyncDialog({ onClose, onSuccess }: SyncDialogProps) {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const isDark = theme.bg === '#000000';

  const sync = useSync(onSuccess, onClose);

  return (
    <div className="sync-overlay">
      <div
        className="sync-card"
        style={{
          background: isDark ? '#1a1a1a' : '#fff',
          color: theme.text,
          border: `1px solid ${theme.border}`,
        }}
      >
        <h2 className="sync-title">📡 Đồng bộ thư viện</h2>

        {sync.status === 'scanning' && <SyncScanning />}

        {sync.status === 'found' && sync.manifest && (
          <SyncFound
            manifest={sync.manifest}
            serverInfo={sync.serverInfo}
            selectedWs={sync.selectedWs}
            onToggleWs={sync.toggleWs}
            onToggleAll={sync.toggleAll}
            onSync={sync.startSync}
            onClose={onClose}
            theme={theme}
          />
        )}

        {sync.status === 'syncing' && (
          <SyncProgress
            progress={sync.progress}
            currentWs={sync.currentWs}
            accent={theme.accent}
          />
        )}

        {sync.status === 'done' && <SyncDone result={sync.syncResult} />}

        {sync.status === 'not_found' && (
          <SyncNotFound onRetry={sync.discover} onClose={onClose} theme={theme} />
        )}

        {sync.status === 'error' && (
          <SyncError error={sync.error} onRetry={sync.discover} onClose={onClose} theme={theme} />
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SyncScanning() {
  return (
    <div className="sync-scanning">
      <div className="sync-scanning__icon">📡</div>
      <p className="sync-scanning__text">Đang tìm máy tính...</p>
      <p className="sync-scanning__sub">Kiểm tra {window.location.hostname}:8888</p>
    </div>
  );
}

interface ThemeColors {
  accent: string;
  border: string;
  text: string;
}

function SyncFound({ manifest, serverInfo, selectedWs, onToggleWs, onToggleAll, onSync, onClose, theme }: {
  manifest: { workspaces: WorkspaceInfo[]; totalChapters: number };
  serverInfo: { ip: string; port: number } | null;
  selectedWs: Set<string>;
  onToggleWs: (id: string) => void;
  onToggleAll: () => void;
  onSync: () => void;
  onClose: () => void;
  theme: ThemeColors;
}) {
  const allSelected = selectedWs.size === manifest.workspaces.length;
  const selectedCount = selectedWs.size;
  const selectedChapters = manifest.workspaces
    .filter(ws => selectedWs.has(ws.id))
    .reduce((s, ws) => s + ws.chapterCount, 0);

  return (
    <div className="sync-found">
      {/* Banner */}
      <div className="sync-found__banner">
        <div className="sync-found__banner-icon">✅</div>
        <p className="sync-found__banner-title">Tìm thấy Desktop!</p>
        <p className="sync-found__banner-ip">
          {serverInfo?.ip}:{serverInfo?.port}
        </p>
      </div>

      {/* Select bar */}
      <div className="sync-select-bar">
        <span className="sync-select-bar__count">
          {selectedCount} / {manifest.workspaces.length} truyện
        </span>
        <button
          className="sync-select-bar__toggle"
          onClick={onToggleAll}
          style={{ color: theme.accent }}
        >
          {allSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
        </button>
      </div>

      {/* Workspace list */}
      <div className="sync-ws-list" style={{ border: `1px solid ${theme.border}` }}>
        {manifest.workspaces.map((ws, i) => {
          const checked = selectedWs.has(ws.id);
          return (
            <div
              key={ws.id}
              className="sync-ws-item"
              onClick={() => onToggleWs(ws.id)}
              style={{
                borderBottom: i < manifest.workspaces.length - 1 ? `1px solid ${theme.border}` : 'none',
                background: checked ? `${theme.accent}08` : 'transparent',
              }}
            >
              <span
                className="sync-ws-check"
                style={{
                  border: checked ? 'none' : `2px solid ${theme.border}`,
                  background: checked ? theme.accent : 'transparent',
                }}
              >
                {checked && '✓'}
              </span>
              <span className="sync-ws-title">{ws.title}</span>
              <span className="sync-ws-count">{ws.chapterCount} ch.</span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <p className="sync-summary">
        {selectedCount} truyện · {selectedChapters} chương
      </p>

      {/* Action buttons */}
      <button
        className="sync-btn-primary"
        onClick={onSync}
        disabled={selectedCount === 0}
        style={{ background: selectedCount > 0 ? theme.accent : `${theme.accent}40` }}
      >
        🔄 Tải {allSelected ? 'tất cả' : `${selectedCount} truyện`}
      </button>

      <button
        className="sync-btn-secondary"
        onClick={onClose}
        style={{ border: `1px solid ${theme.border}`, color: theme.text }}
      >
        Đóng
      </button>
    </div>
  );
}

function SyncProgress({ progress, currentWs, accent }: {
  progress: { loaded: number; total: number };
  currentWs: string;
  accent: string;
}) {
  const pct = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;

  return (
    <div className="sync-progress">
      <p className="sync-progress__title">Đang tải truyện...</p>
      {currentWs && <p className="sync-progress__ws">📖 {currentWs}</p>}
      <div className="sync-progress__bar">
        <div className="sync-progress__fill" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <p className="sync-progress__count">
        {progress.loaded} / {progress.total} chương
      </p>
    </div>
  );
}

function SyncDone({ result }: { result: { workspaces: number; chapters: number } | null }) {
  return (
    <div className="sync-done">
      <p className="sync-done__icon">✅</p>
      <p className="sync-done__title">Hoàn tất!</p>
      {result && (
        <p className="sync-done__summary">
          {result.workspaces} truyện · {result.chapters} chương
        </p>
      )}
    </div>
  );
}

function SyncNotFound({ onRetry, onClose, theme }: {
  onRetry: () => void;
  onClose: () => void;
  theme: ThemeColors;
}) {
  return (
    <div className="sync-empty">
      <div className="sync-empty__body">
        <div className="sync-empty__icon">😔</div>
        <p className="sync-empty__title">Không tìm thấy Desktop</p>
        <p className="sync-empty__hint">Mở app Translator trên PC → bấm 📱 Sync trước</p>
      </div>
      <div className="sync-btn-row">
        <button onClick={onClose} style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text }}>
          Đóng
        </button>
        <button onClick={onRetry} style={{ border: 'none', background: theme.accent, color: '#fff' }}>
          Thử lại
        </button>
      </div>
    </div>
  );
}

function SyncError({ error, onRetry, onClose, theme }: {
  error: string;
  onRetry: () => void;
  onClose: () => void;
  theme: ThemeColors;
}) {
  return (
    <div className="sync-empty">
      <div className="sync-empty__body">
        <p className="sync-error-msg">⚠️ {error}</p>
      </div>
      <div className="sync-btn-row">
        <button onClick={onClose} style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text }}>
          Đóng
        </button>
        <button onClick={onRetry} style={{ border: 'none', background: theme.accent, color: '#fff' }}>
          Thử lại
        </button>
      </div>
    </div>
  );
}
