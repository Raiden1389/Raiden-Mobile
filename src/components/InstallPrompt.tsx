import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallPrompt — Shows "Add to Home Screen" banner
 * Catches beforeinstallprompt event, with 7-day cooldown.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissed) {
      const daysAgo = (Date.now() - Number(lastDismissed)) / (1000 * 60 * 60 * 24);
      return daysAgo < 7;
    }
    return false;
  });

  useEffect(() => {
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setDismissed(true);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(124,58,237,0.95))',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 400,
      animation: 'slideUp 0.3s ease',
    }}>
      <span style={{ fontSize: '13px', fontWeight: 600 }}>
        📲 Thêm Raiden Reader vào Home Screen
      </span>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '6px 12px', fontSize: '11px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Để sau
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: '#fff',
            color: '#7c3aed', border: 'none', borderRadius: '8px',
            padding: '6px 14px', fontSize: '11px', fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Cài đặt
        </button>
      </div>
    </div>
  );
}
