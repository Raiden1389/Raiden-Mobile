export function EmptyState() {
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
        Bấm <strong>⋮ → Sync từ PC</strong> để tải truyện
      </p>
    </div>
  );
}
