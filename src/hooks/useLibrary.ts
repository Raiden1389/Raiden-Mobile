import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncService } from '../lib/sync';

export function useLibrary() {
  const workspaces = useLiveQuery(() => db.workspaces.toArray());
  const totalPending = useLiveQuery(() => db.corrections.filter(c => !c.syncedToPC).count()) ?? 0;
  const totalChapters = useLiveQuery(() => db.chapters.count()) ?? 0;

  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  const handlePushBack = useCallback(async () => {
    if (!workspaces?.length || isPushing) return;

    try {
      setIsPushing(true);
      setPushStatus('Đang kết nối...');
      const connected = await syncService.checkConnection();
      if (!connected) {
        setPushStatus('❌ Không kết nối được. Mở Sync trên PC trước!');
        setTimeout(() => setPushStatus(null), 3000);
        return;
      }

      let totalPushed = 0;
      for (const ws of workspaces) {
        const count = await syncService.pushCorrections(ws.id);
        totalPushed += count;
      }

      setPushStatus(`✅ Đã đẩy ${totalPushed} sửa đổi về PC!`);
      setTimeout(() => setPushStatus(null), 3000);
    } catch (err) {
      setPushStatus(`❌ ${err instanceof Error ? err.message : 'Lỗi'}`);
      setTimeout(() => setPushStatus(null), 3000);
    } finally {
      setIsPushing(false);
    }
  }, [workspaces, isPushing]);

  const openSync = useCallback(() => setIsSyncOpen(true), []);
  const closeSync = useCallback(() => setIsSyncOpen(false), []);

  return {
    workspaces,
    totalPending,
    totalChapters,
    isSyncOpen,
    openSync,
    closeSync,
    pushStatus,
    isPushing,
    handlePushBack,
  };
}
