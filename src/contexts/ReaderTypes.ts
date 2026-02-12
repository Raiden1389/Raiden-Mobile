export type ThemeMode = 'dark' | 'sepia' | 'light' | 'forest' | 'slate';
export type FontFamily = 'Literata' | 'Lora' | 'Inter' | 'Noto Serif' | 'Source Serif 4' | 'Merriweather';
export type ReadingMode = 'scroll' | 'paginated'; // #31

export interface ReaderSettings {
  theme: ThemeMode;
  fontFamily: FontFamily;
  fontSize: number;   // 14-28
  lineHeight: number;  // 1.4-2.2
  dimmerOpacity: number; // 0-0.7
  paragraphSpacing: number; // 0.5-2.5 em
  textAlign: 'justify' | 'left';
  nightLightIntensity: number; // 0-0.5 amber filter
  readingMode: ReadingMode; // #31 scroll vs page-turn
  margins: number; // #43 horizontal padding 8-48px
  maxWidth: number; // #44 max content width 400-1200px (0=unlimited)
  showDropCap: boolean; // #45 toggle drop cap
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  fontFamily: 'Literata',
  fontSize: 18,
  lineHeight: 1.8,
  dimmerOpacity: 0,
  paragraphSpacing: 1.0,
  textAlign: 'justify',
  nightLightIntensity: 0,
  readingMode: 'scroll',
  margins: 20,
  maxWidth: 0,
  showDropCap: true,
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
  forest: {
    bg: '#1A2A1A',
    text: '#C8D8C0',
    accent: '#4ADE80',
    border: '#2D3D2D',
  },
  slate: {
    bg: '#1E2A3A',
    text: '#B8C8D8',
    accent: '#60A5FA',
    border: '#2D3D4D',
  },
};
