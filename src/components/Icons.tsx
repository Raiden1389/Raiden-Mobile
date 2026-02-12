import React from 'react';

// ===================================================
// SVG Icon Set — Stroke-based, currentColor, consistent
// Inspired by Apple Books / Notion / Linear
// ===================================================

interface IconProps {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

/** ‹ Back chevron */
export function IconBack({ size = 18, strokeWidth = 2, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/** ≡ TOC / hamburger lines */
export function IconToc({ size = 18, strokeWidth = 2, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" style={style}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="17" y2="18" />
    </svg>
  );
}

/** Aa Typography / Settings */
export function IconTypography({ size = 18, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <text x="2" y="18" fontFamily="serif" fontSize="16" fontWeight="700">A</text>
      <text x="14" y="18" fontFamily="serif" fontSize="11" fontWeight="500">a</text>
    </svg>
  );
}

/** ▶ Play / auto-scroll start */
export function IconPlay({ size = 16, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}

/** ⏸ Pause / auto-scroll stop */
export function IconPause({ size = 16, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <rect x="5" y="4" width="4" height="16" rx="1" />
      <rect x="15" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

/** ⛶ Expand fullscreen */
export function IconExpand({ size = 16, strokeWidth = 2, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/** ⛶ Collapse fullscreen */
export function IconCollapse({ size = 16, strokeWidth = 2, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/** ● Theme color dot */
export function ThemeDot({ color, size = 14, active = false, style }: { color: string; size?: number; active?: boolean; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style}>
      <circle cx="8" cy="8" r="6" fill={color}
        stroke={active ? '#fff' : 'none'} strokeWidth={active ? 1.5 : 0} />
      {active && <circle cx="8" cy="8" r="7.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />}
    </svg>
  );
}
