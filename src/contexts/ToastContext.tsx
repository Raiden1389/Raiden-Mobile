import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => { } });

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const colors = {
    success: { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
    error: { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
    info: { bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
        pointerEvents: 'none', width: 'max-content', maxWidth: '90vw',
      }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              padding: '10px 20px', borderRadius: '12px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(12px)',
              color: c.text,
              fontSize: '13px', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'toastIn 0.3s ease',
              pointerEvents: 'auto',
            }}>
              {t.message}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
