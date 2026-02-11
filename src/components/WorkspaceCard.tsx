import { useCallback, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

interface WorkspaceCardProps {
  workspace: { id: string; title: string; cover?: string };
  accent: string;
  isDark: boolean;
  textColor: string;
}

/**
 * Generate a unique geometric SVG pattern from a string seed.
 * Returns an inline SVG data URI for use as CSS background.
 */
function generateCoverPattern(title: string, hue: number, isDark: boolean): string {
  const seed = title.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const shapes: string[] = [];
  const sat = isDark ? 35 : 50;
  const baseL = isDark ? 25 : 75;

  for (let i = 0; i < 12; i++) {
    const x = ((seed * (i + 7)) % 180);
    const y = ((seed * (i + 3)) % 240);
    const size = 20 + ((seed * (i + 1)) % 40);
    const h = (hue + i * 30) % 360;
    const l = baseL + ((seed * i) % 15) - 7;
    const opacity = 0.15 + ((seed * (i + 2)) % 20) / 100;
    const type = (seed + i) % 3;

    if (type === 0) {
      shapes.push(`<circle cx="${x}" cy="${y}" r="${size / 2}" fill="hsl(${h},${sat}%,${l}%)" opacity="${opacity}"/>`);
    } else if (type === 1) {
      shapes.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="hsl(${h},${sat}%,${l}%)" opacity="${opacity}" transform="rotate(${(seed * i) % 45},${x + size / 2},${y + size / 2})"/>`);
    } else {
      const pts = `${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}`;
      shapes.push(`<polygon points="${pts}" fill="hsl(${h},${sat}%,${l}%)" opacity="${opacity}"/>`);
    }
  }

  // Decorative lines
  for (let i = 0; i < 4; i++) {
    const x1 = (seed * (i + 5)) % 180;
    const y1 = (seed * (i + 2)) % 240;
    const x2 = (seed * (i + 8)) % 180;
    const y2 = (seed * (i + 4)) % 240;
    const h = (hue + i * 60) % 360;
    shapes.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="hsl(${h},${sat}%,${baseL}%)" stroke-width="1.5" opacity="0.12"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="240" viewBox="0 0 180 240">${shapes.join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function WorkspaceCard({ workspace, accent, isDark, textColor }: WorkspaceCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleDelete = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Xoá "${workspace.title}"?\nSẽ xoá cả chương và dữ liệu đọc.`)) return;

    await db.transaction('rw', [db.workspaces, db.chapters, db.corrections, db.readingProgress, db.dictionary], async () => {
      await db.chapters.where('workspaceId').equals(workspace.id).delete();
      await db.corrections.where('workspaceId').equals(workspace.id).delete();
      await db.dictionary.where('workspaceId').equals(workspace.id).delete();
      await db.readingProgress.delete(workspace.id);
      await db.workspaces.delete(workspace.id);
    });
    setShowDelete(false);
  }, [workspace.id, workspace.title]);

  // Long-press to reveal delete
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowDelete(true);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const progress = useLiveQuery(
    () => db.readingProgress.get(workspace.id),
    [workspace.id]
  );
  const chapters = useLiveQuery(
    () => db.chapters.where('workspaceId').equals(workspace.id).sortBy('order'),
    [workspace.id]
  );

  const chapterCount = chapters?.length ?? 0;
  const readingIndex = (() => {
    if (!progress?.chapterId || !chapters?.length) return 0;
    const pid = Number(progress.chapterId);
    return chapters.filter(c => Number(c.order) <= pid).length;
  })();
  const progressPct = chapterCount > 0 && readingIndex > 0
    ? Math.round((readingIndex / chapterCount) * 100)
    : 0;

  const hue = workspace.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const coverBg = isDark
    ? `linear-gradient(160deg, hsl(${hue}, 30%, 18%) 0%, hsl(${hue + 40}, 22%, 10%) 100%)`
    : `linear-gradient(160deg, hsl(${hue}, 40%, 88%) 0%, hsl(${hue + 40}, 35%, 80%) 100%)`;
  const patternBg = generateCoverPattern(workspace.title, hue, isDark);

  return (
    <a
      href={`/read/${workspace.id}`}
      onTouchStart={() => { setIsPressed(true); handleTouchStart(); }}
      onTouchEnd={() => { setIsPressed(false); handleTouchEnd(); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setShowDelete(false); }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        textDecoration: 'none',
        color: textColor,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isPressed
          ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)')
          : (isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)'),
      }}
    >
      {/* Book Cover */}
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        background: workspace.cover ? undefined : coverBg,
        backgroundImage: workspace.cover ? undefined : patternBg,
        backgroundSize: 'cover',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {workspace.cover && (
          <img src={workspace.cover} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
          }} />
        )}

        {/* Spine — left edge */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
          background: isDark
            ? `linear-gradient(180deg, hsl(${hue},40%,40%) 0%, hsl(${hue},30%,15%) 100%)`
            : `linear-gradient(180deg, hsl(${hue},50%,65%) 0%, hsl(${hue},40%,50%) 100%)`,
        }} />

        {/* Bottom gradient for title legibility */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
        }} />

        {/* Title overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 12px 12px',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 800,
            lineHeight: 1.35,
            color: '#fff',
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {workspace.title}
          </div>
        </div>

        {/* Delete button — only shows on long-press */}
        {showDelete && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '32px', height: '32px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(220,38,38,0.85)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
              animation: 'popIn 0.15s ease',
            }}
          >
            🗑
          </button>
        )}
      </div>

      {/* Info strip */}
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px',
        position: 'relative',
      }}>
        {/* Progress bar — thin top line */}
        {progressPct > 0 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              borderRadius: '0 1px 1px 0',
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        {/* Chapter count */}
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
        }}>
          {chapterCount} chương
        </span>

        {/* Reading progress */}
        {readingIndex > 0 && (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: accent,
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <span style={{ fontSize: '10px' }}>📖</span>
            {readingIndex}/{chapterCount}
          </span>
        )}
      </div>

      <style>{`
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </a>
  );
}
