import { db } from './db';

/**
 * Apply a text correction across chapters
 * Pure logic — no React imports
 */
export async function applyCorrection(
  workspaceId: string,
  oldText: string,
  newText: string,
  scope: 'chapter' | 'all',
  fromChapterOrder: number
): Promise<number> {
  let modifiedCount = 0;

  // Determine which chapters to modify
  const chapters = scope === 'all'
    ? await db.chapters
      .where('[workspaceId+order]')
      .between([workspaceId, fromChapterOrder], [workspaceId, Infinity])
      .toArray()
    : await db.chapters
      .where({ workspaceId, order: fromChapterOrder })
      .toArray();

  // Apply replaceAll to each matching chapter
  for (const chapter of chapters) {
    if (chapter.content_translated?.includes(oldText)) {
      await db.chapters.update(chapter.id, {
        content_translated: chapter.content_translated.replaceAll(oldText, newText),
        isDirty: true,
      });
      modifiedCount++;
    }
  }

  // Save correction to queue for sync-back
  await db.corrections.add({
    workspaceId,
    oldText,
    newText,
    scope,
    fromChapterOrder,
    appliedAt: new Date(),
    syncedToPC: false,
  });

  return modifiedCount;
}

/**
 * Count pending corrections not yet synced to PC
 */
export async function getPendingCorrectionsCount(workspaceId: string): Promise<number> {
  return db.corrections
    .where({ workspaceId, syncedToPC: false })
    .count();
}
