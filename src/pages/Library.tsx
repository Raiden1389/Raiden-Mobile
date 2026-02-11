import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncService } from '../lib/sync';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { SyncDialog } from '../components/SyncDialog';

export function LibraryPage() {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const workspaces = useLiveQuery(() => db.workspaces.toArray());
  const totalPending = useLiveQuery(() => db.corrections.where('syncedToPC').equals(0).count());

  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const handlePushBack = async () => {
    if (!workspaces?.length) return;

    try {
      setPushStatus('Đang kết nối...');
      const connected = await syncService.checkConnection();
      if (!connected) {
        setPushStatus('❌ Không kết nối được. Mở Sync trên PC trước!');
        setTimeout(() => setPushStatus(null), 3000);
        return;
      }

      let totalPushed = 0;
      for (const ws of workspaces) {
        const count = await syncService.pushCorrections(ws.id);
        totalPushed += count;
      }

      setPushStatus(`✅ Đã đẩy ${totalPushed} sửa đổi về PC!`);
      setTimeout(() => setPushStatus(null), 3000);
    } catch (err) {
      setPushStatus(`❌ ${err instanceof Error ? err.message : 'Lỗi'}`);
      setTimeout(() => setPushStatus(null), 3000);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {isSyncOpen && (
        <SyncDialog
          onClose={() => setIsSyncOpen(false)}
          onSuccess={() => {
            // Dexie live query will auto-update
          }}
        />
      )}

      {/* Header */}
      <header
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
          🦅 Raiden Reader
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {totalPending && totalPending > 0 ? (
            <button
              onClick={handlePushBack}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '24px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              ↑ Đẩy về PC
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
              }}>
                {totalPending}
              </span>
            </button>
          ) : null}
          <button
            onClick={() => setIsSyncOpen(true)}
            style={{
              background: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sync
          </button>
        </div>
      </header>

      {/* Push status toast */}
      {pushStatus && (
        <div style={{
          padding: '10px 16px',
          background: pushStatus.startsWith('✅') ? '#10b98133' : pushStatus.startsWith('❌') ? '#ef444433' : `${theme.accent}33`,
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {pushStatus}
        </div>
      )}

      {/* Library Grid */}
      <main style={{ padding: '20px' }}>
        {(!workspaces || workspaces.length === 0) ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            opacity: 0.5,
          }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
            <p style={{ fontSize: '16px' }}>Chưa có truyện nào</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Bấm <strong>Sync</strong> để tải truyện từ PC
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {workspaces.map(ws => (
              <WorkspaceCard key={ws.id} workspace={ws} theme={theme} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function WorkspaceCard({ workspace, theme }: {
  workspace: { id: string; title: string; cover?: string };
  theme: { bg: string; text: string; accent: string; border: string };
}) {
  const progress = useLiveQuery(() => db.readingProgress.get(workspace.id), [workspace.id]);
  const syncMeta = useLiveQuery(() => db.syncMeta.get(`lastSync_${workspace.id}`), [workspace.id]);
  const pendingCorrections = useLiveQuery(() => db.corrections.where('workspaceId').equals(workspace.id).count(), [workspace.id]);

  const syncStatus = !syncMeta ? 'Not Synced' : (pendingCorrections && pendingCorrections > 0 ? 'Pending' : 'Synced');

  return (
    <a
      href={`/read/${workspace.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        textDecoration: 'none',
        color: theme.text,
        transition: 'transform 0.15s, box-shadow 0.15s',
        background: 'rgba(255,255,255,0.02)',
        position: 'relative',
      }}
    >
      {/* Sync Badge */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 1,
        padding: '4px 8px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: syncStatus === 'Synced' ? '#10b981' : (syncStatus === 'Pending' ? '#f59e0b' : 'rgba(0,0,0,0.5)'),
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        {syncStatus}
      </div>

      {/* Cover */}
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
      }}>
        {workspace.cover
          ? <img src={workspace.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '📖'
        }
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '3px',
        width: '100%',
        background: 'rgba(255,255,255,0.1)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress ? 50 : 0}%`, // Fake calc for now
          background: theme.accent,
        }} />
      </div>

      {/* Title */}
      <div style={{
        padding: '12px',
        fontSize: '13px',
        fontWeight: 700,
        lineHeight: 1.4,
      }}>
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          marginBottom: '4px',
        }}>
          {workspace.title}
        </div>
        {progress && (
          <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 600 }}>
            Đang đọc: Chương {progress.chapterId}
          </div>
        )}
      </div>
    </a>
  );
}
