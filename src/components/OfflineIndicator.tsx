import { useState, useEffect } from 'react';

/**
 * OfflineIndicator — Shows banner when device goes offline
 * Self-contained, no props needed. ~30 lines.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 700,
      textAlign: 'center',
      zIndex: 500,
      animation: 'slideDown 0.3s ease',
    }}>
      📴 Không có mạng — đọc offline
    </div>
  );
}
