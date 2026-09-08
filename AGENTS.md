# Agent Guidelines & Repository Rules

## Free Gifts Rules
- **New Free Gifts Ordering**: Whenever a new free gift listing is added, it must **ALWAYS be placed as the FIRST listing** (index 0) on the Free Gifts page (`/free-gifts`), in `data/free-gifts.json`, in `js/router.js` (`FREE_GIFTS_DATA`), and in the marquee on `index.html`.
- **Asset Size Limit**: Keep all files (especially PDFs and images) under **25 MiB** to strictly satisfy Cloudflare Pages upload limits.
- **ClickFunnels Validation**: Always check `response.ok` on `fetch()` calls to ClickFunnels and `/api/submit-free-gifts`. Ensure the specific item title (`gift_title`) is passed so ClickFunnels custom attributes record `last_unlocked_gift`.
