import Dexie, { type EntityTable } from 'dexie';

// ===================================================
// SHARED TYPES (mirrored from Desktop ai-translator)
// ===================================================

export interface Workspace {
  id: string;
  title: string;
  author?: string;
  cover?: string;
  description?: string;
  genre?: string;
  sourceLang?: string;
  targetLang?: string;
  lastReadChapterId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: number;
  workspaceId: string;
  title: string;
  content_original: string;
  content_translated?: string;
  title_translated?: string;
  order: number;
  status: 'draft' | 'translated' | 'reviewing';
  updatedAt?: Date;
  // Mobile-specific
  isDirty?: boolean; // true = edited on mobile, needs sync back
}

export interface DictionaryEntry {
  id?: number;
  workspaceId: string;
  original: string;
  translated: string;
  type: 'name' | 'character' | 'term' | 'phrase' | 'correction' | string;
}

export interface ReadingProgress {
  workspaceId: string; // PK
  chapterId: number;
  scrollPercent: number;
  paragraphIndex: number;
  updatedAt: Date;
}

export interface SyncMeta {
  key: string; // PK — e.g. "lastSyncAt"
  value: string;
}

export interface MobileCorrection {
  id?: number;
  workspaceId: string;
  oldText: string;
  newText: string;
  scope: 'chapter' | 'all'; // Chỉ chương này hay tất cả
  fromChapterOrder: number;
  appliedAt: Date;
  syncedToPC: boolean;
}

// ===================================================
// DATABASE
// ===================================================

const db = new Dexie('RaidenMobileDB') as Dexie & {
  workspaces: EntityTable<Workspace, 'id'>;
  chapters: EntityTable<Chapter, 'id'>;
  dictionary: EntityTable<DictionaryEntry, 'id'>;
  readingProgress: EntityTable<ReadingProgress, 'workspaceId'>;
  syncMeta: EntityTable<SyncMeta, 'key'>;
  corrections: EntityTable<MobileCorrection, 'id'>;
};

db.version(1).stores({
  workspaces: 'id, title, updatedAt',
  chapters: '++id, workspaceId, order, [workspaceId+order]',
  dictionary: '++id, workspaceId, original, [workspaceId+original]',
  readingProgress: 'workspaceId',
  syncMeta: 'key',
  corrections: '++id, workspaceId, syncedToPC',
});

export { db };
