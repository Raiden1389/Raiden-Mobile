import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useVersionCheck } from '../hooks/useVersionCheck';
import { PageTransition } from '../components/PageTransition';

const APP_VERSION = '1.7.0';
const BUILD_ID = '12/02 16h10';

export function LibraryPage() {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const isDark = isDarkTheme(theme.bg);
  const [hasUpdate, setHasUpdate] = useState(false);
  const isOnline = useOnlineStatus();
  useVersionCheck(true); // Auto-reload on Library when new build detected
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'chapters'>('recent');
  const [searchQuery, setSearchQuery] = useState(''); // #38
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // #40
  const [deleteMode, setDeleteMode] = useState(false); // #42
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set()); // #42
  const scrollRef = useRef<HTMLDivElement>(null); // #55

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
        {/* #55 — Scroll to top on header tap */}
        <div ref={scrollRef} style={{ position: 'absolute', top: 0 }} />
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
            <>
              {/* #38 Search + #40 View Toggle + #42 Delete controls */}
              <LibraryToolbar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                sortBy={sortBy}
                onSort={setSortBy}
                viewMode={viewMode}
                onViewMode={setViewMode}
                deleteMode={deleteMode}
                onDeleteMode={setDeleteMode}
                selectedCount={selectedForDelete.size}
                onDeleteSelected={() => {
                  if (selectedForDelete.size > 0 && confirm(`Xóa ${selectedForDelete.size} truyện? Điều này sẽ xóa toàn bộ dữ liệu của chúng.`)) {
                    import('../lib/db').then(({ db }) => {
                      selectedForDelete.forEach(id => {
                        db.chapters.where('workspaceId').equals(id).delete();
                        db.dictionary.where('workspaceId').equals(id).delete();
                        db.workspaces.delete(id);
                      });
                    });
                    setSelectedForDelete(new Set());
                    setDeleteMode(false);
                  }
                }}
                isDark={isDark}
                accent={theme.accent}
                workspaceCount={workspaces.length}
              />
              <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                ...(viewMode === 'grid'
                  ? { gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }
                  : { flexDirection: 'column' as const, gap: '8px' }
                ),
              }}>
                {sortWorkspaces(
                  workspaces.filter(ws => !searchQuery || ws.title.toLowerCase().includes(searchQuery.toLowerCase())),
                  sortBy,
                ).map(ws => (
                  <div key={ws.id}
                    {...(deleteMode ? {
                      onClick: (e: React.MouseEvent) => {
                        e.preventDefault();
                        setSelectedForDelete(prev => {
                          const next = new Set(prev);
                          if (next.has(ws.id)) { next.delete(ws.id); } else { next.add(ws.id); }
                          return next;
                        });
                      },
                    } : {})}
                    style={{
                      position: 'relative',
                      ...(deleteMode && selectedForDelete.has(ws.id) ? {
                        outline: `2px solid #ef4444`,
                        borderRadius: '16px',
                        outlineOffset: '2px',
                      } : {}),
                    }}
                  >
                    <WorkspaceCard
                      workspace={ws}
                      accent={theme.accent}
                      isDark={isDark}
                      textColor={theme.text}
                    />
                    {/* #42 — Delete checkbox overlay */}
                    {deleteMode && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: selectedForDelete.has(ws.id) ? '#ef4444' : 'rgba(0,0,0,0.4)',
                        border: '2px solid #fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: '#fff', fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        {selectedForDelete.has(ws.id) ? '✓' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
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
  for (const ws of workspaces) {
    const raw = localStorage.getItem(`raiden-lastChapter-${ws.id}`);
    if (raw) {
      if (!lastWs) lastWs = ws;
    }
  }
  if (!lastWs) return null;

  return (
    <div
      onClick={() => nav(`/read/${lastWs!.id}`)}
      style={{
        marginBottom: '12px',
        padding: '10px 14px',
        borderRadius: '12px',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18, ${accent}08)`
          : `linear-gradient(135deg, ${accent}12, ${accent}05)`,
        border: `1px solid ${accent}20`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '10px',
        transition: 'transform 0.15s ease',
      }}
    >
      <span style={{ fontSize: '20px' }}>📖</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.04em', opacity: 0.45, marginBottom: '1px',
        }}>
          Đọc tiếp
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {lastWs.title}
        </div>
      </div>
      <span style={{
        fontSize: '16px', opacity: 0.5,
      }}>▶</span>
    </div>
  );
}

/* ─── isDarkTheme helper ─── */
function isDarkTheme(bg: string): boolean {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/* ─── Sort ─── */
type SortOption = 'recent' | 'az' | 'chapters';

function sortWorkspaces(workspaces: Workspace[], sortBy: SortOption): Workspace[] {
  const sorted = [...workspaces];
  switch (sortBy) {
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'chapters':
      return sorted; // Already sorted by Dexie, can enhance later
    case 'recent':
    default:
      return sorted.sort((a, b) => {
        const aRaw = localStorage.getItem(`raiden-lastChapter-${a.id}`);
        const bRaw = localStorage.getItem(`raiden-lastChapter-${b.id}`);
        if (aRaw && !bRaw) return -1;
        if (!aRaw && bRaw) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }
}

/* ─── Library Toolbar (#38 search, #40 view, #42 delete, sort) ─── */
function LibraryToolbar({
  searchQuery, onSearch, sortBy, onSort, viewMode, onViewMode,
  deleteMode, onDeleteMode, selectedCount, onDeleteSelected,
  isDark, accent, workspaceCount,
}: {
  searchQuery: string; onSearch: (q: string) => void;
  sortBy: SortOption; onSort: (s: SortOption) => void;
  viewMode: 'grid' | 'list'; onViewMode: (v: 'grid' | 'list') => void;
  deleteMode: boolean; onDeleteMode: (v: boolean) => void;
  selectedCount: number; onDeleteSelected: () => void;
  isDark: boolean; accent: string;
  workspaceCount: number;
}) {
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const chipText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: '8px', border: 'none',
    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
    background: active ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : chipBg,
    color: active ? '#fff' : chipText,
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Search (#38) */}
      {workspaceCount > 5 && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="🔍 Tìm truyện..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: chipBg, color: 'inherit',
              fontSize: '13px', fontWeight: 600, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Sort + View + Delete row */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Sort chips */}
        {(['recent', 'az'] as SortOption[]).map(s => (
          <button key={s} onClick={() => onSort(s)} style={chipStyle(sortBy === s)}>
            {s === 'recent' ? '🕐 Gần đây' : '🔤 A-Z'}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* #40 View toggle */}
        <button
          onClick={() => onViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={{ ...chipStyle(false), fontSize: '14px', padding: '4px 8px' }}
          title={viewMode === 'grid' ? 'List view' : 'Grid view'}
        >
          {viewMode === 'grid' ? '☰' : '▦'}
        </button>

        {/* #42 Delete mode */}
        <button
          onClick={() => {
            if (deleteMode) { onDeleteMode(false); return; }
            onDeleteMode(true);
          }}
          style={{
            ...chipStyle(deleteMode), fontSize: '13px', padding: '4px 8px',
            ...(deleteMode ? { background: '#ef4444', color: '#fff' } : {}),
          }}
        >
          {deleteMode ? '✕' : '🗑'}
        </button>

        {/* Delete confirm */}
        {deleteMode && selectedCount > 0 && (
          <button onClick={onDeleteSelected} style={{
            padding: '5px 12px', borderRadius: '8px', border: 'none',
            background: '#ef4444', color: '#fff',
            fontSize: '11px', fontWeight: 800, cursor: 'pointer',
            animation: 'popIn 0.2s ease',
          }}>
            Xóa {selectedCount}
          </button>
        )}
      </div>
    </div>
  );
}
