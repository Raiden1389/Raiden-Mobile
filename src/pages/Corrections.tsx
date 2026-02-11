import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useReaderSettings } from '../contexts/ReaderContext';
import { THEME_MAP } from '../contexts/ReaderTypes';
import { db, type MobileCorrection } from '../lib/db';
import { PageTransition } from '../components/PageTransition';

type FilterStatus = 'all' | 'pending' | 'pushed';

export function CorrectionsPage() {
  const { settings } = useReaderSettings();
  const theme = THEME_MAP[settings.theme];
  const isDark = theme.bg === '#000000' || theme.bg === '#1a1a2e';
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterWorkspace, setFilterWorkspace] = useState<string>('all');

  const corrections = useLiveQuery(() => db.corrections.reverse().sortBy('appliedAt'));
  const workspaces = useLiveQuery(() => db.workspaces.toArray());

  // Build workspace map for display names
  const wsMap = useMemo(() => {
    const map = new Map<string, string>();
    workspaces?.forEach(ws => map.set(ws.id, ws.title));
    return map;
  }, [workspaces]);

  // Filter corrections
  const filtered = useMemo(() => {
    if (!corrections) return [];
    return corrections.filter(c => {
      if (filterStatus === 'pending' && c.syncedToPC) return false;
      if (filterStatus === 'pushed' && !c.syncedToPC) return false;
      if (filterWorkspace !== 'all' && c.workspaceId !== filterWorkspace) return false;
      return true;
    });
  }, [corrections, filterStatus, filterWorkspace]);

  const stats = useMemo(() => {
    if (!corrections) return { total: 0, pending: 0, pushed: 0 };
    return {
      total: corrections.length,
      pending: corrections.filter(c => !c.syncedToPC).length,
      pushed: corrections.filter(c => c.syncedToPC).length,
    };
  }, [corrections]);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('Xoá sửa lỗi này?')) {
      await db.corrections.delete(id);
    }
  }, []);

  return (
    <PageTransition>
      <div style={{
        minHeight: '100dvh',
        background: isDark
          ? 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
          : `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg}ee 100%)`,
        color: theme.text,
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      }}>
        {/* Header */}
        <header style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : theme.border}`,
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 10,
          background: isDark ? 'rgba(15,15,26,0.9)' : `${theme.bg}ee`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none',
              color: theme.accent, fontSize: '20px',
              cursor: 'pointer', padding: '4px',
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              📝 Lịch sử sửa lỗi
            </h1>
            <p style={{ fontSize: '11px', opacity: 0.5, margin: '2px 0 0' }}>
              {stats.total} tổng · {stats.pending} chờ gửi · {stats.pushed} đã gửi
            </p>
          </div>
        </header>

        {/* Filters */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', gap: '8px', overflowX: 'auto',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
        }}>
          {/* Status filter */}
          {(['all', 'pending', 'pushed'] as FilterStatus[]).map(status => {
            const labels = { all: 'Tất cả', pending: '⏳ Chờ gửi', pushed: '✅ Đã gửi' };
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '6px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  color: isActive ? '#fff' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  transition: 'all 0.2s ease',
                }}
              >
                {labels[status]}
              </button>
            );
          })}

          {/* Workspace filter */}
          {workspaces && workspaces.length > 1 && (
            <select
              value={filterWorkspace}
              onChange={e => setFilterWorkspace(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#e0e0e0' : '#333',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả truyện</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* List */}
        <div style={{ padding: '8px 16px 80px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontSize: '15px', fontWeight: 600, opacity: 0.5 }}>
                {corrections?.length === 0 ? 'Chưa có sửa lỗi nào' : 'Không có kết quả'}
              </p>
            </div>
          ) : (
            filtered.map(c => (
              <CorrectionItem
                key={c.id}
                correction={c}
                workspaceTitle={wsMap.get(c.workspaceId) ?? 'Không rõ'}
                isDark={isDark}
                accent={theme.accent}
                onDelete={() => c.id && handleDelete(c.id)}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function CorrectionItem({ correction, workspaceTitle, isDark, accent, onDelete }: {
  correction: MobileCorrection;
  workspaceTitle: string;
  isDark: boolean;
  accent: string;
  onDelete: () => void;
}) {
  const c = correction;
  const timeAgo = getTimeAgo(c.appliedAt);

  return (
    <div style={{
      padding: '14px 16px',
      marginBottom: '8px',
      borderRadius: '14px',
      background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700,
            padding: '2px 8px', borderRadius: '8px',
            background: c.syncedToPC
              ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: c.syncedToPC
              ? '#10b981' : '#f59e0b',
          }}>
            {c.syncedToPC ? '✅ Đã gửi' : '⏳ Chờ'}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600,
            padding: '2px 8px', borderRadius: '8px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          }}>
            {c.scope === 'all' ? '📄 Tất cả' : `Ch.${c.fromChapterOrder}`}
          </span>
        </div>
        <button
          onClick={onDelete}
          style={{
            background: 'none', border: 'none',
            color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
            fontSize: '14px', cursor: 'pointer', padding: '4px',
          }}
        >
          🗑
        </button>
      </div>

      {/* Old → New */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{
          fontSize: '13px', fontWeight: 600,
          padding: '4px 10px', borderRadius: '8px',
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          textDecoration: 'line-through',
          maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.oldText}
        </span>
        <span style={{ fontSize: '12px', opacity: 0.4 }}>→</span>
        <span style={{
          fontSize: '13px', fontWeight: 700,
          padding: '4px 10px', borderRadius: '8px',
          background: `${accent}15`,
          color: accent,
          maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.newText}
        </span>
      </div>

      {/* Footer */}
      <div style={{
        fontSize: '10px', opacity: 0.35, fontWeight: 500,
        display: 'flex', gap: '8px',
      }}>
        <span>📚 {workspaceTitle}</span>
        <span>· {timeAgo}</span>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}
