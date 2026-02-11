import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { SyncDialog } from '../components/SyncDialog';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { useLibrary } from '../hooks/useLibrary';
import { PageTransition } from '../components/PageTransition';

export function LibraryPage() {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const isDark = theme.bg === '#000000' || theme.bg === '#1a1a2e';

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

  return (
    <PageTransition>
      <div style={{
        minHeight: '100dvh',
        width: '100%',
        background: isDark
          ? 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
          : `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg}ee 60%, ${theme.accent}08 100%)`,
        color: theme.text,
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      }}>
        {isSyncOpen && <SyncDialog onClose={closeSync} onSuccess={() => { }} />}

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
        />

        <PushStatusBar status={pushStatus} accent={theme.accent} />

        <main style={{ padding: '20px 16px' }}>
          {workspaces === undefined ? (
            /* Skeleton loading */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
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

        <style>{`
        @keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      </div>
    </PageTransition>
  );
}

/* ─── Sub-components (private to this page) ─── */

function LibraryHeader({ isDark, accent, textColor, border, totalPending, totalChapters, workspaceCount, isPushing, onPush, onSync }: {
  isDark: boolean; accent: string; textColor: string; border: string;
  totalPending: number; totalChapters: number; workspaceCount: number;
  isPushing: boolean; onPush: () => void; onSync: () => void;
}) {
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
          }}>
            {workspaceCount} truyện · {totalChapters} chương đã tải
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onPush}
            disabled={isPushing}
            style={{
              background: totalPending > 0
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: totalPending > 0 ? '#fff' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
              border: 'none',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isPushing ? 'wait' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: totalPending > 0 ? '0 2px 12px rgba(245,158,11,0.3)' : 'none',
            }}
          >
            {isPushing ? '⏳' : '↑'} PC
            {totalPending > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 800,
                boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                animation: 'pulse-badge 2s infinite',
              }}>
                {totalPending}
              </span>
            )}
          </button>

          <button
            onClick={onSync}
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '8px 18px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.03em',
              boxShadow: `0 2px 12px ${accent}44`,
              transition: 'all 0.2s ease',
            }}
          >
            📡 Sync
          </button>
        </div>
      </div>
    </header>
  );
}

function PushStatusBar({ status, accent }: { status: string | null; accent: string }) {
  if (!status) return null;

  const bg = status.startsWith('✅')
    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
    : status.startsWith('❌')
      ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))'
      : `linear-gradient(135deg, ${accent}20, ${accent}10)`;

  const borderColor = status.startsWith('✅')
    ? 'rgba(16,185,129,0.2)'
    : status.startsWith('❌')
      ? 'rgba(239,68,68,0.2)'
      : `${accent}30`;

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '10px 16px',
      borderRadius: '12px',
      background: bg,
      border: `1px solid ${borderColor}`,
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: 600,
      animation: 'slideDown 0.3s ease',
    }}>
      {status}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        fontSize: '64px', marginBottom: '16px',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
      }}>📚</div>
      <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', opacity: 0.7 }}>
        Chưa có truyện nào
      </p>
      <p style={{ fontSize: '14px', opacity: 0.4, lineHeight: 1.5 }}>
        Bấm <strong>📡 Sync</strong> để tải truyện từ PC
      </p>
    </div>
  );
}
