# Agent Guidelines & Repository Rules

## Free Gifts Rules
- **New Free Gifts Ordering**: Whenever a new free gift listing is added, it must **ALWAYS be placed as the FIRST listing** (index 0) on the Free Gifts page (`/free-gifts`), in `data/free-gifts.json`, in `js/router.js` (`FREE_GIFTS_DATA`), and in the marquee on `index.html`.
- **Asset Size Limit**: Keep all files (especially PDFs and images) under **25 MiB** to strictly satisfy Cloudflare Pages upload limits.
- **ClickFunnels Validation**: Always check `response.ok` on `fetch()` calls to ClickFunnels and `/api/submit-free-gifts`. Ensure the specific item title (`gift_title`) is passed so ClickFunnels custom attributes record `last_unlocked_gift`.

## Blog Images Compression Rules
- **Mandatory Compression**: All blog post images in `assets/blog/` must ALWAYS be compressed to load fast / instantly. Never commit raw, uncompressed 1MB+ PNG files.
- **Specifications & Multi-Format**:
  - Dimensions: Maximum 1024x1024px.
  - Primary format: `.webp` (quality 82, target ≤ 100–120 KB) referenced in `data/articles.json`.
  - Fallbacks: `.jpg` (mozjpeg quality 82, target ≤ 120–150 KB for social crawlers and legacy browsers) and compressed `.png` (palette quantized, target ≤ 350–400 KB).
  - Both `.webp`, `.jpg`, and `.png` versions must always be saved side-by-side in `assets/blog/`.
- **Frontend Performance**: All blog post images in `js/hub.js` must use `<picture>` with WebP `<source>`, JPEG `<img>`, and enforce `loading="lazy"` and `decoding="async"`.

