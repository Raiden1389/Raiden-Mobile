export function PushStatusBar({ status, accent }: { status: string | null; accent: string }) {
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
