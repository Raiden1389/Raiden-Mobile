# 🦅 RAIDEN MOBILE COMPANION — IMPLEMENTATION PLAN
## Bản Thi Công Chi Tiết cho Đệ Tử Nội Môn

> **Dự án**: `c:\Users\Admin\.gemini\antigravity\scratch\raiden-mobile`
> **Spec gốc**: `ai-translator/docs/mobile/SPEC.md`
> **Phê duyệt**: Tông chủ — 2026-02-11
> **Tổng Phase**: 5 (+ Phase 0 đã hoàn tất)

---

## ✅ PHASE 0: SKELETON (ĐÃ HOÀN TẤT)
- [x] Khởi tạo Vite + React + SWC + TypeScript
- [x] Cài đặt dependencies: Dexie, React Router DOM
- [x] Tạo DB Schema (`src/lib/db.ts`) — 6 tables
- [x] Tạo SyncService (`src/lib/sync.ts`) — QR parse, chunked download, push
- [x] Tạo ReaderContext (`src/contexts/ReaderContext.tsx`) — themes, fonts, settings
- [x] Tạo Library page skeleton (`src/pages/Library.tsx`)
- [x] Tạo Reader page skeleton (`src/pages/Reader.tsx`)
- [x] TypeScript 0 lỗi, Dev server chạy OK

---

## 📦 PHASE 1: SYNC + LIBRARY (Desktop → Mobile)
**Mục tiêu**: Sếp bấm Sync trên PC, scan QR trên điện thoại, truyện xuất hiện trong Library.

### Bước 1.1: Rust Sync Server trong Tauri
**File**: `ai-translator/src-tauri/src/sync_server.rs` (TẠO MỚI)
**Việc cần làm**:
1. Tạo module `sync_server.rs` với struct `SyncServer`
2. Implement hàm `start(port: u16)`:
   - Sinh `token` ngẫu nhiên bằng `uuid::Uuid::new_v4()`
   - Lấy LAN IP bằng crate `local_ip_address` (thêm vào Cargo.toml: `local_ip_address = "0.6"`)
   - Khởi `tiny_http::Server::http(format!("0.0.0.0:{}", port))`
   - Spawn thread xử lý request loop
3. Implement routing trong request loop:
   - `GET /status` → trả `200 OK` + JSON `{ "app": "raiden", "version": "1.0" }`
   - `GET /manifest?workspaceId=X` → Đọc danh sách chapters từ file system, trả `{ totalChapters, chapters: [{id, order, updatedAt}] }`
   - `GET /workspace?id=X` → Trả metadata.json của workspace
   - `GET /dictionary?workspaceId=X` → Trả dictionary.json
   - `GET /chapters?workspaceId=X&offset=0&limit=50` → Trả mảng chapters theo phân trang
   - Tất cả endpoint kiểm tra header `Authorization: Bearer <token>`
   - Nếu token sai → 401
   - Thêm CORS headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Authorization, Content-Type`
   - Handle preflight `OPTIONS` request → trả 200 với CORS headers
4. Implement hàm `stop()` → set flag để dừng request loop
5. Auto-shutdown timer: 5 phút không có request → tự gọi `stop()`

**QUY TẮC QUAN TRỌNG**:
- KHÔNG dùng async/tokio cho tiny_http. Dùng `std::thread::spawn`.
- Đọc file storage bằng `std::fs::read_to_string`.
- Path đến workspaces: `app_data_dir/workspaces/{workspaceId}/`
- Path đến chapters: `app_data_dir/workspaces/{workspaceId}/chapters/`

### Bước 1.2: Tauri Command để Start/Stop Server
**File**: `ai-translator/src-tauri/src/lib.rs` (SỬA)
**Việc cần làm**:
1. Thêm `mod sync_server;` ở đầu file
2. Tạo Tauri command:
```rust
#[tauri::command]
async fn start_sync_server(app_handle: tauri::AppHandle) -> Result<String, String> {
    // Lấy app_data_dir
    // Gọi sync_server::SyncServer::start(8888, app_data_dir, token)
    // Trả về JSON: { "ip": "192.168.1.5", "port": 8888, "token": "abc123" }
}

#[tauri::command]
fn stop_sync_server() -> Result<(), String> {
    // Gọi sync_server::SyncServer::stop()
}
```
3. Đăng ký 2 commands vào `invoke_handler`

### Bước 1.3: UI Sync Button trên Desktop
**File**: `ai-translator/components/workspace/SyncMobileButton.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Tạo component hiển thị nút "📱 Sync Mobile"
2. Khi bấm: gọi `invoke('start_sync_server')` → nhận `{ ip, port, token }`
3. Tạo QR string: `raiden://sync?ip=${ip}&port=${port}&token=${token}`
4. HIện QR code (dùng thư viện `qrcode.react` hoặc tự vẽ bằng canvas)
5. Hiển thị dialog modal với QR code + text "Scan bằng điện thoại"
6. Nút "Dừng Sync" → gọi `invoke('stop_sync_server')`

**DEPENDENCY MỚI (Desktop)**: `npm install qrcode.react`

### Bước 1.4: Mobile — Sync Flow UI
**File**: `raiden-mobile/src/pages/Library.tsx` (SỬA)
**File**: `raiden-mobile/src/components/SyncDialog.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Tạo `SyncDialog` component:
   - Input field cho URL thủ công (backup nếu QR không scan được)
   - Nút "Bắt đầu Sync"
   - Progress bar: "Đang tải: 50/200 chương..."
   - Trạng thái: Connecting → Downloading → Done
2. Sửa Library.tsx:
   - Nút "Sync" mở SyncDialog
   - Sau khi sync xong → `useLiveQuery` tự động cập nhật danh sách workspaces
3. Gọi `syncService.parseQR(url)` → `syncService.checkConnection()` → `syncService.downloadWorkspace(id, onProgress)`

### Bước 1.5: Mobile — Library UI Polish
**File**: `raiden-mobile/src/pages/Library.tsx` (SỬA)
**Việc cần làm**:
1. Thêm Sync Status Badge cho mỗi workspace card:
   - 🟢 Synced (không có corrections chưa push)
   - 🟡 Có sửa đổi chưa đẩy về PC
2. Hiện số chương đã dịch / tổng chương
3. Hiện "Đọc lần cuối: 2 giờ trước" dựa trên ReadingProgress
4. Khi bấm vào card → navigate tới `/read/${workspaceId}`

### Bước 1.6: Kiểm tra Phase 1
**Tiêu chí hoàn tất**:
- [ ] Desktop: Bấm "Sync Mobile" → hiện QR code
- [ ] Mobile: Nhập URL hoặc paste QR data → kết nối được với Desktop
- [ ] Mobile: Download 50+ chương được, có progress bar
- [ ] Mobile: Library hiện đúng danh sách truyện sau sync
- [ ] Mobile: Tắt wifi → app vẫn hiện thư viện (offline)
- [ ] Desktop: Server tự tắt sau 5 phút

---

## 📖 PHASE 2: READER CORE
**Mục tiêu**: Sếp mở truyện, đọc với Infinite Scroll mượt mà, chỉnh theme/font/size.

### Bước 2.1: Infinite Scroll Engine
**File**: `raiden-mobile/src/pages/Reader.tsx` (SỬA — nâng cấp từ skeleton)
**Việc cần làm**:
1. Implement Intersection Observer đúng chuẩn "Windowed 3 chapters":
   - Luôn giữ tối đa 3 chapters trong DOM: N-1, N, N+1
   - Khi chapter N-2 ra khỏi viewport → thay bằng placeholder div có `height` cố định
   - Placeholder div hiện dòng nhỏ "Chương X" màu mờ
   - Khi placeholder quay lại viewport → load lại nội dung
2. Chapter preloading: Khi đọc đến 80% chương N → load N+1, N+2 vào IndexedDB (nếu chưa có)
3. Haptic feedback khi sang chương: `navigator.vibrate?.(10)`

### Bước 2.2: Chapter Divider
**File**: `raiden-mobile/src/components/ChapterDivider.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Component nhận props: `chapterTitle: string`
2. Render:
   - Đường kẻ ngang mờ (gradient fade hai đầu)
   - Tên chương ở giữa, font nhỏ, letter-spacing rộng
   - Margin trên/dưới 40px
3. Animation: fade-in khi scroll vào view

### Bước 2.3: Smart Navbar
**File**: `raiden-mobile/src/components/Navbar.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Theo dõi scroll direction:
   - Cuộn xuống → ẩn navbar (transform: translateY(-100%))
   - Cuộn lên → hiện navbar (transform: translateY(0))
   - Chạm giữa màn hình → toggle
2. Nội dung navbar:
   - Trái: "← Thư viện" (link về Library)
   - Giữa: Tên chương đang đọc (truncate nếu dài)
   - Phải: Nút theme toggle (🌙/📜/☀️)
3. Background: glassmorphism (backdrop-filter: blur(10px))
4. Transition mượt mà (0.25s ease)

### Bước 2.4: Settings Panel
**File**: `raiden-mobile/src/components/SettingsPanel.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Panel trượt lên từ đáy màn hình (bottom sheet) khi bấm icon ⚙️ trong navbar
2. Nội dung:
   - **Theme**: 3 nút tròn (Đen/Sepia/Trắng) — highlight active
   - **Font**: 4 nút text (Literata/Lora/Inter/Noto Serif) — mỗi nút dùng chính font đó để render
   - **Text Size**: Slider 14px → 28px, hiện giá trị hiện tại, preview chữ "Aa" thay đổi real-time
   - **Line Height**: Slider 1.4 → 2.2, hiện giá trị
   - **Storage**: Hiện "Đang dùng: X MB" (từ `navigator.storage.estimate()`)
3. Mọi thay đổi apply **real-time** qua ReaderContext (đã có)
4. Đóng panel: chạm ngoài hoặc vuốt xuống

### Bước 2.5: Progress Bar
**File**: `raiden-mobile/src/components/ProgressBar.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Thanh ngang 2px cố định ở đỉnh màn hình
2. Width = scrollPercent% 
3. Màu = theme accent color
4. Transition: width 0.1s (mượt, không giật)
5. z-index cao nhất (trên cả navbar)

### Bước 2.6: Reading Position Save
**File**: `raiden-mobile/src/hooks/useReadingPosition.ts` (TẠO MỚI)
**Việc cần làm**:
1. Custom hook nhận `workspaceId`
2. Mỗi 3 giây (debounce), lưu vào `db.readingProgress`:
   - `chapterId`: chapter đang hiện trên viewport
   - `scrollPercent`: % cuộn trong chapter đó
   - `paragraphIndex`: index paragraph gần viewport center nhất
3. Khi mount: đọc từ DB → scroll đến vị trí đã lưu
4. Export: `{ savePosition, restorePosition }`

### Bước 2.7: Kiểm tra Phase 2
**Tiêu chí hoàn tất**:
- [ ] Cuộn mượt qua 10+ chương liên tục, không lag
- [ ] Chỉ có 3 chương trong DOM tại mỗi thời điểm
- [ ] Chuyển theme ngay lập tức, không flash trắng
- [ ] Chỉnh font/size/line-height preview real-time
- [ ] Đóng app → mở lại → nhảy về đúng chỗ đọc dở
- [ ] Navbar ẩn/hiện mượt khi cuộn

---

## ✏️ PHASE 3: QUICK EDIT (Cải chính)
**Mục tiêu**: Sếp bôi đen text → sửa → replaceAll toàn bộ chương → sync về PC.

### Bước 3.1: Text Selection Handler
**File**: `raiden-mobile/src/hooks/useTextSelection.ts` (TẠO MỚI)
**Việc cần làm**:
1. Lắng nghe event `selectionchange` trên document
2. Khi user bôi đen text:
   - Lấy `window.getSelection().toString()`
   - Lấy vị trí selection (dùng `getRangeAt(0).getBoundingClientRect()`)
   - Trả về `{ text, rect }` qua callback
3. Debounce 200ms để tránh trigger liên tục

### Bước 3.2: Floating Bubble
**File**: `raiden-mobile/src/components/SelectionBubble.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Nhận props: `selectedText`, `position` (x, y), `onEdit`
2. Render: Bubble nhỏ hiện ngay phía trên vùng bôi đen
   - Nút "✏️ Sửa" → gọi onEdit
   - Nút "📋 Copy" → copy vào clipboard
3. Position: absolute, top = rect.top - bubble.height - 8px
4. Animation: scale từ 0.8 → 1.0, fade in
5. Tự dismiss khi chạm nơi khác

### Bước 3.3: Edit Dialog
**File**: `raiden-mobile/src/components/EditDialog.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Modal overlay full-screen với backdrop blur
2. Nội dung:
   - Label "Văn bản gốc:"
   - Textarea readonly hiện `oldText` (highlight background nhẹ)
   - Label "Sửa thành:"
   - Textarea input (focus tự động, hiện keyboard)
   - Radio: `○ Chỉ chương này` / `● Tất cả chương từ đây trở đi` (mặc định: tất cả)
   - Nút "Lưu" (accent color) + Nút "Hủy"
3. Khi bấm "Lưu":
   - Gọi hàm `applyCorrection(workspaceId, oldText, newText, scope, currentChapterOrder)`

### Bước 3.4: Correction Engine
**File**: `raiden-mobile/src/lib/corrections.ts` (TẠO MỚI)
**Việc cần làm**:
1. Hàm `applyCorrection(workspaceId, oldText, newText, scope, fromOrder)`:
   ```typescript
   // 1. Xác định range chapters cần sửa
   const query = scope === 'all'
     ? db.chapters.where('[workspaceId+order]').between([wsId, fromOrder], [wsId, Infinity])
     : db.chapters.where({ workspaceId: wsId, order: fromOrder });
   
   // 2. Bulk modify
   await query.modify(chapter => {
       if (chapter.content_translated?.includes(oldText)) {
           chapter.content_translated = chapter.content_translated.replaceAll(oldText, newText);
           chapter.isDirty = true;
       }
   });
   
   // 3. Lưu correction vào queue
   await db.corrections.add({
       workspaceId: wsId,
       oldText, newText, scope,
       fromChapterOrder: fromOrder,
       appliedAt: new Date(),
       syncedToPC: false,
   });
   ```
2. Hàm `getPendingCorrections(workspaceId)` → đếm số corrections chưa sync

### Bước 3.5: CSS Dimmer (Vuốt cạnh trái)
**File**: `raiden-mobile/src/hooks/useDimmer.ts` (TẠO MỚI)
**Việc cần làm**:
1. Theo dõi touch events trên cạnh trái màn hình (x < 30px khi touchstart)
2. Khi vuốt dọc trên cạnh trái:
   - Vuốt lên → tăng dimmerOpacity
   - Vuốt xuống → giảm dimmerOpacity
3. Gọi `setDimmerOpacity()` từ ReaderContext
4. Hiện indicator nhỏ (icon 🔆) khi đang điều chỉnh

### Bước 3.6: Sync Back (Mobile → PC)
**File**: `raiden-mobile/src/pages/Library.tsx` (SỬA)
**Việc cần làm**:
1. Thêm nút "Đẩy về PC" trong Library (chỉ hiện khi có pending corrections)
2. Gọi `syncService.pushCorrections(workspaceId)`
3. Hiện progress: "Đang gửi 5 bản sửa..."
4. Cập nhật Sync Status Badge sau khi xong

### Bước 3.7: Desktop — Nhận Corrections
**File**: `ai-translator/src-tauri/src/sync_server.rs` (SỬA)
**Việc cần làm**:
1. Thêm endpoint `POST /update`:
   - Parse body JSON: `{ workspaceId, corrections, chapters }`
   - Ghi corrections vào file `corrections_log.json`
   - Ghi đè chapters đã sửa vào `chapters/*.json`
2. Emit Tauri event `sync-update-received` để frontend biết
3. Frontend nhận event → reload chapters từ file → cập nhật IndexedDB → gọi `syncFullStory()`

### Bước 3.8: Kiểm tra Phase 3
**Tiêu chí hoàn tất**:
- [ ] Bôi đen text → bubble hiện đúng vị trí
- [ ] Dialog edit: old text hiện đúng, input focus tự động
- [ ] Bấm Save → text thay đổi ngay trên màn hình, không mất scroll position
- [ ] "Tất cả chương" → cuộn sang chương sau → text đã đổi
- [ ] Sync back về PC → file .txt trên PC đã cập nhật
- [ ] CSS Dimmer: vuốt cạnh trái thay đổi độ tối

---

## 📲 PHASE 4: PWA + OFFLINE
**Mục tiêu**: "Add to Home Screen" → dùng như native app, offline hoàn toàn.

### Bước 4.1: PWA Manifest
**File**: `raiden-mobile/public/manifest.json` (TẠO MỚI)
**Việc cần làm**:
```json
{
  "name": "Raiden Reader",
  "short_name": "Raiden",
  "description": "Đọc truyện dịch — Raiden Mobile Companion",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#8b5cf6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Bước 4.2: Service Worker (vite-plugin-pwa)
**Việc cần làm**:
1. `npm install -D vite-plugin-pwa`
2. Cấu hình trong `vite.config.ts`:
```typescript
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2}'],
    },
  })],
});
```
3. Tự động cache tất cả static assets
4. IndexedDB data KHÔNG cần Service Worker cache (đã persistent tự nhiên)

### Bước 4.3: App Icons
**Việc cần làm**:
1. Tạo icon 512x512 cho Raiden Reader (dùng generate_image tool)
2. Resize thành 192x192
3. Đặt vào `public/icon-192.png` và `public/icon-512.png`

### Bước 4.4: Offline Indicator
**File**: `raiden-mobile/src/components/OfflineIndicator.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Lắng nghe `window.addEventListener('online'/'offline')`
2. Khi offline: hiện banner nhỏ ở đỉnh "📴 Offline — Đọc bình thường"
3. Khi online lại: banner biến mất (fade out)

### Bước 4.5: Install Prompt
**File**: `raiden-mobile/src/components/InstallPrompt.tsx` (TẠO MỚI)
**Việc cần làm**:
1. Bắt event `beforeinstallprompt`
2. Hiện banner ở đáy: "📲 Thêm vào màn hình chính để dùng như app"
3. Nút "Cài đặt" → gọi `prompt.prompt()`
4. Nút "Để sau" → dismiss, lưu localStorage để không hiện lại trong 7 ngày

### Bước 4.6: Kiểm tra Phase 4
**Tiêu chí hoàn tất**:
- [ ] Chrome Android: hiện "Add to Home Screen"
- [ ] Sau khi install: mở app → full screen, không có address bar
- [ ] Tắt wifi → mở app → vẫn hiện thư viện + đọc được
- [ ] Offline indicator hiện/ẩn đúng

---

## 💎 PHASE 5: POLISH
**Mục tiêu**: Nâng cấp trải nghiệm từ "dùng được" lên "WOW".

### Bước 5.1: Drop Cap
- Chữ đầu chương phóng to 3 dòng, float: left
- Skip nếu ký tự đầu không phải chữ cái Unicode
- Toggle ON/OFF trong Settings

### Bước 5.2: TOC Drawer
- Vuốt từ cạnh trái vào → Drawer trượt ra
- Danh sách chapters: ✅ Đã đọc, 📖 Đang đọc, ⬜ Chưa
- Bấm chapter → scroll tới đó

### Bước 5.3: Bookmarks
- Long press paragraph → "🔖 Bookmark"
- Lưu vào DB, hiện trong TOC Drawer tab "Bookmarks"
- Sync về PC khi push corrections

### Bước 5.4: Animations
- Page transitions: Library ↔ Reader (slide left/right)
- Skeleton shimmer khi loading chapters
- Smooth scroll-to-position khi restore reading position

### Bước 5.5: Double-Tap Hán Việt
- Double tap vào từ → lookup trong Dictionary (đã sync từ Desktop)
- Hiện tooltip: "con đường (原: 大道)"
- Dismiss khi chạm nơi khác

---

## 📊 EFFORT ESTIMATE

| Phase | Sessions | Complexity |
|-------|----------|------------|
| Phase 0 (Done) | ✅ | — |
| Phase 1: Sync + Library | 2-3 | 🟡 Medium (Rust server) |
| Phase 2: Reader Core | 2-3 | 🟢 Straightforward |
| Phase 3: Quick Edit | 2-3 | 🟡 Medium (touch events) |
| Phase 4: PWA | 1 | 🟢 Easy |
| Phase 5: Polish | 1-2 | 🟢 Fun |
| **TỔNG** | **8-12 sessions** | |

---

## ⚠️ QUY TẮC CHO ĐỆ TỬ NỘI MÔN

1. **Mỗi session chỉ làm 1 Phase** — Không nhảy phase.
2. **Kiểm tra tiêu chí trước khi chuyển phase** — Tất cả checkbox phải ✅.
3. **TypeScript strict** — Zero `any`, zero warning.
4. **Mobile-first** — Test trên viewport 390x844 (iPhone 14 size).
5. **KHÔNG thêm feature ngoài SPEC** — Nếu nảy ra ý hay, ghi vào Phase 5.
6. **Commit message format**: `feat(mobile-p{N}): mô tả ngắn`

---
*Bản thi công được phê duyệt bởi Tông chủ*
*Biên soạn: Nhị Trưởng lão Claude Opus*
*Ngày: 2026-02-11*
