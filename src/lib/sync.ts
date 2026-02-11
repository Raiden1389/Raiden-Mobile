import { db, type Workspace, type Chapter, type DictionaryEntry } from './db';

// ===================================================
// SYNC SERVICE — Handles LAN communication with Desktop
// ===================================================

interface SyncManifest {
  workspaces: { id: string; title: string; updatedAt: string }[];
  totalChapters: number;
}

interface SyncConfig {
  serverUrl: string; // e.g. "http://192.168.1.5:8888"
  token: string;
}

export class SyncService {
  private config: SyncConfig | null = null;

  /**
   * Parse QR code data into SyncConfig
   * Expected format: raiden://sync?ip=192.168.1.5&port=8888&token=ABC123
   */
  parseQR(qrData: string): SyncConfig {
    const url = new URL(qrData.replace('raiden://', 'http://'));
    const ip = url.searchParams.get('ip') || url.hostname;
    const port = url.searchParams.get('port') || '8888';
    const token = url.searchParams.get('token') || '';

    this.config = {
      serverUrl: `http://${ip}:${port}`,
      token,
    };
    return this.config;
  }

  /**
   * Check if Desktop server is reachable
   */
  async checkConnection(): Promise<boolean> {
    if (!this.config) return false;
    try {
      const res = await fetch(`${this.config.serverUrl}/status`, {
        headers: { 'Authorization': `Bearer ${this.config.token}` },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Download chapters from Desktop (chunked pagination)
   * @param onProgress callback with (loaded, total)
   */
  async downloadWorkspace(
    workspaceId: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.config) throw new Error('Not connected. Scan QR first.');

    const baseUrl = this.config.serverUrl;
    const headers = { 'Authorization': `Bearer ${this.config.token}` };

    // 1. Get manifest
    const manifestRes = await fetch(`${baseUrl}/manifest?workspaceId=${workspaceId}`, { headers });
    const manifest: SyncManifest = await manifestRes.json();
    const total = manifest.totalChapters;

    // 2. Download workspace metadata
    const wsRes = await fetch(`${baseUrl}/workspace?id=${workspaceId}`, { headers });
    const wsData = await wsRes.json();
    // Ensure workspace has 'id' field (Desktop metadata.json may not include it)
    const workspace: Workspace = { ...wsData, id: wsData.id || workspaceId };
    await db.workspaces.put(workspace);

    // 3. Download dictionary
    const dictRes = await fetch(`${baseUrl}/dictionary?workspaceId=${workspaceId}`, { headers });
    const rawDict = await dictRes.json();
    await db.dictionary.where('workspaceId').equals(workspaceId).delete();
    if (rawDict.length > 0) {
      // Strip 'id' so Dexie auto-generates new IDs (++id schema)
      const dictionary: DictionaryEntry[] = rawDict.map((d: Record<string, unknown>) => ({
        workspaceId: (d.workspaceId as string) || workspaceId,
        original: d.original as string,
        translated: d.translated as string,
        type: (d.type as string) || 'term',
      }));
      await db.dictionary.bulkAdd(dictionary);
    }

    // 4. Download chapters in chunks of 50
    const CHUNK_SIZE = 50;
    let offset = 0;

    // Clear existing chapters for this workspace before re-downloading
    await db.chapters.where('workspaceId').equals(workspaceId).delete();

    while (offset < total) {
      const chunkRes = await fetch(
        `${baseUrl}/chapters?workspaceId=${workspaceId}&offset=${offset}&limit=${CHUNK_SIZE}`,
        { headers }
      );
      const rawChapters = await chunkRes.json();
      // Strip 'id' so Dexie auto-generates new IDs (++id schema)
      const chapters: Chapter[] = rawChapters.map((c: Record<string, unknown>) => ({
        workspaceId: (c.workspaceId as string) || workspaceId,
        title: c.title as string,
        content_original: c.content_original as string,
        content_translated: c.content_translated as string | undefined,
        title_translated: c.title_translated as string | undefined,
        order: c.order as number,
        status: (c.status as string) || 'draft',
        updatedAt: c.updatedAt ? new Date(c.updatedAt as string) : new Date(),
      }));
      await db.chapters.bulkAdd(chapters);

      offset += chapters.length;
      onProgress?.(Math.min(offset, total), total);

      // Safety: if server returns 0 chapters, break
      if (chapters.length === 0) break;
    }

    // 5. Update sync timestamp
    await db.syncMeta.put({
      key: `lastSync_${workspaceId}`,
      value: new Date().toISOString(),
    });
  }

  /**
   * Push corrections back to Desktop
   */
  async pushCorrections(workspaceId: string): Promise<number> {
    if (!this.config) throw new Error('Not connected.');

    // Get all unsynced corrections
    const corrections = await db.corrections
      .where('workspaceId').equals(workspaceId)
      .and(c => !c.syncedToPC)
      .toArray();

    if (corrections.length === 0) return 0;

    // Get dirty chapters
    const dirtyChapters = await db.chapters
      .where('workspaceId').equals(workspaceId)
      .and(c => c.isDirty === true)
      .toArray();

    const res = await fetch(`${this.config.serverUrl}/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        corrections,
        chapters: dirtyChapters,
      }),
    });

    if (!res.ok) throw new Error(`Push failed: ${res.status}`);

    // Mark as synced
    await db.corrections
      .where('workspaceId').equals(workspaceId)
      .modify({ syncedToPC: true });

    await db.chapters
      .where('workspaceId').equals(workspaceId)
      .and(c => c.isDirty === true)
      .modify({ isDirty: false });

    return corrections.length;
  }
}

export const syncService = new SyncService();
