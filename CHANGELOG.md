# Raiden Reader — Changelog

## v1.7.0 (2026-02-12)
### Reader Experience
- 📄 **Page-Turn Mode** (#31) — Chế độ lật trang (scroll-snap), tap cạnh trái/phải để lật
- 📐 **Margins Control** (#43) — Slider chỉnh lề trái/phải (8–48px)
- 📏 **Max Width** (#44) — Giới hạn chiều rộng văn bản trên màn hình lớn (0–1200px)
- 🅳 **Drop Cap Toggle** (#45) — Bật/tắt chữ cái đầu đoạn phóng to
- ✨ **Chapter Divider Variants** (#54) — 8 ký hiệu trang trí ngẫu nhiên (· · ·, ✦, ꕥ, ❖, ◆, ∗ ∗ ∗, ⁂, ❦)
- 🔄 **Reset Settings** (#46) — Nút khôi phục cài đặt mặc định
- 🇻🇳 **Improved Preview Text** (#47) — Văn bản mẫu tiếng Việt có dấu

### Library Enhancements
- 🔍 **Search Workspaces** (#38) — Tìm kiếm truyện theo tên (hiện khi >5 truyện)
- ☰/▦ **Grid/List View Toggle** (#40) — Chuyển đổi hiển thị lưới/danh sách
- 🗑 **Batch Delete** (#42) — Chế độ xóa nhiều truyện cùng lúc (tick + xác nhận)

### TOC & Navigation
- 🔢 **Chapter Jump Input** (#34) — Nhập số chương để nhảy nhanh (hiện khi >20 chương)

### Performance & Code Quality
- ⚡ **Memoized Paragraphs** (#58) — useMemo cho paragraph rendering, tránh tạo lại JSX
- 🧩 **SegmentedControl extracted** — Di chuyển ra module-level, tránh re-creation during render
- 🛡 **Storage Quota Warning** (#60) — Hiển thị dung lượng IndexedDB trong Settings

### Bug Fixes
- 🎨 Fixed SegmentedControl being created during render (lint error)
- 🧹 Removed unused DEFAULT_SETTINGS import
- ✅ All TypeScript + ESLint clean (trừ pre-existing useEffect warnings)

## v1.6.0 (2026-02-12)
### Features
- 📤 **Share Button** — Nút Share (Web Share API) trong Selection Bubble, bên cạnh Copy
- 🔥 **Night Light Filter** — Lớp phủ ánh sáng ấm amber, chỉnh cường độ trong Settings
- 📏 **Paragraph Spacing** — Slider điều chỉnh khoảng cách đoạn (0.5–2.5em)
- ☰ **Text Alignment** — Toggle Justify / Left align
- 🔀 **Sort Library** — Sắp xếp truyện theo Gần đây / A-Z
- 📳 **Haptic Feedback mở rộng** — Rung khi bật/tắt Zen Mode, đổi theme
- 🍞 **Toast System** — Hệ thống thông báo toast toàn cục (success/error/info) với auto-dismiss
- 🎛️ **Segmented Control** — Theme picker trong Settings đổi sang segmented control premium
- 👁️ **Live Preview** — Preview text trong Settings reflect đúng theme/font/alignment đang chọn
- 📊 **Chapter Progress %** — TOC hiện % đọc tại chương hiện tại
- 🛡️ **Error Boundary** — Bắt crash rendering → hiện recovery UI thay vì trắng xoá

### Bug Fixes
- 🐛 **isDark sai cho Forest/Slate** — isDark chỉ check 2 giá trị hardcode → đổi sang luminance calculation. Forest + Slate giờ đúng dark mode
- 🐛 **cycleTheme thiếu 2 theme** — Cycle chỉ 3 themes (dark→sepia→light), bỏ qua forest+slate. Giờ cycle đủ 5 themes
- 🐛 **Theme icon sai** — Navbar chỉ hiện 3 icon (🌙📜☀️), giờ hiện đúng icon cho forest (🌲) và slate (🌊)

## v1.5.0 (2026-02-12)
### Features
- 🧘 **Zen Mode** — Double-tap giữa màn hình để bật/tắt. Ẩn toàn bộ UI (progress bar, navbar, gradient, FAB). Fullscreen API ẩn luôn status bar Android
- 🌲 **Forest Theme** — Dark mode xanh lá (`#1A2A1A`) dịu mắt cho đọc đêm, accent xanh lá
- 🌊 **Slate Theme** — Dark mode navy (`#1E2A3A`) thay thế đen tuyệt đối, accent xanh dương
- 🔤 **2 Font mới** — Source Serif 4 (thanh mảnh, hiện đại) + Merriweather (dày, dễ đọc)
- 💬 **Hội thoại nghiêng** — Text trong dấu ngoặc kép `"..."` tự động in nghiêng (italic)

### Bug Fixes
- 🐛 **Font không đổi được** — Root cause: Google Fonts chưa bao giờ được load! Thêm preconnect + stylesheet cho tất cả 6 fonts
- 🔧 **Theme picker overflow** — Đổi layout từ flex row sang flex wrap cho 5 themes

### Refactor
- 🧹 **SyncDialog** — Tách God Component 403 dòng thành `useSync` hook + 7 sub-components + CSS file riêng

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
