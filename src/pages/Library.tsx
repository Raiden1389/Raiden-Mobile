import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { SyncDialog } from '../components/SyncDialog';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { LibraryHeader } from '../components/LibraryHeader';
import { PushStatusBar } from '../components/PushStatusBar';
import { EmptyState } from '../components/EmptyState';
import { useLibrary } from '../hooks/useLibrary';
import type { Workspace } from '../lib/db';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PageTransition } from '../components/PageTransition';

const APP_VERSION = '1.4.0';
const BUILD_ID = '12/02 10h24';

export function LibraryPage() {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const isDark = theme.bg === '#000000' || theme.bg === '#1a1a2e';
  const [hasUpdate, setHasUpdate] = useState(false);
  const isOnline = useOnlineStatus();
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const {
    workspaces,
    totalPending,
    totalChapters,
    isSyncOpen,
    openSync,
    closeSync,
    pushStatus,
    isPushing,
    handlePushBack,
  } = useLibrary();

  // Listen for SW update
  useEffect(() => {
    const handler = () => setHasUpdate(true);
    window.addEventListener('sw-update-ready', handler);
    return () => window.removeEventListener('sw-update-ready', handler);
  }, []);

  const handleUpdate = () => {
    const updateSW = (window as unknown as Record<string, unknown>).__updateSW as ((reloadPage?: boolean) => void) | undefined;
    if (updateSW) updateSW(true);
    else window.location.reload();
  };

  // Pull-to-refresh → open sync
  const handlePullRefresh = useCallback(async () => {
    openSync();
  }, [openSync]);

  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 60,
  });

  return (
    <PageTransition>
      <div
        {...pullHandlers}
        style={{
          minHeight: '100dvh',
          width: '100%',
          background: isDark
            ? 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
            : `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg}ee 60%, ${theme.accent}08 100%)`,
          color: theme.text,
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
          overflowY: 'auto',
        }}>
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && (
          <div style={{
            height: `${pullDistance}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: isRefreshing ? 'none' : 'height 0.2s ease',
            overflow: 'hidden',
          }}>
            <span style={{
              fontSize: '20px',
              transform: pullDistance >= 60 ? 'rotate(180deg)' : `rotate(${pullDistance * 3}deg)`,
              transition: 'transform 0.2s ease',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}>
              {isRefreshing ? '🔄' : '↓'}
            </span>
          </div>
        )}
        {isSyncOpen && <SyncDialog onClose={closeSync} onSuccess={() => {
          // Count chapters to show in toast
          const count = totalChapters;
          setSyncToast(`✅ Đã cập nhật ${count} chương`);
          setTimeout(() => setSyncToast(null), 3000);
        }} />}

        {/* Update Banner */}
        {hasUpdate && (
          <div style={{
            margin: '0', padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))',
            borderBottom: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'slideDown 0.3s ease',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>🆕 Có bản cập nhật mới!</span>
            <button
              onClick={handleUpdate}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cập nhật
            </button>
          </div>
        )}

        <LibraryHeader
          isDark={isDark}
          accent={theme.accent}
          textColor={theme.text}
          border={theme.border}
          totalPending={totalPending}
          totalChapters={totalChapters}
          workspaceCount={workspaces?.length ?? 0}
          isPushing={isPushing}
          onPush={handlePushBack}
          onSync={openSync}
          version={APP_VERSION}
          buildId={BUILD_ID}
          isOnline={isOnline}
        />

        <PushStatusBar status={pushStatus} accent={theme.accent} />

        <main style={{ padding: '20px 16px' }}>
          {/* Continue Reading Card */}
          <ContinueReadingCard workspaces={workspaces} isDark={isDark} accent={theme.accent} />

          {workspaces === undefined ? (
            <SkeletonGrid isDark={isDark} />
          ) : workspaces.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {workspaces.map(ws => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  accent={theme.accent}
                  isDark={isDark}
                  textColor={theme.text}
                />
              ))}
            </div>
          )}
        </main>

        {/* Sync Toast */}
        {syncToast && (
          <div style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            padding: '10px 20px', borderRadius: '12px',
            background: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            backdropFilter: 'blur(12px)',
            color: isDark ? '#6ee7b7' : '#065f46',
            fontSize: '13px', fontWeight: 700,
            zIndex: 500,
            animation: 'slideUp 0.3s ease, fadeIn 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}>
            {syncToast}
          </div>
        )}

        <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translate(-50%, 20px); } to { transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      </div>
    </PageTransition>
  );
}

/* ─── Skeleton (private, small) ─── */

function SkeletonGrid({ isDark }: { isDark: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          borderRadius: '16px', overflow: 'hidden',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        }}>
          <div style={{
            aspectRatio: '3/4',
            background: isDark
              ? 'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 70%)'
              : 'linear-gradient(110deg, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
          <div style={{ padding: '10px 12px' }}>
            <div style={{
              height: '12px', borderRadius: '6px', width: '60%',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Continue Reading Card ─── */

function ContinueReadingCard({ workspaces, isDark, accent }: {
  workspaces: Workspace[] | undefined;
  isDark: boolean;
  accent: string;
}) {
  const nav = useNavigate();
  if (!workspaces?.length) return null;

  // Find last-read workspace (check localStorage for saved positions)
  let lastWs: Workspace | null = null;
  let savedRatio = 0;
  for (const ws of workspaces) {
    const raw = localStorage.getItem(`raiden-lastChapter-${ws.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.ratio !== undefined) {
          savedRatio = parsed.ratio;
        }
      } catch { /* ignore */ }
      if (!lastWs) lastWs = ws;
    }
  }
  if (!lastWs) return null;

  return (
    <div
      onClick={() => nav(`/reader/${lastWs!.id}`)}
      style={{
        marginBottom: '16px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18, ${accent}08)`
          : `linear-gradient(135deg, ${accent}12, ${accent}05)`,
        border: `1px solid ${accent}30`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px',
        transition: 'transform 0.15s ease',
      }}
    >
      <span style={{ fontSize: '28px' }}>📖</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.05em', opacity: 0.5, marginBottom: '2px',
        }}>
          Đọc tiếp
        </div>
        <div style={{
          fontSize: '14px', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {lastWs.title}
        </div>
        <div style={{
          fontSize: '11px', opacity: 0.5, marginTop: '2px',
        }}>
          {Math.round(savedRatio * 100)}% chương hiện tại
        </div>
      </div>
      <span style={{
        fontSize: '20px', opacity: 0.6,
      }}>▶</span>
    </div>
  );
}

