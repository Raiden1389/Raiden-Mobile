import { useState, useCallback, useRef, useEffect } from 'react';
import { syncService } from '../lib/sync';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export interface WorkspaceInfo {
  id: string;
  title: string;
  chapterCount: number;
}

export type SyncStatus = 'scanning' | 'found' | 'syncing' | 'done' | 'not_found' | 'error';

export interface SyncState {
  status: SyncStatus;
  progress: { loaded: number; total: number };
  currentWs: string;
  error: string;
  serverInfo: { ip: string; port: number } | null;
  manifest: { workspaces: WorkspaceInfo[]; totalChapters: number } | null;
  syncResult: { workspaces: number; chapters: number } | null;
  selectedWs: Set<string>;
}

export interface SyncActions {
  discover: () => Promise<void>;
  startSync: () => Promise<void>;
  toggleWs: (wsId: string) => void;
  toggleAll: () => void;
  setSelectedWs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * useSync — All sync logic extracted from SyncDialog.
 * Handles: server discovery, workspace selection, download orchestration.
 */
export function useSync(onSuccess: () => void, onClose: () => void): SyncState & SyncActions {
  const [status, setStatus] = useState<SyncStatus>('scanning');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [currentWs, setCurrentWs] = useState('');
  const [error, setError] = useState('');
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);
  const [manifest, setManifest] = useState<{ workspaces: WorkspaceInfo[]; totalChapters: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ workspaces: number; chapters: number } | null>(null);
  const [selectedWs, setSelectedWs] = useState<Set<string>>(new Set());

  const savedConnection = useLiveQuery(() => db.syncMeta.get('lastSyncConnection'));

  // ── Server Discovery ──
  const discover = useCallback(async () => {
    setStatus('scanning');
    setError('');

    const hostname = window.location.hostname;
    const isHTTPS = window.location.protocol === 'https:';
    const isTunnel = hostname.includes('trycloudflare.com') || hostname.includes('ngrok') || isHTTPS;

    const urlsToTry: string[] = [];
    if (isTunnel) {
      urlsToTry.push(window.location.origin);
    } else {
      urlsToTry.push(`http://${hostname}:8888`);
    }

    const savedIp = savedConnection?.value ? JSON.parse(savedConnection.value).ip : null;
    if (savedIp) {
      const savedUrl = `http://${savedIp}:8888`;
      if (!urlsToTry.includes(savedUrl)) urlsToTry.push(savedUrl);
    }

    console.log('[Sync] Trying URLs:', urlsToTry);

    for (const baseUrl of urlsToTry) {
      try {
        const res = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.app !== 'raiden') continue;

        console.log(`[Sync] Found Desktop at ${baseUrl}`);

        const manifestRes = await fetch(`${baseUrl}/manifest`, { signal: AbortSignal.timeout(5000) });
        if (!manifestRes.ok) continue;
        const manifestData = await manifestRes.json();

        const displayIp = hostname;
        const displayPort = isTunnel ? 443 : 8888;
        setServerInfo({ ip: displayIp, port: displayPort });
        setManifest(manifestData);
        setSelectedWs(new Set(manifestData.workspaces.map((ws: WorkspaceInfo) => ws.id)));

        // Configure syncService
        syncService.parseQR(`raiden://sync?ip=${hostname}&port=${isTunnel ? '443' : '8888'}&token=lan`);
        if (isTunnel) {
          (syncService as unknown as Record<string, unknown>).config = { serverUrl: baseUrl, token: 'lan' };
        }

        setStatus('found');
        await db.syncMeta.put({
          key: 'lastSyncConnection',
          value: JSON.stringify({ ip: hostname, port: isTunnel ? 443 : 8888 }),
        });
        return;
      } catch (err) {
        console.log(`[Sync] Failed: ${baseUrl}`, err);
      }
    }

    setStatus('not_found');
  }, [savedConnection]);

  // ── Auto-discover on mount ──
  const didDiscover = useRef(false);
  useEffect(() => {
    if (didDiscover.current) return;
    didDiscover.current = true;
    discover();
  }, [discover]);

  // ── Sync (download selected workspaces) ──
  const startSync = useCallback(async () => {
    if (!manifest || selectedWs.size === 0) return;
    setStatus('syncing');

    try {
      const wsFilter = selectedWs.size < manifest.workspaces.length
        ? Array.from(selectedWs)
        : undefined;
      const result = await syncService.downloadLibrary((loaded, total, wsName) => {
        setProgress({ loaded, total });
        if (wsName) setCurrentWs(wsName);
      }, wsFilter);
      setSyncResult(result);
      setStatus('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [manifest, selectedWs, onSuccess, onClose]);

  // ── Workspace selection ──
  const toggleWs = useCallback((wsId: string) => {
    setSelectedWs(prev => {
      const next = new Set(prev);
      if (next.has(wsId)) next.delete(wsId);
      else next.add(wsId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!manifest) return;
    setSelectedWs(prev =>
      prev.size === manifest.workspaces.length
        ? new Set()
        : new Set(manifest.workspaces.map(ws => ws.id))
    );
  }, [manifest]);

  return {
    status, progress, currentWs, error,
    serverInfo, manifest, syncResult, selectedWs,
    discover, startSync, toggleWs, toggleAll, setSelectedWs,
  };
}
