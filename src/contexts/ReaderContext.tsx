/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  type ThemeMode,
  type FontFamily,
  type ReaderSettings,
  DEFAULT_SETTINGS,
} from './ReaderTypes';

// ===================================================
// READER SETTINGS CONTEXT
// ===================================================


const STORAGE_KEY = 'raiden-reader-settings';

function loadSettings(): ReaderSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: ReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface ReaderContextValue {
  settings: ReaderSettings;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setDimmerOpacity: (opacity: number) => void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);

  const update = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setSettings(prev => {
      const order: ThemeMode[] = ['dark', 'sepia', 'light'];
      const idx = order.indexOf(prev.theme);
      const next = { ...prev, theme: order[(idx + 1) % 3] };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <ReaderContext.Provider value={{
      settings,
      setTheme: (theme) => update({ theme }),
      cycleTheme,
      setFontFamily: (fontFamily) => update({ fontFamily }),
      setFontSize: (fontSize) => update({ fontSize }),
      setLineHeight: (lineHeight) => update({ lineHeight }),
      setDimmerOpacity: (dimmerOpacity) => update({ dimmerOpacity }),
    }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReaderSettings() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReaderSettings must be inside ReaderProvider');
  return ctx;
}
