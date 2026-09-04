# Cat Scroll

Parallax visual playground hien thi bo suu tap meo tu CATAAS API ket hop typography da phong cach voi chuyen dong scroll-linked parallax dua tren Motion (`motion/react`) va Tailwind CSS.

## Kien truc

```
o:/Funny/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .gitignore
└── src/
    ├── types/
    │   └── cat.ts
    ├── data/
    │   └── messages.ts
    ├── lib/
    │   ├── cataas.ts
    │   ├── gallery.ts
    │   └── imagePreloader.ts
    ├── hooks/
    │   └── useCats.ts
    ├── components/
    │   ├── CatGallery.tsx
    │   ├── CatImage.tsx
    │   ├── FloatingText.tsx
    │   ├── CustomScrollbar.tsx
    │   ├── LoadingGallery.tsx
    │   └── HeaderControls.tsx
    ├── styles/
    │   └── globals.css
    ├── __tests__/
    │   ├── cataas.test.ts
    │   ├── gallery.test.ts
    │   └── storage.test.ts
    ├── App.tsx
    └── main.tsx
```

## Cac Chuan Muc Production

1. **Tinh dung dan cua du lieu & Cam ket Load +20**:
   - `useCats` su dung React state/ref lam source-of-truth cho danh sach meo, dam bao khong bao gio bi mat du lieu khi `sessionStorage` bi vo hieu hoa hoac corrupt.
   - `fetchUniqueNewCats(existingIds, targetCount)` su dung retry loop voi tap ID cu, cam ket moi lan bam +20 se tang dung chinh xac 20 meo moi; neu sau maxRetries khong thu thap du se nem loi ro rang thay vi tra thieu.
   - Phan biet TimeoutError (8s), TypeError (mat ket noi mang) va HTTP errors. Hien thi Error State day du: full-page khi loi khoi dau, floating banner co `aria-live="assertive"` va nut Retry khi loi Load More.

2. **Toi uu Hinh anh & Bo nho**:
   - Khong con co che warm toan bo gallery gay lang phi RAM va bang thong.
   - Su dung responsive images qua `srcSet` va `sizes`, nạp anh 640px toi uu thay vi full-size goc.
   - Su dung Lookahead Preload 1000px qua `IntersectionObserver` de nap truoc anh cach viewport 1.5 man hinh.
   - Bounded in-memory cache toi da 80 anh de giai phong bo nho cho cac phien luot dai.
   - Ap dung `content-visibility: auto` va `contain-intrinsic-size: auto 1200px` cho cac cluster duoi fold.
   - Chi su dung `fetchPriority="high"` va `loading="eager"` cho cac anh trong viewport dau tien.
   - Ton trong `prefers-reduced-motion` vo hieu hoa parallax va animation doi voi nguoi dung nhay cam voi chuyen dong.

3. **Accessibility (A11y) & SEO**:
   - Khong an native scrollbar. `CustomScrollbar` dong vai tro quick-scrub progress indicator voi pointer hit-test 44px, do chieu cao bang ResizeObserver, throttle rAF, day du `role="scrollbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, ho tro phim mui ten, PageUp, PageDown, Home, End (respects reduced motion).
   - Moi button (`HeaderControls`, Summon button, Retry button, Dismiss button) deu dat tieu chuan touch target >= 44x44px va co `aria-label` ro rang.
   - Bo sung Skip Link (`Skip to main content`) o dau trang.
   - Duy nhat mot the `<h1>` cho tieu de chinh "HELLO", "BYEBYE" su dung `<h2>`.

4. **Kiem thu Tu dong (Vitest)**:
   - Bo unit test trong `src/__tests__/`:
     - Test `fetchUniqueNewCats` voi batching dedupe khi API tra trung.
     - Test `fetchUniqueNewCats` nem loi khi het retry ma khong du 20 anh.
     - Test xu ly TypeError va TimeoutError trong cataas service.
     - Test `buildGallerySequence` voi cac bien 0, 1, 9, 10, 60 anh.
     - Test `useCats` va storage phuc hoi thanh cong khi session cache bi hong JSON.
     - Test bounded preload cache.

## Lenh phat trien & Kiem thu

```bash
# Cai dat thu vien
npm install

# Chay dev server
npm run dev

# Chay unit test
npm test

# Kiem tra TypeScript types
npm run typecheck

# Build ban production
npm run build

# Preview ban build
npm run preview
```
