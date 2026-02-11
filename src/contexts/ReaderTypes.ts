export type ThemeMode = 'dark' | 'sepia' | 'light';
export type FontFamily = 'Literata' | 'Lora' | 'Inter' | 'Noto Serif';

export interface ReaderSettings {
  theme: ThemeMode;
  fontFamily: FontFamily;
  fontSize: number;   // 14-28
  lineHeight: number;  // 1.4-2.2
  dimmerOpacity: number; // 0-0.7
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  fontFamily: 'Literata',
  fontSize: 18,
  lineHeight: 1.8,
  dimmerOpacity: 0,
};

export type ThemeColors = { bg: string; text: string; accent: string; border: string };

export const THEME_MAP: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: '#000000',
    text: '#D1D1D1',
    accent: '#8b5cf6',
    border: '#222222',
  },
  sepia: {
    bg: '#F4ECD8',
    text: '#5B4636',
    accent: '#A0522D',
    border: '#D4C5A9',
  },
  light: {
    bg: '#FAFAFA',
    text: '#333333',
    accent: '#6D28D9',
    border: '#E5E5E5',
  },
};
