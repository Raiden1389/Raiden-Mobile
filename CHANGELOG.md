# Raiden Reader — Changelog

## v1.4.1 (2026-02-12)
### Bug Fixes
- 🔧 **TOC Jump Broken** — Fix: `TocDrawer` truyền `ch.id` nhưng `jumpToChapter` nhận `ch.order`. Khi id ≠ order → jump silent fail
- 🔧 **"Đọc tiếp" Black Screen** — Fix: `useInfiniteScroll` expand range từ IndexedDB (deprecated) thay vì localStorage. Chương > 5 không được load → đen xì
- 🔄 **Nút Cập Nhật PWA** — Fix: bấm "Kiểm tra cập nhật" giờ force SW check server thay vì chỉ apply update sẵn. Hiện ⏳ "Đang kiểm tra..." + alert khi đã mới nhất

## v1.4.0 (2026-02-12)
### Features
- 📚 **Library Sync** — Sync toàn bộ thư viện (tất cả workspaces) cùng một lúc thay vì từng truyện. Dialog hiển thị danh sách workspaces + chapter counts + progress tổng
- ✏️ **Auto-Correction** — Select text → bảng sửa lỗi tự hiện sau 400ms, không cần bấm FAB nhỏ xíu nữa. FAB vẫn giữ để mở tìm & thay thế trống

### Bug Fixes
- 🔧 **Continue Reading "Black Screen"** — Fix: saved position dùng `order` (stable qua sync) thay vì `id` (auto-increment, thay đổi mỗi lần sync). Bấm "Đọc tiếp" giờ về đúng vị trí
- 🔧 **Corrections Routing** — Fix: sửa lỗi workspace A giờ đẩy đúng về workspace A trên Desktop, không lẫn sang workspace khác

### Refactor
- 🧹 **Reader.tsx** — Giảm từ 306 → 232 dòng. Extract `useReadChapters` + `useTextCorrection` hooks. Reader giờ là pure orchestrator


## v1.3.0 (2026-02-11 23h51)
### Features
- 📜 **Auto-Scroll** — Nút 📜 trong navbar. Tap = tự cuộn chậm, hands-free. Bottom bar: speed slider 🐢↔🐇. Auto-stop khi hết chương
- 📐 **Landscape 2-Column** — Xoay ngang tablet/màn lớn (≥768px) → nội dung chia 2 cột tự động
- ✅ **TOC Read/Unread** — Track chính xác chương đã đọc bằng localStorage Set
- 🎯 **Pixel-Perfect Reading Memory** — Save `{ chapterId, ratio }`. Mở lại app → về đúng dòng. Font size thay đổi vẫn đúng

### PWA Polish
- 🔒 **Wake Lock** — Màn hình không tắt khi đọc. Auto re-acquire khi switch tab
- 🌑 **No-Flash Theme** — Inline script set bg trước React mount. Không flash trắng khi mở dark mode
- 🟢 **Offline Indicator** — Badge nhỏ ở Library header: 🟢 online / 🔴 Offline (pulse animation)
- 🌫️ **Gradient Fades** — Top (40px) + Bottom (60px) gradient fade mềm mại, text không bị cắt cụt
- 📜 **Hidden Scrollbar** — Scrollbar ẩn trong reader, viewport sạch sẽ
- 📖 **Continue Reading Card** — Card nổi bật ở Library: tên truyện đang đọc + % progress + tap để resume
- 🔔 **Sync Toast** — Toast "✅ Đã cập nhật N chương" sau sync thành công, auto-hide 3s
- 📱 **Status Bar Color Sync** — meta theme-color tự động theo reader theme (đã có từ trước)

---

## v1.2.0 (2026-02-11 23h23)
### Features
- 🔄 **Pull-to-Refresh** — Kéo xuống ở Library khi ở đầu trang → hiện indicator ↓ → mở Sync dialog. Natural touch gesture
- 📝 **Correction History** — Trang mới `/corrections`: xem tất cả sửa lỗi đã gửi/chưa gửi. Filter theo trạng thái (pending/pushed) và theo truyện. Hiện old→new text, time ago, chapter, scope, nút xoá
- 📝 **Menu link** — Thêm "Lịch sử sửa lỗi" vào dropdown menu ⋮
- 🆕 **New Chapter Alert** — Sau sync, nếu có chương mới → badge xanh "🆕 +N" trên cover card. Tap vào truyện = tự clear badge. Track qua `syncMeta.prevChapterCount`

---

## v1.1.0 (2026-02-11 23h12)
### UI Redesign
- 🎨 **Header redesign** — Gom 2 nút (Sync + ↑PC) vào menu ⋮ dropdown glassmorphism. Header clean hơn, chỉ title + stats + nút ⋮
- 🔴 **Pending indicator** — Chấm đỏ nhỏ trên nút ⋮ khi có corrections chưa gửi
### Refactor
- 🧹 **Library.tsx tách file** — 352→160 dòng. Extract `LibraryHeader`, `PushStatusBar`, `EmptyState` ra components riêng

---

## v1.0.5 (2026-02-11 23h08)
### Bug Fixes
- 📊 **Card progress** — Fix hiện `220/220` thay vì `23/220`. Root cause: so sánh `chapterId` (DB id) với `chapter.order` → tất cả match. Fix: so sánh với `chapter.id` + đọc từ localStorage thay vì IndexedDB
### Removed
- 📳 **Haptic feedback** — Bỏ rung (`navigator.vibrate`) khi chuyển chương

---

## v1.0.4 (2026-02-11 23h04)
### Bug Fixes
- 🐛 **Restore position fix (lần 3)** — `getSavedChapterId()` trả `null` vì localStorage key mới (`raiden-lastChapter-*`) chưa có data. Fix: thêm migration fallback đọc từ IndexedDB `readingProgress` cũ → migrate sang localStorage mới

---

## v1.0.3 (2026-02-11 23h00)
### Refactor
- � **Rewrite useReadingPosition** — Bỏ hoàn toàn IndexedDB async. Chuyển sang **localStorage only** (sync, instant). Save chapterId mỗi 300ms throttle. Loại bỏ race condition giữa 2 hook async

---

## v1.0.2 (2026-02-11 22h56)
### Bug Fixes
- 🐛 **Restore position fix (lần 2)** — Tách logic: `getSavedChapterId()` chỉ trả chapterId, Reader.tsx gọi `jumpToChapter()` để expand loadedRange + retry scroll. Trước đó 2 hook (useReadingPosition + useInfiniteScroll) cùng đọc DB cùng lúc → race condition
- 🐛 **Unmount save** — Cleanup lưu chapterId vào IndexedDB ngay (fire-and-forget) thay vì chỉ localStorage scrollTop

---

## v1.0.1 (2026-02-11 22h50)
### Features
- 🏷️ **Build ID** — Thêm `BUILD_ID` hiện ngày giờ build cạnh version (`v1.0.1 (11/02 22h50)`) để dễ xác nhận bản đang chạy trên điện thoại
### Bug Fixes
- 📖 **TOC jump instant** — Đổi `scrollIntoView({ behavior: 'smooth' })` → `'auto'` (instant). Thêm retry loop (15 attempts × rAF) cho trường hợp chapter chưa render khi expand loadedRange

---

## v1.0.0 (2026-02-11 22h47)
### Features
- 🏷️ **Version display** — Header Library hiện `vX.Y.Z` cạnh stats (`1 truyện · 220 chương đã tải`)
- 🆕 **Update banner** — Service Worker detect bản mới → hiện banner xanh "🆕 Có bản cập nhật mới!" + nút **Cập nhật**. Dùng `onNeedRefresh` callback từ `vite-plugin-pwa`
- � **TOC jump** — `jumpToChapter()` expand `loadedRange` nếu chương chưa render, set `pendingJumpRef`, retry scroll sau render
### Bug Fixes
- � **Restore position fix (lần 1)** — Pre-expand `loadedRange` khi mount: đọc `readingProgress` từ IndexedDB → tìm chapter index → expand range TRƯỚC khi restore scroll. Fix bug luôn về chương 5 do chỉ có 5 chương render

---

## v0.x (pre-changelog)
### Core
- PWA reader với infinite scroll (lazy load 5 chương, auto-expand khi scroll)
- Table of Contents (TOC) drawer
- Sync từ PC qua HTTP/Cloudflare tunnel
- 3 themes: Dark, Sepia, Light
- Reading position tracking (IndexedDB `readingProgress` + localStorage `scrollTop`)
- Workspace cards với auto-generated geometric cover art
- Push-back corrections (sửa lỗi dịch) về PC
- Service Worker (Workbox generateSW) cho offline reading
- Page transitions với animation
- Dimmer overlay cho đọc ban đêm
- Swipe-back gesture navigation
- Navbar auto-hide khi scroll
