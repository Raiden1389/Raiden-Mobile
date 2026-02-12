/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  type ThemeMode,
  type FontFamily,
  type ReadingMode,
  type ReaderSettings,
  DEFAULT_SETTINGS,
  THEME_MAP,
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
  // Sync Android status bar color with theme
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_MAP[settings.theme].bg);
}

interface ReaderContextValue {
  settings: ReaderSettings;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setDimmerOpacity: (opacity: number) => void;
  setParagraphSpacing: (spacing: number) => void;
  setTextAlign: (align: 'justify' | 'left') => void;
  setNightLightIntensity: (intensity: number) => void;
  setReadingMode: (mode: ReadingMode) => void; // #31
  setMargins: (px: number) => void; // #43
  setMaxWidth: (px: number) => void; // #44
  setShowDropCap: (show: boolean) => void; // #45
  resetSettings: () => void; // #46
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);

  // Sync status bar color on mount
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_MAP[settings.theme].bg);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setSettings(prev => {
      const order: ThemeMode[] = ['dark', 'forest', 'slate', 'sepia', 'light'];
      const idx = order.indexOf(prev.theme);
      const next = { ...prev, theme: order[(idx + 1) % order.length] };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
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
      setParagraphSpacing: (paragraphSpacing) => update({ paragraphSpacing }),
      setTextAlign: (textAlign) => update({ textAlign }),
      setNightLightIntensity: (nightLightIntensity) => update({ nightLightIntensity }),
      setReadingMode: (readingMode) => update({ readingMode }),
      setMargins: (margins) => update({ margins }),
      setMaxWidth: (maxWidth) => update({ maxWidth }),
      setShowDropCap: (showDropCap) => update({ showDropCap }),
      resetSettings,
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
