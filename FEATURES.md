# Raiden Reader — Feature Inventory

> **Phiên bản hiện tại:** v1.7.0 (2026-02-12)
> **Mục đích:** Tài liệu đầy đủ mọi feature đã implement. Dùng để reference khi thêm feature mới, tránh duplicate hoặc conflict.
> **Cập nhật lần cuối:** 2026-02-12 16:23

---

## 📐 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7.3 + SWC |
| Routing | React Router DOM 7 |
| Database | Dexie (IndexedDB wrapper) v4 |
| PWA | vite-plugin-pwa 1.2 (Workbox generateSW) |
| Styling | Inline styles (no CSS framework) |
| Fonts | Google Fonts (6 families) |
| Deploy | Static files served via Cloudflare Tunnel / HTTPS |

---

## 📁 Architecture

```
src/
├── pages/           # 3 pages: Library, Reader, Corrections
├── components/      # 14 UI components + SyncDialog module
├── hooks/           # 16 custom hooks
├── contexts/        # ReaderContext (settings) + ToastContext
├── lib/             # db.ts (Dexie schema), sync.ts, corrections.ts
└── main.tsx         # SW registration + React root
```

---

## 1. 📚 Library Page (`Library.tsx`)

### 1.1 Workspace Cards
- **Auto-generated Geometric Covers** — Mỗi workspace có cover SVG pattern unique dựa trên title hash. Gồm circles, rectangles, triangles, decorative lines
- **Chapter Count** — Hiện số chương đã sync trên card
- **Reading Progress** — Bar % progress dựa trên chương đang đọc / tổng chương
- **New Chapter Badge** — Sau sync, nếu có chương mới → badge `🆕 +N` trên card. Clear khi tap vào

### 1.2 Continue Reading Card
- Card nổi bật ở đầu Library: tên truyện đang đọc dở + % tiến độ + tap để resume ngay
- Dùng `localStorage` key `raiden-lastWorkspace`

### 1.3 Header
- Version display: `vX.Y.Z (BUILD_ID)` 
- Stats: `N truyện · M chương đã tải`
- Menu `⋮` dropdown glassmorphism:
  - 🔄 Sync (mở SyncDialog)
  - ⬆️ Đẩy lên PC (push corrections)
  - 📝 Lịch sử sửa lỗi (navigate `/corrections`)
  - 🔍 Kiểm tra cập nhật PWA
- Pending indicator: chấm đỏ trên `⋮` khi có corrections chưa push

### 1.4 Sorting [v1.6.0]
- `SortBar` component: 3 options — Gần đây / A-Z / Chapters
- State `sortBy` persist trong component
- `sortWorkspaces()` helper function

### 1.5 Search Workspaces [v1.7.0]
- 🔍 Input field filter truyện theo tên (case-insensitive)
- Chỉ hiện khi thư viện có >5 truyện (tự động ẩn khi ít)
- Tích hợp trong `LibraryToolbar` component

### 1.6 Grid/List View Toggle [v1.7.0]
- ☰/▦ Toggle button chuyển giữa hiển thị lưới (2 cột) và danh sách (1 cột)
- State `viewMode: 'grid' | 'list'` persist trong component
- Grid: `gridTemplateColumns: repeat(2, 1fr)`, List: `flexDirection: column`

### 1.7 Batch Delete [v1.7.0]
- 🗑 Nút bật chế độ xóa (đỏ khi active)
- Tap workspace để chọn/bỏ chọn (checkbox overlay góc phải trên)
- Selected workspaces có `outline: 2px solid #ef4444`
- Nút "Xóa N" xuất hiện khi có selection → `confirm()` trước khi xóa
- Xóa cascade: chapters + dictionary + workspace record

### 1.8 Pull-to-Refresh [v1.2.0]
- Kéo xuống ở đầu trang → indicator arrow → mở Sync dialog
- Hook: `usePullToRefresh.ts`

### 1.9 Online/Offline Status
- Header badge: 🟢 Online / 🔴 Offline (pulse animation)
- Hook: `useOnlineStatus.ts`

### 1.10 PWA Update Banner [v1.0.0]
- Service Worker detect new version → banner xanh `🆕 Có bản cập nhật mới!` + nút Cập nhật
- Nút "Kiểm tra cập nhật" trong menu: force SW check → hiện ⏳ loading → alert nếu đã mới nhất
- Hook: `useVersionCheck.ts`

### 1.11 Scroll-to-Top [v1.7.0]
- `scrollRef` tạo sẵn cho scroll-to-top khi tap header (wiring pending)

---

## 2. 📖 Reader Page (`Reader.tsx`)

### 2.1 Content Rendering
- **Infinite Scroll** — Lazy load 5 chương, auto-expand khi scroll tới gần cuối/đầu
- **Chapter Dividers** — Gradient line + title uppercase giữa các chương
- **Chapter Divider Variants** [v1.7.0] — 8 ký hiệu trang trí: `· · ·`, `✦`, `ꕥ`, `❖`, `◆`, `∗ ∗ ∗`, `⁂`, `❦`. Chọn dựa trên hash title → deterministic per chương
- **Drop Cap** — Ký tự đầu chương phóng to 3.2em, float left, accent color
- **Drop Cap Toggle** [v1.7.0] — `showDropCap` setting: bật/tắt Drop Cap trong Settings
- **Dialogue Italic** — Text trong ngoặc kép tự động in nghiêng (regex detect `"..."`, `「...」`, etc.)
- **Paragraph Spacing** [v1.6.0] — Configurable `marginBottom` per paragraph (0.5–2.5em)
- **Text Alignment** [v1.6.0] — Justify hoặc Left align
- **Margins Control** [v1.7.0] — Slider chỉnh lề trái/phải (8–48px), áp dụng vào scroll container `paddingLeft/Right`
- **Max Width** [v1.7.0] — Slider giới hạn chiều rộng văn bản (0–1200px, 0 = unlimited). `maxWidth` + `margin: 0 auto` center nội dung trên màn lớn
- **Memoized Paragraphs** [v1.7.0] — `useMemo` cho paragraph rendering trong `ChapterBlock`, dependencies: `content`, `paragraphSpacing`, `textAlign`, `showDropCap`, `theme.accent`
- **2-Column Landscape** [v1.3.0] — Khi width ≥ 768px, content chia 2 cột CSS columns

### 2.2 Reading Modes [v1.7.0]
- **Scroll Mode** (`readingMode: 'scroll'`) — Mặc định, cuộn liên tục
- **Page-Turn Mode** (`readingMode: 'paginated'`) — CSS `scroll-snap-type: y mandatory` cho ebook-like experience
  - Tap cạnh trái (zone <20%) → lật trang trước (`scrollBy -90% viewport`)
  - Tap cạnh phải (zone >80%) → lật trang sau (`scrollBy +90% viewport`)
  - Mỗi chapter wrapper có `scrollSnapAlign: 'start'`
  - Tap giữa vẫn hoạt động: double-tap → Zen Mode, single-tap → navbar toggle

### 2.3 Navigation
- **Navbar** — Top bar: ← Back, title (scrolled), ⚙️ Settings, theme cycle, fullscreen toggle
- **Navbar Auto-hide** — Ẩn khi scroll xuống, hiện khi scroll lên
- **TOC Drawer** — Slide-in từ trái, hiện toàn bộ chương: ✅ đã đọc / 📖 đang đọc / ⬜ chưa đọc
- **TOC Chapter Progress %** [v1.6.0] — Badge % tại chương đang đọc
- **TOC Chapter Jump Input** [v1.7.0] — Ô nhập số chương (1-N) + nút ↪ để nhảy nhanh. Chỉ hiện khi >20 chương. Component riêng `ChapterJumpInput`
- **TOC Jump** — Tap chương → expand loadedRange + retry scroll (15 attempts × rAF)
- **Swipe Back** — Swipe từ cạnh trái (25px) → arrow indicator → navigate về Library
- **Progress Bar** — Bottom gradient bar, width = scroll % trong chương hiện tại

### 2.4 Reading Position Memory
- **Pixel-Perfect Restore** — Save `{ chapterOrder, ratio }` vào localStorage mỗi 300ms throttle
- **Cross-sync Stable** — Dùng `order` (stable) thay vì `id` (auto-increment, thay đổi sau sync)
- Hook: `useReadingPosition.ts`

### 2.5 Zen Mode [v1.5.0]
- Double-tap vùng giữa màn hình → ẩn toàn bộ UI (navbar, progress bar, gradient fades, FAB)
- Fullscreen API ẩn Android status bar
- Flash indicator `🧘 ZEN` 1.2s khi toggle
- Haptic feedback [v1.6.0] — Rung pattern `[15, 50, 15]` khi bật, `30` khi tắt

### 2.6 Auto-Scroll [v1.3.0]
- Nút 📜 trong navbar → tự cuộn
- Bottom bar: speed slider 🐢↔🐇 (1–5 px/frame)
- Auto-stop khi tới cuối nội dung
- Hook: `useAutoScroll.ts` (requestAnimationFrame-based)

### 2.7 Visual Effects
- **Gradient Fades** — Top (40px) + Bottom (60px) gradient fade, text không bị cắt cụt
- **Hidden Scrollbar** — CSS `scrollbar-width: none` + `-webkit-scrollbar: none`
- **Night Light Filter** [v1.6.0] — Amber overlay (`rgba(255,170,50,N)`) với `mixBlendMode: multiply`, intensity 0–50%
- **Dimmer** — Black overlay, opacity 0–70%
- **Page Transitions** — Animation khi navigate giữa pages

### 2.8 Text Selection & Correction
- **Selection Bubble** — Select text → floating bubble với ✏️ Sửa, 📋 Copy, 📤 Share [v1.6.0]
- **Auto-Correction** — Select text → bảng sửa lỗi tự hiện sau 400ms
- **Edit Dialog** — Modal form: old text → new text, scope (word/phrase/sentence), auto-fill
- **Share** [v1.6.0] — Web Share API, fallback copy nếu share fail/không hỗ trợ
- Hook: `useTextSelection.ts`, `useTextCorrection.ts`

### 2.9 Wake Lock [v1.3.0]
- Màn hình không tắt khi đọc
- Auto re-acquire khi tab visible lại
- Hook: `useWakeLock.ts`

---

## 3. ⚙️ Settings Panel (`SettingsPanel.tsx`)

### 3.1 Theme Selection
- **5 Themes** — Dark (🌙), Forest (🌲), Slate (🌊), Sepia (📜), Light (☀️)
- **Segmented Control** [v1.6.0] — Premium segmented UI, active state shows theme preview colors. Extracted to module-level component [v1.7.0]
- **Theme Cycle** — Navbar button cycle qua 5 themes theo thứ tự
- **Haptic on Theme Change** [v1.6.0] — Vibrate 15ms khi chọn theme
- **isDark Detection** — Luminance-based calculation (`(r*299+g*587+b*114)/1000 < 128`)

| Theme | Background | Text | Accent | Border |
|-------|-----------|------|--------|--------|
| Dark | `#000000` | `#D1D1D1` | `#8b5cf6` (purple) | `#222222` |
| Forest | `#1A2A1A` | `#C8D8C0` | `#4ADE80` (green) | `#2D3D2D` |
| Slate | `#1E2A3A` | `#B8C8D8` | `#60A5FA` (blue) | `#2D3D4D` |
| Sepia | `#F4ECD8` | `#5B4636` | `#A0522D` (brown) | `#D4C5A9` |
| Light | `#FAFAFA` | `#333333` | `#6D28D9` (violet) | `#E5E5E5` |

### 3.2 Typography
- **6 Fonts** — Literata, Lora, Source Serif 4, Merriweather, Noto Serif, Inter
- **Font Size** — Slider 14–28px
- **Line Height** — Slider 1.4–2.2
- **Paragraph Spacing** [v1.6.0] — Slider 0.5–2.5em
- **Text Alignment** [v1.6.0] — Segmented toggle: ☰ Đều hai bên (justify) / ☷ Trái (left)

### 3.3 Reading Mode [v1.7.0]
- **Segmented Control**: 📜 Cuộn liên tục (scroll) / 📄 Lật trang (paginated)
- Persisted trong `ReaderSettings.readingMode`

### 3.4 Layout Controls [v1.7.0]
- **Margins** — Slider 8–48px (lề trái/phải)
- **Max Width** — Slider 0–1200px (0 = không giới hạn, useful cho tablet/desktop)
- **Drop Cap Toggle** — Switch bật/tắt chữ cái đầu đoạn phóng to

### 3.5 Visual Filters
- **Night Light** [v1.6.0] — Slider 0–50% amber filter intensity
- **Dimmer** — Slider 0–70% black overlay

### 3.6 Live Preview [v1.6.0]
- Preview text block reflect đúng: font, fontSize, lineHeight, textAlign, theme colors
- Vietnamese sample text: `Đoạn văn mẫu — "Hắn nói, đây là tiên giới sao?"`

### 3.7 Reset Settings [v1.7.0]
- Nút "🔄 Khôi phục mặc định" — Reset toàn bộ settings về `DEFAULT_SETTINGS`
- `resetSettings()` function trong `ReaderContext`
- Confirm dialog trước khi reset

### 3.8 Storage Info [v1.6.0]
- Hiện dung lượng đã dùng (từ `navigator.storage.estimate()`)
- Warning khi usage >80% quota [v1.7.0]

### 3.9 Persistence
- Tất cả settings save vào `localStorage` key `raiden-reader-settings`
- Auto-load on mount, auto-save on change

---

## 4. 🔄 Sync System

### 4.1 SyncDialog (`SyncDialog/`)
- Refactored: 7 sub-components + `useSync` hook + CSS file riêng
- Steps: Enter IP → Discover workspaces → Select → Download chapters
- Progress: per-workspace bars + tổng progress

### 4.2 Discovery
- `SyncService.discover()` — GET manifest từ Desktop server
- QR code parsing: `raiden://sync?ip=...&port=...&token=...`
- Auto-detect server URL từ saved config

### 4.3 Data Sync
- Download chapters (content_original + content_translated + title_translated)
- Download dictionary entries
- Workspace metadata sync
- New Chapter Badge tracking (`syncMeta.prevChapterCount`)

### 4.4 Push Corrections
- Sửa lỗi dịch trên mobile → push về PC Desktop
- `PushStatusBar` component hiện trạng thái
- Corrections page (`/corrections`) xem lịch sử

### 4.5 Sync Toast
- Auto toast "✅ Đã cập nhật N chương" sau sync thành công (3s auto-hide)

---

## 5. 📝 Corrections Page (`Corrections.tsx`)

- Danh sách sửa lỗi đã gửi/chưa gửi
- Filter theo: All / Pending / Pushed
- Filter theo workspace
- Mỗi item: old→new text, chapter, scope, time ago, nút xoá
- Theme-aware styling (luminance-based isDark)

---

## 6. 🛡️ Error & Notification System

### 6.1 Error Boundary [v1.6.0]
- `ErrorBoundary.tsx` — Class component wraps entire app
- Catches rendering errors → shows recovery UI (emoji + error message + "Về Library" button)
- Prevents blank white screen on crash

### 6.2 Toast System [v1.6.0]
- `ToastContext.tsx` — Global context + provider
- `useToast()` hook → `showToast(message, type)`
- 3 types: `success` (green), `error` (red), `info` (purple)
- Glassmorphism style: blur backdrop, accent border, bold text
- Auto-dismiss 3s, slide-up animation
- Stacks multiple toasts vertically

### 6.3 Offline Indicator
- `OfflineIndicator.tsx` — Fixed banner top
- Orange gradient, "📴 Không có mạng — đọc offline"
- Auto show/hide based on `navigator.onLine`

---

## 7. 📲 PWA Features

### 7.1 Service Worker
- Workbox `generateSW` mode
- Precache all assets (12 entries, ~479KB gzip)
- `registerSW({ immediate: true })`

### 7.2 Install Prompt
- `InstallPrompt.tsx` — "Add to Home Screen" banner
- Catches `beforeinstallprompt` event
- "Cài đặt" + "Để sau" buttons
- Cooldown via `localStorage`

### 7.3 Theme Color Sync
- `meta[name="theme-color"]` auto-update theo reader theme
- Inline script trong `index.html` set bg trước React mount (no flash)

### 7.4 Offline Reading
- Tất cả data trong IndexedDB → đọc offline hoàn toàn
- SW cache static assets

---

## 8. 📳 Haptic Feedback

| Trigger | Pattern | Version |
|---------|---------|---------|
| Zen Mode On | `[15, 50, 15]` | v1.6.0 |
| Zen Mode Off | `30` | v1.6.0 |
| Theme Change (Settings) | `15` | v1.6.0 |

> Note: `navigator.vibrate()` chỉ hoạt động trên Android Chrome. Tất cả calls wrapped trong `try/catch`.

---

## 9. 💾 Data Model (Dexie IndexedDB)

### Tables
| Table | Primary Key | Indexes |
|-------|------------|---------|
| `workspaces` | `id` | — |
| `chapters` | `++id` | `workspaceId`, `[workspaceId+order]` |
| `dictionary` | `++id` | `workspaceId`, `[workspaceId+original]` |
| `readingProgress` | `workspaceId` | — |

### localStorage Keys
| Key | Purpose |
|-----|---------|
| `raiden-reader-settings` | All reader settings (JSON) |
| `raiden-lastWorkspace` | Last opened workspace ID |
| `raiden-lastChapter-{wsId}` | Last reading position per workspace |
| `raiden-readChapters-{wsId}` | Set of read chapter IDs |
| `raiden-syncMeta-{wsId}` | Sync metadata (prevChapterCount) |
| `pwa-install-dismissed` | Install prompt cooldown timestamp |
| `raiden-server-url` | Saved sync server URL |

### Reader Settings Model [v1.7.0]

```typescript
interface ReaderSettings {
  theme: ThemeMode;          // 'dark' | 'forest' | 'slate' | 'sepia' | 'light'
  fontFamily: FontFamily;    // 'Literata' | 'Lora' | ... | 'Inter'
  fontSize: number;          // 14–28 (px)
  lineHeight: number;        // 1.4–2.2
  dimmerOpacity: number;     // 0–0.7
  paragraphSpacing: number;  // 0.5–2.5 (em)
  textAlign: 'justify' | 'left';
  nightLightIntensity: number; // 0–0.5
  readingMode: ReadingMode;  // 'scroll' | 'paginated' [v1.7.0]
  margins: number;           // 8–48 (px) [v1.7.0]
  maxWidth: number;          // 0–1200 (px, 0=unlimited) [v1.7.0]
  showDropCap: boolean;      // true/false [v1.7.0]
}
```

---

## 10. 🎨 UI Components

| Component | File | Mô tả |
|-----------|------|-------|
| `WorkspaceCard` | `WorkspaceCard.tsx` | Card truyện với cover pattern + progress + badge |
| `LibraryHeader` | `LibraryHeader.tsx` | Header Library với menu + stats |
| `LibraryToolbar` | `Library.tsx` (internal) | Search + Sort + View Toggle + Batch Delete [v1.7.0] |
| `ReaderNavbar` | `ReaderParts.tsx` | Top navbar trong Reader |
| `ChapterBlock` | `ReaderParts.tsx` | Render 1 chương (DropCap + paragraphs), `React.memo` + `useMemo` [v1.7.0] |
| `ChapterDivider` | `ReaderParts.tsx` | Decorative divider + gradient line giữa chương, 8 variants [v1.7.0] |
| `ProgressBar` | `ReaderParts.tsx` | Bottom progress bar |
| `SettingsPanel` | `SettingsPanel.tsx` | Bottom sheet settings |
| `SegmentedControl` | `SettingsPanel.tsx` (module-level) | Reusable segmented toggle [v1.7.0 extracted] |
| `TocDrawer` | `TocDrawer.tsx` | TOC slide-in drawer |
| `ChapterJumpInput` | `TocDrawer.tsx` (internal) | Number input for quick chapter jump [v1.7.0] |
| `SelectionBubble` | `SelectionBubble.tsx` | Floating action bubble |
| `EditDialog` | `EditDialog.tsx` | Modal sửa lỗi dịch |
| `SyncDialog` | `SyncDialog/index.tsx` | Sync module (7 sub-components) |
| `DropCap` | `DropCap.tsx` | Chữ cái đầu phóng to |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Crash recovery UI |
| `OfflineIndicator` | `OfflineIndicator.tsx` | Offline banner |
| `InstallPrompt` | `InstallPrompt.tsx` | PWA install banner |
| `EmptyState` | `EmptyState.tsx` | Empty library placeholder |
| `PushStatusBar` | `PushStatusBar.tsx` | Correction push status |
| `PageTransition` | `PageTransition.tsx` | Page transition wrapper |

---

## 11. 🪝 Custom Hooks

| Hook | File | Mô tả |
|------|------|-------|
| `useAutoScroll` | `useAutoScroll.ts` | rAF-based auto-scroll với speed control |
| `useDimmer` | `useDimmer.ts` | Dimmer overlay control |
| `useInfiniteScroll` | `useInfiniteScroll.ts` | Lazy chapter loading + expand range |
| `useLibrary` | `useLibrary.ts` | Library workspace queries |
| `useNavbar` | `useNavbar.ts` | Scroll-direction show/hide navbar |
| `useOnlineStatus` | `useOnlineStatus.ts` | Online/offline detection |
| `usePullToRefresh` | `usePullToRefresh.ts` | Pull down gesture |
| `useReadChapters` | `useReadChapters.ts` | localStorage Set tracking |
| `useReadingPosition` | `useReadingPosition.ts` | Throttled position save/restore |
| `useSwipeBack` | `useSwipeBack.ts` | Edge swipe navigation |
| `useSync` | `useSync.ts` | Sync logic: discover + download |
| `useTextCorrection` | `useTextCorrection.ts` | Correction form + DB ops |
| `useTextSelection` | `useTextSelection.ts` | Selection bubble trigger |
| `useTocDrawer` | `useTocDrawer.ts` | TOC open/close state |
| `useVersionCheck` | `useVersionCheck.ts` | SW update detection + apply |
| `useWakeLock` | `useWakeLock.ts` | Screen wake lock API |

---

## 12. 🐛 Known Issues / Pre-existing Lint Warnings

| File | Issue | Severity |
|------|-------|----------|
| `useInfiniteScroll.ts:41` | `setLoadedRange` called inside effect body | Warning (works fine in practice) |
| `useSync.ts:117` | `discover()` called inside effect body | Warning (guarded by `didDiscover.current`) |
| `SelectionBubble.tsx:43` | Ref accessed during render (`scrollContainerRef.current`) | Warning (functional, position calculation) |

---

## 📝 Feature Backlog (Chưa implement)

> Danh sách các feature đã thảo luận nhưng chưa implement. Cập nhật khi hoàn thành.

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| #32 | Long-press bookmark | Medium | Bookmark paragraph, persistent |
| #33 | Reading time estimate | Low | Words/min × paragraph count |
| #35 | Chapter title smarts | Low | Auto-clean/detect chapter numbering |
| #36 | Paragraph highlight double-tap | Medium | Highlight on double-tap paragraph |
| #37 | Chapter info at end | Low | Show chapter stats at bottom |
| #39 | Last sync time on card | Low | "Sync X hours ago" on WorkspaceCard |
| #41 | Workspace stats popup | Medium | Tap info strip → popup chapters/read/unread/dict |
| #48 | Delta sync | High | Only download changed chapters |
| #49 | Auto-sync on open | Medium | Background sync when online |
| #50 | Sync conflict warning | Medium | Warn before overwriting local corrections |
| #51 | QR code scan for sync | Medium | Camera scan QR instead of manual IP |
| #53 | Splash screen | Low | Branded loading screen |
| — | Auto-scroll speed HUD polish | Low | Cơ bản đã có, cần polish UI |
| — | Offline indicator refinement | Low | Badge ở Library header, cần edge cases |
| — | Share API fallback for desktop | Low | Web Share API chỉ có trên mobile |
