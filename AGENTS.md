# Agent Guidelines & Repository Rules

## Email Privacy & Storage Rules (Strict Constraint)
- **Zero Local/Browser Email Storage**: NEVER hold, save, or cache email addresses or contact form submissions locally or in browser storage (`localStorage`, `sessionStorage`, cookies, or client files).
- **ClickFunnels is Sole Database**: ClickFunnels is the sole database and system of record. All email captures are processed in memory and sent directly over secure HTTPS to Cloudflare serverless functions (`/api/...`), which relay them directly to ClickFunnels.
- **Zero Public Exposure**:
  - Never log email addresses or submission payloads to `console.log` or browser consoles.
  - Never prefill or retain emails in input fields from browser storage.
  - Clear email fields from the DOM immediately upon modal dismissal or successful submission.
  - Ensure all local purge routines remain active to immediately clear any legacy stored email keys (`free-gifts-saved-email`, `user-email`, `ms-form-*`).

## Free Gifts Rules
- **New Free Gifts Ordering**: Whenever a new free gift listing is added, it must **ALWAYS be placed as the FIRST listing** (index 0) on the Free Gifts page (`/free-gifts`), in `data/free-gifts.json`, in `js/router.js` (`FREE_GIFTS_DATA`), and in the marquee on `index.html`.
- **Asset Size Limit**: Keep all files (especially PDFs and images) under **25 MiB** to strictly satisfy Cloudflare Pages upload limits.
- **ClickFunnels Validation**: Always check `response.ok` on `fetch()` calls to ClickFunnels and `/api/submit-free-gifts`. Ensure the specific item title (`gift_title`) is passed so ClickFunnels custom attributes record `last_unlocked_gift`.
- **Mandatory Free Gifts Image Compression**:
  - All cover images, display artwork, and track thumbnails in `assets/free-gifts/` must ALWAYS be compressed to ensure instant page load speeds and fast Core Web Vitals.
  - Never commit raw, uncompressed 1MB+ PNG files.
  - Image specifications:
    - Dimensions: Maximum 1024x1024px (fit inside, preserving aspect ratio; track thumbnails max 800x800px).
    - Formats: High-performance `.webp` (quality 82, target ≤ 80–150 KB) and compressed `.png` / `.jpg` (palette quantized, target ≤ 150–380 KB) must be saved side-by-side.
    - Automation: Run `npm run compress:free-gifts` (`node scripts/compress-free-gifts.js`) whenever adding or updating free gift images.
    - Frontend: Free gifts templates in `js/router.js` must use `<picture>` with WebP `<source>`, fallback `<img>`, with `loading="lazy"` and `decoding="async"`.

## Blog Images Compression Rules
- **Mandatory Compression**: All blog post images in `assets/blog/` must ALWAYS be compressed to load fast / instantly. Never commit raw, uncompressed 1MB+ PNG files.
- **Specifications & Multi-Format**:
  - Dimensions: Maximum 1024x1024px.
  - Primary format: `.webp` (quality 82, target ≤ 100–120 KB) referenced in `data/articles.json`.
  - Fallbacks: `.jpg` (mozjpeg quality 82, target ≤ 120–150 KB for social crawlers and legacy browsers) and compressed `.png` (palette quantized, target ≤ 350–400 KB).
  - Both `.webp`, `.jpg`, and `.png` versions must always be saved side-by-side in `assets/blog/`.
- **Frontend Performance**: All blog post images in `js/hub.js` must use `<picture>` with WebP `<source>`, JPEG `<img>`, and enforce `loading="lazy"` and `decoding="async"`.

