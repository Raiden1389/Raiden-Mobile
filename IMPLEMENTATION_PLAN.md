# 🦅 RAIDEN MOBILE COMPANION — IMPLEMENTATION PLAN
## Bản Thi Công Chi Tiết v2 (Hook + Component Architecture)

> **Dự án**: `c:\Users\Admin\.gemini\antigravity\scratch\raiden-mobile`
> **Spec gốc**: `ai-translator/docs/mobile/SPEC.md`
> **Phê duyệt**: Tông chủ — 2026-02-11
> **Tổng Phase**: 5 (Phase 0-2 hoàn tất)

---

## ✅ PHASE 0: SKELETON (HOÀN TẤT)
- [x] Vite + React + SWC + TypeScript
- [x] Dexie + React Router DOM
- [x] DB Schema, SyncService, ReaderContext
- [x] Library + Reader page skeleton

---

## ✅ PHASE 1: SYNC + LIBRARY (HOÀN TẤT)
- [x] Rust sync server (tiny_http, in-memory data from Dexie)
- [x] SyncMobileButton (Desktop) — QR code + copy link
- [x] SyncDialog (Mobile) — URL paste, connection check, chunked download
- [x] Library page — workspace cards, sync badge, chapter count
- [x] Only sync translated chapters filter

**Kiến trúc thực tế** (khác spec gốc):
```
Desktop Dexie → JS serialize → Rust (memory) → HTTP → Mobile Dexie
```

---

## ✅ PHASE 2: READER CORE (HOÀN TẤT)

### Cấu trúc đã implement:
```
pages/Reader.tsx              ← ~160 lines orchestrator

hooks/
  useInfiniteScroll.ts        ← scroll loading + chapter tracking
  useNavbar.ts                ← auto-hide, tap toggle, 4s timeout
  useReadingPosition.ts       ← dual save (localStorage + IndexedDB)
  useSwipeBack.ts             ← edge-swipe gesture back

components/
  ReaderParts.tsx             ← ChapterBlock, ChapterDivider, ProgressBar,
                                 ReaderNavbar, SwipeBackIndicator, EndMarker
  SettingsPanel.tsx           ← Bottom sheet (theme/font/size/line-height/dimmer)
```

### Checklist:
- [x] Infinite scroll (IntersectionObserver)
- [x] Smart Navbar (auto-hide on scroll, glassmorphism)
- [x] Settings Panel (theme/font/size/line-height/dimmer)
- [x] Progress Bar (2px top, gradient glow)
- [x] Chapter Dividers (gradient line + title)
- [x] Reading Position save (localStorage sync + IndexedDB async)
- [x] Swipe-back gesture (left edge)
- [x] Haptic feedback on chapter change
- [x] Refactored: hook + component architecture

---

## ✏️ PHASE 3: QUICK EDIT (Cải chính)
**Mục tiêu**: Bôi đen text → sửa → replaceAll → sync về PC.

### File Architecture (Hook + Component):

```
hooks/
  useTextSelection.ts         ← Selection tracking (selectionchange event)
  useDimmer.ts                ← Left-edge swipe brightness control

components/
  SelectionBubble.tsx         ← Floating bubble above selection (✏️ Sửa, 📋 Copy)
  EditDialog.tsx              ← Full-screen modal (old text → new text, scope radio)

lib/
  corrections.ts              ← applyCorrection(), getPendingCorrections()
```

### Bước 3.1: `useTextSelection` hook
**File**: `src/hooks/useTextSelection.ts`
- Lắng nghe `selectionchange`
- Return `{ selectedText, selectionRect, clearSelection }`
- Debounce 200ms
- **KHÔNG** chứa UI logic

### Bước 3.2: `SelectionBubble` component
**File**: `src/components/SelectionBubble.tsx`
- Props: `selectedText`, `rect`, `onEdit`, `onCopy`
- Positioned above selection (absolute, top = rect.top - height - 8)
- Scale animation 0.8 → 1.0
- Auto-dismiss on outside tap
- **~50 lines max**

### Bước 3.3: `EditDialog` component
**File**: `src/components/EditDialog.tsx`
- Props: `oldText`, `onSave(newText, scope)`, `onCancel`
- Readonly textarea (old text, highlight bg)
- Input textarea (auto-focus)
- Radio: `○ Chỉ chương này` / `● Tất cả từ đây trở đi`
- Nút Lưu + Hủy
- Full-screen modal + backdrop blur
- **~80 lines max**

### Bước 3.4: `corrections.ts` lib
**File**: `src/lib/corrections.ts`
- `applyCorrection(workspaceId, oldText, newText, scope, fromOrder)`:
  - Query chapters by scope
  - `query.modify()` → replaceAll + set `isDirty: true`
  - Save to `db.corrections` queue
- `getPendingCorrections(workspaceId)` → count unsynced
- **Pure logic, KHÔNG có React imports**

### Bước 3.5: `useDimmer` hook
**File**: `src/hooks/useDimmer.ts`
- Track touch on left edge (x < 30px at touchstart)
- Vertical swipe → adjust dimmerOpacity
- Call `setDimmerOpacity()` from ReaderContext
- Show 🔆 indicator while adjusting
- **KHÔNG** modify DOM directly

### Bước 3.6: Sync Back (Mobile → PC)
**Desktop**: `sync_server.rs` — thêm `POST /update` endpoint
**Mobile**: `Library.tsx` — nút "Đẩy về PC" (khi có pending corrections)

### Bước 3.7: Wire vào Reader
**File**: `pages/Reader.tsx` — CHỈ thêm imports + compose:
```tsx
// Thêm hooks
const { selectedText, selectionRect, clearSelection } = useTextSelection();
useDimmer(scrollContainerRef);

// Thêm components vào render
<SelectionBubble ... />
<EditDialog ... />
```

### Kiểm tra Phase 3:
- [ ] Bôi đen text → bubble hiện đúng vị trí
- [ ] Edit dialog: old text readonly, input auto-focus
- [ ] Bấm Save → text thay đổi ngay, giữ scroll position
- [ ] "Tất cả chương" → text đổi ở các chương sau
- [ ] Sync back về PC → data cập nhật
- [ ] Dimmer: vuốt cạnh trái thay đổi độ tối
- [ ] Reader.tsx vẫn < 200 dòng

---

## 📲 PHASE 4: PWA + OFFLINE

### File Architecture:

```
components/
  OfflineIndicator.tsx        ← Banner "📴 Offline" (online/offline event)
  InstallPrompt.tsx           ← "📲 Thêm vào Home Screen" banner

public/
  manifest.json               ← PWA manifest
  icon-192.png                ← App icon
  icon-512.png                ← App icon large
```

### Bước 4.1: PWA Manifest
**File**: `public/manifest.json`
```json
{
  "name": "Raiden Reader",
  "short_name": "Raiden",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#8b5cf6"
}
```

### Bước 4.2: Service Worker (vite-plugin-pwa)
**File**: `vite.config.ts` — thêm VitePWA plugin
- `registerType: 'autoUpdate'`
- Cache static assets only (IndexedDB data tự persistent)

### Bước 4.3: App Icons
- Dùng `generate_image` tool tạo icon 512x512
- Resize 192x192
- Đặt vào `public/`

### Bước 4.4: `OfflineIndicator` component
**File**: `src/components/OfflineIndicator.tsx`
- Props: none (self-contained)
- Listen `online`/`offline` window events
- Show/hide banner with fade animation
- **~30 lines max**

### Bước 4.5: `InstallPrompt` component
**File**: `src/components/InstallPrompt.tsx`
- Catch `beforeinstallprompt` event
- Banner ở đáy: "📲 Thêm vào Home Screen"
- "Cài đặt" button → `prompt.prompt()`
- "Để sau" → dismiss, localStorage 7 ngày cooldown
- **~50 lines max**

### Kiểm tra Phase 4:
- [ ] Chrome Android: "Add to Home Screen" prompt
- [ ] Installed: full screen, no address bar
- [ ] Offline: app + library + reading vẫn hoạt động
- [ ] Offline indicator hiện/ẩn đúng

---

## 💎 PHASE 5: POLISH

### File Architecture:

```
hooks/
  useTocDrawer.ts             ← Drawer state + chapter list logic
  useDictionaryLookup.ts      ← Double-tap word → dictionary lookup

components/
  TocDrawer.tsx               ← Swipe-from-left table of contents
  BookmarkButton.tsx          ← Long-press paragraph → bookmark
  DropCap.tsx                 ← First letter enlarged 3 lines
  DictionaryTooltip.tsx       ← Popup showing Hán-Việt meaning
```

### Bước 5.1: `DropCap` component
**File**: `src/components/DropCap.tsx`
- Props: `firstChar`, `enabled`
- Float: left, 3-line height
- Skip if first char is not Unicode letter
- **~25 lines max**

### Bước 5.2: `TocDrawer` component + `useTocDrawer` hook
**Hook**: `src/hooks/useTocDrawer.ts`
- Track swipe-from-left gesture (separate from swipe-back: uses wider area)
- Manage drawer open/close state
- Provide chapter status (✅ read, 📖 reading, ⬜ unread)

**Component**: `src/components/TocDrawer.tsx`
- Props from hook: `chapters`, `currentChapterId`, `open`, `onClose`, `onSelect`
- Slide-in drawer from left
- Chapter list with status icons
- Tab: "Bookmarks" (future)
- **~80 lines max**

### Bước 5.3: `BookmarkButton` component
**File**: `src/components/BookmarkButton.tsx`
- Long press paragraph → show "🔖 Bookmark" button
- Save to DB
- Show in TocDrawer "Bookmarks" tab

### Bước 5.4: Animations
- Page transitions: Library ↔ Reader (slide left/right)
- Skeleton shimmer on loading
- Smooth scroll-to-position on restore

### Bước 5.5: `DictionaryTooltip` + `useDictionaryLookup`
**Hook**: `src/hooks/useDictionaryLookup.ts`
- Listen double-tap on word
- Lookup in `db.dictionary`
- Return `{ word, entry, position }`

**Component**: `src/components/DictionaryTooltip.tsx`
- Tooltip above word: "con đường (原: 大道)"
- Dismiss on tap outside

### Kiểm tra Phase 5:
- [ ] Drop cap renders correctly
- [ ] TOC drawer slides in/out smoothly
- [ ] Bookmarks save and display
- [ ] Dictionary lookup shows correct entry
- [ ] Smooth page transitions

---

## 📊 EFFORT ESTIMATE

| Phase | Status | Complexity |
|-------|--------|------------|
| Phase 0: Skeleton | ✅ Done | — |
| Phase 1: Sync + Library | ✅ Done | — |
| Phase 2: Reader Core | ✅ Done | — |
| Phase 3: Quick Edit | 🔲 Next | 🟡 Medium |
| Phase 4: PWA | 🔲 | 🟢 Easy |
| Phase 5: Polish | 🔲 | 🟢 Fun |

---

## 📐 ARCHITECTURE RULES

1. **Reader.tsx < 200 dòng** — Chỉ orchestrate hooks + components
2. **1 hook = 1 responsibility** — Không mix logic
3. **Components < 100 dòng** — Nếu quá → tách
4. **Lib files = pure logic** — Không React imports
5. **TypeScript strict** — Zero `any`, zero warnings
6. **Mobile-first** — Test viewport 390×844
7. **Commit format**: `feat(mobile-p{N}): mô tả ngắn`

---
*Bản thi công v2 — Hook + Component Architecture*
*Phê duyệt: Tông chủ — 2026-02-11*
