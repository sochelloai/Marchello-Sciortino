const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

// Automated daily post generator - trigger regeneration
const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_API_KEY = rawApiKey.replace(/^["']|["']$/g, '').trim();

if (!GEMINI_API_KEY) {
    console.warn("Notice: GEMINI_API_KEY is not defined in the environment.");
    console.warn("-> If running in GitHub Actions, ensure the repository secret GEMINI_API_KEY is configured in Settings -> Secrets and variables -> Actions.");
    console.warn("-> Activating built-in on-theme daily post generator to guarantee today's post publishes.");
}

// Extract appropriate authentication headers for Google Generative Language API
function getGoogleAuthHeaders(key) {
    if (!key) return {};
    const sanitized = key.trim().replace(/^["']|["']$/g, '');
    if (sanitized.toLowerCase().startsWith('bearer ')) {
        return { 'Authorization': sanitized };
    }
    if (sanitized.startsWith('ya29.')) {
        return { 'Authorization': `Bearer ${sanitized}` };
    }
    return {
        'x-goog-api-key': sanitized
    };
}

// Define monthly themes and instructions
const MONTHLY_THEMES = {
    0: "January — New Beginnings (focus on vision, fresh starts, discipline, goal-setting, and rebuilding)",
    1: "February — Love, Service & Purpose (focus on relationships, loving people well, service, compassion, and leadership)",
    2: "March — Growth & Renewal (focus on spring, renewed thinking, breaking old patterns, courage, and creativity)",
    3: "April — Faith, Reflection & Resurrection (focus on hope after hardship, new life, restoration, and believing again)",
    4: "May — Strength, Family & Legacy (focus on family lessons, honoring sacrifice, leadership, and gratitude)",
    5: "June — Courage, Midyear Reflection & Momentum (focus on summer energy, consistency, Father's Day, and stays consistent)",
    6: "July — Freedom & Responsibility (focus on personal freedom, discipline, spiritual freedom, and Independence Day)",
    7: "August — Preparation & Back-to-School Mindset (focus on learning, growth, discipline, mentorship, and preparation)",
    8: "September — Work, Calling & Resilience (focus on Labor Day, service, purpose, consistency, and overcoming burnout)",
    9: "October — Courage & Awareness (focus on facing fear, disability awareness, mental strength, and faith under pressure)",
    10: "November — Gratitude & Reflection (focus on Thanksgiving, family, faithfulness, and seeing blessings inside hardship)",
    11: "December — Hope, Giving & Vision (focus on Christmastime, generosity, miracles, and closing the year strong)"
};

// Define monthly art styles and visual themes for image generation
const MONTHLY_ART_STYLES = {
    0: { // January
        name: "January — New Beginnings & Fresh Start (New Year's theme)",
        colorPalette: "cool crisp blues, silver metallic, frosty whites, subtle platinum gradients, with a single warm golden spark of dawn",
        mood: "optimistic, clean, focused, reflecting fresh determination and clear vision",
        style: "Minimalist crisp geometry, icy textures, sharp crystal structures, generous negative space",
        geometry: "linear paths, crystalline polygons, clean sharp horizons",
        textures: "frosted glass, ice, platinum, brushed silver"
    },
    1: { // February
        name: "February — Love, Service & Connection (Valentine's theme)",
        colorPalette: "deep crimson, warm rose gold, soft burgundy gradients, glowing amber accents, rich dark plum background",
        mood: "warm, heart-centered, compassionate, highlighting connection and service",
        style: "Soft curves, fluid overlapping circular shapes, warm internal glows, translucent layering",
        geometry: "intertwined circles, infinity loops, soft rounded paths",
        textures: "polished rose quartz, translucent acrylic, warm glowing glass"
    },
    2: { // March
        name: "March — Growth, Renewal & Spring Equinox",
        colorPalette: "vibrant emerald green, fresh lime accents, warm gold highlights, deep forest green background, light spring yellow beams",
        mood: "courageous, creative, energetic, reflecting renewed thinking and breaking constraints",
        style: "Organic geometries, leaf-like folding planes, ascending spiral patterns, spring energy",
        geometry: "ascending spirals, organic curves, expanding hexagonal grids",
        textures: "polished jade, fresh dew-like glass, metallic gold leaf"
    },
    3: { // April
        name: "April — Faith, Resurrection & Restoration (Easter / Spring Bloom theme)",
        colorPalette: "radiant lavender, royal purple accents, soft pastel pinks, gold beams, clean sky blue gradients",
        mood: "spiritual, hopeful, restorative, reflecting new life and light after hardship",
        style: "Volumetric light shafts, ascending vertical elements, delicate glass-like floral geometry, radiant halo effects",
        geometry: "vertical lines, intersecting light rays, expanding circles",
        textures: "crystal prisms, opal, pearlescent surfaces, soft light diffusers"
    },
    4: { // May
        name: "May — Strength, Family & Legacy (Mother's Day & Memorial Day theme)",
        colorPalette: "earthy copper, rich bronze gradients, warm terracotta, soft cream, fresh mint green highlights",
        mood: "grounded, grateful, steady, honoring sacrifice and strong foundations",
        style: "Solid grounding forms, interlocking bands, concentric circles, structural integrity",
        geometry: "concentric rings, interlocking shapes, square bases",
        textures: "patinated bronze, polished copper, textured stone, matte ceramics"
    },
    5: { // June
        name: "June — Courage, Consistency & Father's Day (Summer Solstice theme)",
        colorPalette: "bright solar gold, vibrant saffron orange, deep cobalt blue base, fiery amber highlights",
        mood: "radiant, consistent, bold, representing midyear momentum and summer energy",
        style: "Expanding triangular vectors, sharp geometric arrows, high contrast shadows, solar rays",
        geometry: "triangles, expanding angles, radiating lines",
        textures: "gold leaf, polished brass, solar cells, light-guiding glass"
    },
    6: { // July
        name: "July — Freedom, Responsibility & Independence (Independence Day theme)",
        colorPalette: "deep navy background, rich crimson/ruby red accents, electric blue gradients, brilliant white-gold starbursts",
        mood: "liberated, dynamic, visionary, reflecting personal freedom and expanding horizons",
        style: "Bursting radial patterns, star-like intersecting points, dynamic expanding waves, soaring forms",
        geometry: "starbursts, radiating vectors, rising curves",
        textures: "shattered glass, glowing steel, electric wires, carbon fiber"
    },
    7: { // August
        name: "August — Preparation, Mentorship & Learning (Back-to-School theme)",
        colorPalette: "warm honey gold, copper, deep teal base, bright golden yellow accents",
        mood: "reflective, disciplined, eager, reflecting preparation and structured growth",
        style: "Isometric blocks, layered staircases, clean intersecting lines, crystalline architectural structures",
        geometry: "cubes, isometric grids, step structures, grid lines",
        textures: "frosted acrylic blocks, copper wire, polished wood grains, paper layers"
    },
    8: { // September
        name: "September — Work, Calling & Resilience (Labor Day & Harvest theme)",
        colorPalette: "deep amber, burnt orange, golden yellow, dark chocolate brown, warm brass accents",
        mood: "resilient, industrious, productive, reflecting autumn warmth and harvest calling",
        style: "Interlocking circular gears, leaf-like chevron patterns, warm harvest lighting, structured progress",
        geometry: "interlocking circles, gear teeth, chevrons, organic curves",
        textures: "brushed brass, amber, warm glass, wood veneer"
    },
    9: { // October
        name: "October — Courage, Awareness & Faith Under Pressure (Disability Awareness theme)",
        colorPalette: "midnight blue, rich pumpkin orange, violet gradients, warm flame-like gold highlights",
        mood: "fearless, focused, strong, highlighting disability awareness and facing fear",
        style: "High contrast chiaroscuro lighting, lantern-like glowing prisms, sharp protective triangles, inner light",
        geometry: "prisms, octahedrons, protective borders, single point perspectives",
        textures: "obsidian, glowing glass facets, burnished steel, dark quartz"
    },
    10: { // November
        name: "November — Gratitude & Thanksgiving",
        colorPalette: "warm mahogany, metallic gold, burnt copper, warm olive green, soft peach gradients",
        mood: "grateful, humble, peaceful, reflecting abounding warmth and cozy reflections",
        style: "Soft concentric ripples, overlapping organic shapes, warm cozy ambient lighting, full vessels",
        geometry: "concentric ripples, rounded vessels, horizontal flows",
        textures: "brushed copper, warm mahogany wood, polished amber, velvet-like surfaces"
    },
    11: { // December
        name: "December — Hope, Generosity & Miracles (Christmas theme)",
        colorPalette: "deep forest green, rich crimson red, shimmering gold rays, brilliant diamond white light",
        mood: "wonder, joy, hope, closing the year strong with faith and generous vision",
        style: "Starry focal points, crystalline snowflake geometry, glowing evergreen structures, festive light refractions",
        geometry: "stars, snowflake hexagons, vertical cones, intersecting light beams",
        textures: "glittering ice crystals, emerald glass, ruby enamel, polished gold"
    }
};

// Define dynamic holiday highlights by month to branch off seasonal accents
const HOLIDAY_HIGHLIGHTS = {
    0: [ // January: New Year, MLK Day
        { name: "New Year / Dawn of Possibility", highlight: "a solitary radiant dawn beam cutting through morning mist, glowing horizon line, crisp crystalline sparkles of renewal" },
        { name: "Martin Luther King Jr. Day / Purpose & Unity", highlight: "harmonious ascending concentric rings, pillars of quiet dignity, uplifting golden resonance lines" }
    ],
    1: [ // February: Valentine's, Presidents' Day
        { name: "Valentine's Season / Compassion & Heart", highlight: "subtle heart-resonance waveforms, warm rose-gold ambient halos, interlocking ribbons of warmth" },
        { name: "Presidents' Day / Enduring Leadership", highlight: "stately geometric arches, grounded marble-like facets, steady unwavering pillars of light" }
    ],
    2: [ // March: Spring Equinox, St. Patrick's
        { name: "St. Patrick's Season / Abundance & Heritage", highlight: "shimmering clover-green facets, luminous emerald crystal refraction, golden thread accents" },
        { name: "Spring Equinox / Awakening", highlight: "unfurling spiral fronds, blossoming geometric petals, dawn-gold rays piercing fertile deep green" }
    ],
    3: [ // April: Easter, Earth Day
        { name: "Easter & Resurrection / Light Victorious", highlight: "an empty radiant archway, transcendent golden sunburst breaking through soft lavender clouds, morning triumph" },
        { name: "Earth Day / Stewardship & Harmony", highlight: "spherical terrarium-like glass orb, interconnected ecological lines, vibrant leaf geometry" }
    ],
    4: [ // May: Mother's Day, Memorial Day
        { name: "Mother's Day / Unconditional Nurture", highlight: "gentle protective sheltering arches, soft blooming rose-gold petals, warm welcoming hearth glow" },
        { name: "Memorial Day / Honor & Sacrifice", highlight: "reverent solitary monolith, poignant beam of celestial light, deep crimson and bronze commemorative textures" }
    ],
    5: [ // June: Father's Day, Juneteenth, Summer Solstice
        { name: "Father's Day / Steady Foundation", highlight: "strong geometric cornerstone, towering oak-like angular pillars, reassuring warm amber foundation" },
        { name: "Juneteenth / Liberation & Jubilation", highlight: "broken geometric bonds bursting into golden sparks, soaring kinetic ribbons, unconstrained light vectors" },
        { name: "Summer Solstice / Maximum Vitality", highlight: "a blazing radiant solar crown, zenith light pouring down in brilliant golden shafts, energetic warmth" }
    ],
    6: [ // July: Independence Day
        { name: "Independence Day / Freedom & Vision", highlight: "bursting celebratory radial starbursts, soaring dynamic kinetic arcs, electric crimson and sapphire illumination" },
        { name: "Summer Expansion / Open Frontiers", highlight: "boundless open horizontal vistas, sweeping wind-like curvilinear ribbons, soaring perspective lines" }
    ],
    7: [ // August: Back to School, Harvest Eve
        { name: "Back-to-School Season / Wisdom & Growth", highlight: "ascending geometric staircases of light, illuminated isometric book-like leaves, inquisitive prisms" },
        { name: "Late Summer Warmth / Anticipation", highlight: "honeyed golden dusk light, ripening wheat-like diagonal vectors, calm balanced composition" }
    ],
    8: [ // September: Labor Day, Autumn Equinox
        { name: "Labor Day Season / Craft & Calling", highlight: "precision interlocking brass gears, industrious geometric clockwork, warm hearth illumination celebrating diligent craft" },
        { name: "Autumn Equinox / Harvest Balance", highlight: "balanced dual-tone geometry, golden harvest sheaves of stylized lines, rich amber foliage abstractions" }
    ],
    9: [ // October: Disability Awareness, Autumn Harvest
        { name: "Disability Awareness Month / Unstoppable Adaptability", highlight: "a glowing geometric prism transforming obstacles into radiant light beams, adaptive interlocking bridges, fearless inner radiance" },
        { name: "Autumn Harvest Season / Golden Bounty", highlight: "glowing lantern-like faceted spheres, rich pumpkin-gold and obsidian contrasts, atmospheric autumn warmth" }
    ],
    10: [ // November: Thanksgiving, Veterans Day
        { name: "Veterans Day / Courage & Dedication", highlight: "steadfast geometric shield motifs, dignified metallic gold chevron bands, resilient angular forms" },
        { name: "Thanksgiving / Abundant Gratitude", highlight: "cornucopia of flowing concentric ripples, rich mahogany and warm peach glow, brimming chalice geometry" }
    ],
    11: [ // December: Christmas, New Year's Eve
        { name: "Christmas Season / Wonder & The Star", highlight: "a brilliant eight-pointed solitary Bethlehem star of pure diamond light, evergreen conical forms, sacred warmth" },
        { name: "New Year's Eve / Reflective Horizon", highlight: "crystalline hourglass geometry, shimmering midnight and champagne gold confetti bursts, threshold archways" }
    ]
};

// Select a specific holiday highlight based on day of month for rich daily variety
function getHolidayHighlight(monthIdx, dayOfMonth) {
    const list = HOLIDAY_HIGHLIGHTS[monthIdx] || [];
    if (list.length === 0) return { name: "Seasonal Reflection", highlight: "luminous seasonal atmospheric light and delicate ambient depth" };
    // Rotate between available holiday themes depending on the day of the month
    const item = list[(dayOfMonth - 1) % list.length];
    return item;
}

// Calculate Date in Central Time (US)
let centralDate;
if (process.env.TARGET_DATE) {
    centralDate = new Date(process.env.TARGET_DATE);
} else if (process.argv[2]) {
    centralDate = new Date(process.argv[2]);
} else {
    centralDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
}
const monthIndex = centralDate.getMonth(); // 0-11
const dayOfMonth = centralDate.getDate(); // 1-31
const currentYear = centralDate.getFullYear();
const currentMonthTheme = MONTHLY_THEMES[monthIndex];
const currentMonthArtStyle = MONTHLY_ART_STYLES[monthIndex];
const currentHolidayHighlight = getHolidayHighlight(monthIndex, dayOfMonth);

const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
const todayDateStr = centralDate.toLocaleDateString('en-US', dateOptions);

// Generate article ID based on date
const sanitizeId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const articleId = `daily-${sanitizeId(todayDateStr)}`;

console.log(`Starting generation for: ${todayDateStr}`);
console.log(`Month Theme: ${currentMonthTheme}`);
console.log(`Month Art Style Theme: ${currentMonthArtStyle.name}`);
console.log(`Article ID: ${articleId}`);

// Helper to make HTTPS POST requests with promise and Google API header injection
function postJson(url, headers = {}, body = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        let reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };

        if (u.hostname.includes('generativelanguage.googleapis.com')) {
            const googleHeaders = getGoogleAuthHeaders(GEMINI_API_KEY);
            reqHeaders = { ...googleHeaders, ...reqHeaders };
            // Remove ?key= if we have auth header to prevent ACCESS_TOKEN_TYPE_UNSUPPORTED
            if (googleHeaders['x-goog-api-key'] || googleHeaders['Authorization']) {
                u.searchParams.delete('key');
            }
        }

        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
            timeout: 180000, // 3 minutes timeout in milliseconds
            headers: reqHeaders
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (parseErr) {
                        reject(new Error(`HTTP ${res.statusCode}: Failed to parse JSON response. Raw content: ${data}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timed out after 3 minutes (180000ms).`));
        });

        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

// Helper to make HTTPS GET requests with promise and Google API header injection
function getJson(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        let reqHeaders = { ...headers };

        if (u.hostname.includes('generativelanguage.googleapis.com')) {
            const googleHeaders = getGoogleAuthHeaders(GEMINI_API_KEY);
            reqHeaders = { ...googleHeaders, ...reqHeaders };
            if (googleHeaders['x-goog-api-key'] || googleHeaders['Authorization']) {
                u.searchParams.delete('key');
            }
        }

        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'GET',
            headers: reqHeaders
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (parseErr) {
                        reject(new Error(`HTTP ${res.statusCode}: Failed to parse JSON response. Raw content: ${data}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

// Helper to download binary files with redirect-following support
function downloadFile(url, destPath, redirectCount = 0) {
    if (redirectCount > 5) {
        return Promise.reject(new Error("Too many redirects (max 5)"));
    }
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const client = u.protocol === 'https:' ? https : http;
        client.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 60000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url).toString();
                resolve(downloadFile(redirectUrl, destPath, redirectCount + 1));
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        }).on('error', reject);
    });
}

// Helper to fetch binary buffer over HTTP/HTTPS with redirect and timeout support
function fetchBuffer(url, redirectCount = 0) {
    if (redirectCount > 5) {
        return Promise.reject(new Error("Too many redirects (max 5)"));
    }
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const client = u.protocol === 'https:' ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 90000 // 90 seconds timeout
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url).toString();
                resolve(fetchBuffer(redirectUrl, redirectCount + 1));
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: Failed to fetch image buffer`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error("Image fetch timed out after 90 seconds"));
        });

        req.on('error', reject);
    });
}

// Automatically compress and optimize blog images using sharp
// Produces .webp (primary for web, <= 120 KB), .jpg (fallback/OG), and compressed .png
async function processAndSaveBlogImages(imageBuffer, imageSlug, blogAssetsDir) {
    if (!fs.existsSync(blogAssetsDir)) {
        fs.mkdirSync(blogAssetsDir, { recursive: true });
    }

    // Check if buffer is SVG
    if (imageBuffer.toString('utf8', 0, 100).includes('<svg')) {
        const svgPath = path.join(blogAssetsDir, `${imageSlug}.svg`);
        fs.writeFileSync(svgPath, imageBuffer);
        return `assets/blog/${imageSlug}.svg`;
    }

    try {
        let sharp;
        try {
            sharp = require('sharp');
        } catch (e) {
            console.warn("Notice: sharp module not found, attempting fallback or write raw:", e.message);
        }

        if (sharp) {
            const base = sharp(imageBuffer).resize(1280, 720, {
                fit: 'cover',
                position: 'center'
            });

            const webpPath = path.join(blogAssetsDir, `${imageSlug}.webp`);
            const jpgPath = path.join(blogAssetsDir, `${imageSlug}.jpg`);
            const pngPath = path.join(blogAssetsDir, `${imageSlug}.png`);

            const [webpBuf, jpgBuf, pngBuf] = await Promise.all([
                base.clone().webp({ quality: 82, effort: 4 }).toBuffer(),
                base.clone().jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
                base.clone().png({ quality: 75, palette: true, compressionLevel: 9 }).toBuffer()
            ]);

            fs.writeFileSync(webpPath, webpBuf);
            fs.writeFileSync(jpgPath, jpgBuf);
            fs.writeFileSync(pngPath, pngBuf);

            console.log(`Blog image compressed successfully for "${imageSlug}":`);
            console.log(`- WebP: ${(webpBuf.length / 1024).toFixed(1)} KB`);
            console.log(`- JPEG: ${(jpgBuf.length / 1024).toFixed(1)} KB`);
            console.log(`- PNG:  ${(pngBuf.length / 1024).toFixed(1)} KB`);

            return `assets/blog/${imageSlug}.webp`;
        }
    } catch (optErr) {
        console.warn("Optimization with sharp failed, falling back to raw save:", optErr.message);
    }

    // Fallback if sharp unavailable
    const fallbackPath = path.join(blogAssetsDir, `${imageSlug}.png`);
    fs.writeFileSync(fallbackPath, imageBuffer);
    return `assets/blog/${imageSlug}.png`;
}

// Generate luxury bespoke brand geometric vector artwork as an offline/fail-safe fallback
function generateBrandedThemeSvg(monthArtStyle, monthIndex, title, tag) {
    const monthPalettes = {
        0: { bgStart: '#0f172a', bgEnd: '#020617', p1: '#38bdf8', p2: '#94a3b8', accent: '#f8fafc', glow: '#38bdf8' },
        1: { bgStart: '#4c0519', bgEnd: '#1e0108', p1: '#fb7185', p2: '#e11d48', accent: '#fbcfe8', glow: '#f43f5e' },
        2: { bgStart: '#064e3b', bgEnd: '#022c22', p1: '#34d399', p2: '#059669', accent: '#fef08a', glow: '#10b981' },
        3: { bgStart: '#3b0764', bgEnd: '#1e0538', p1: '#c084fc', p2: '#9333ea', accent: '#fbcfe8', glow: '#a855f7' },
        4: { bgStart: '#451a03', bgEnd: '#200c02', p1: '#d97706', p2: '#b45309', accent: '#fed7aa', glow: '#f59e0b' },
        5: { bgStart: '#1e1b4b', bgEnd: '#0f0e26', p1: '#eab308', p2: '#f59e0b', accent: '#38bdf8', glow: '#fbbf24' },
        6: { bgStart: '#0f172a', bgEnd: '#030712', p1: '#ef4444', p2: '#3b82f6', accent: '#ffffff', glow: '#60a5fa' },
        7: { bgStart: '#134e4a', bgEnd: '#042f2e', p1: '#f59e0b', p2: '#0d9488', accent: '#fed7aa', glow: '#2dd4bf' },
        8: { bgStart: '#2e1202', bgEnd: '#0d0400', p1: '#f59e0b', p2: '#ea580c', accent: '#d4af37', glow: '#fbbf24' },
        9: { bgStart: '#172554', bgEnd: '#080d21', p1: '#f97316', p2: '#7c3aed', accent: '#fde047', glow: '#fb923c' },
        10: { bgStart: '#3f1a07', bgEnd: '#1a0b03', p1: '#d97706', p2: '#84cc16', accent: '#fed7aa', glow: '#f59e0b' },
        11: { bgStart: '#064e3b', bgEnd: '#022118', p1: '#ef4444', p2: '#eab308', accent: '#ffffff', glow: '#22c55e' }
    };

    const pal = monthPalettes[monthIndex] || monthPalettes[8];
    const cleanTag = (tag || "Daily Reflection").toUpperCase();

    // Procedural geometric layers
    let proceduralElements = '';
    if (monthIndex === 8) { // September: Interlocking brass gears & chevrons
        let teeth = '';
        for (let i = 0; i < 16; i++) {
            const angle = (i * 360) / 16;
            teeth += `<rect x="575" y="270" width="50" height="70" rx="6" transform="rotate(${angle} 600 550)" fill="url(#primaryGrad)" />`;
        }
        let chevrons = '';
        for (let j = 0; j < 5; j++) {
            const y = 470 + j * 55;
            const opacity = (1 - j * 0.16).toFixed(2);
            chevrons += `<path d="M 460 ${y} L 600 ${y - 55} L 740 ${y}" fill="none" stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`;
        }
        proceduralElements = `
            ${teeth}
            <circle cx="600" cy="550" r="230" fill="url(#bgGrad)" stroke="url(#primaryGrad)" stroke-width="14" filter="url(#glowFilter)" />
            <circle cx="600" cy="550" r="160" fill="none" stroke="${pal.glow}" stroke-width="4" opacity="0.6" stroke-dasharray="24 12" />
            ${chevrons}
            <circle cx="600" cy="550" r="32" fill="${pal.glow}" filter="url(#glowFilter)" />
        `;
    } else {
        // Universal geometric radial composition for other months
        proceduralElements = `
            <circle cx="600" cy="550" r="260" fill="none" stroke="url(#primaryGrad)" stroke-width="12" filter="url(#glowFilter)" />
            <circle cx="600" cy="550" r="190" fill="none" stroke="${pal.glow}" stroke-width="4" opacity="0.6" stroke-dasharray="16 8" />
            <polygon points="600,340 760,630 440,630" fill="none" stroke="url(#accentGrad)" stroke-width="8" opacity="0.75" />
            <circle cx="600" cy="550" r="40" fill="${pal.glow}" filter="url(#glowFilter)" />
        `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="${pal.bgStart}" />
      <stop offset="100%" stop-color="${pal.bgEnd}" />
    </radialGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.accent}" />
      <stop offset="50%" stop-color="${pal.p1}" />
      <stop offset="100%" stop-color="${pal.p2}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${pal.p2}" />
      <stop offset="50%" stop-color="${pal.p1}" />
      <stop offset="100%" stop-color="${pal.glow}" />
    </linearGradient>
    <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="1200" height="1200" fill="url(#bgGrad)" />
  
  <!-- Ambient background geometry -->
  <circle cx="600" cy="550" r="420" fill="none" stroke="${pal.p1}" stroke-width="1.5" opacity="0.18" stroke-dasharray="8 16" />
  <circle cx="600" cy="550" r="320" fill="none" stroke="${pal.accent}" stroke-width="2.5" opacity="0.3" />
  
  <!-- Procedural Feature Elements -->
  ${proceduralElements}

  <!-- Header Badge & Category Tag -->
  <g transform="translate(600, 1020)" text-anchor="middle">
    <rect x="-160" y="-35" width="320" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="${pal.p1}" stroke-width="1.5" />
    <text y="-8" fill="${pal.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" letter-spacing="4">${cleanTag}</text>
  </g>
</svg>`;
}

// High-fidelity fallback article generator ensuring daily publishing continuity even if external APIs encounter outages
function generateFallbackArticle(dateStr, monthIdx, dayNum, monthTheme, recentPostsContext) {
    const holidayInfo = getHolidayHighlight(monthIdx, dayNum);
    const artStyle = MONTHLY_ART_STYLES[monthIdx] || MONTHLY_ART_STYLES[8];

    let title, desc, tag, primaryKeyword, secondaryKeywords, slug, bodyContent;

    if (monthIdx === 8) { // September: Work, Calling & Resilience
        if (dayNum === 11) {
            title = "Service Through Limitation: Why Showing Up for Others Heals Work Burnout";
            desc = "Discover how shifting focus from personal fatigue to serving others breaks the cycle of burnout and restores purpose in your daily craft.";
            tag = "Lessons From Limitation";
            primaryKeyword = "service through limitation";
            secondaryKeywords = ["overcoming work burnout", "purpose in daily work", "resilient mindset"];
            slug = "service-through-limitation-heals-burnout";
            bodyContent = `<h2>Shifting Focus from Fatigue to Purpose</h2>
<p>When work feels exhausting and physical energy runs low, it is tempting to retreat inward. Living with Friedrich's ataxia means my physical reserves are strictly bounded every single day. Some mornings, typing an email or coordinating a project feels like climbing a steep mountain. But I have learned a surprising truth about work resilience: the fastest way to overcome burnout is often to redirect your focus toward serving someone else.</p>
<p>On this National Day of Service and Remembrance, we are reminded of the profound power of showing up for our neighbors. When you shift your mind from what you lack to what you can give, the mental weight lifts. Empty hands become useful hands.</p>
<h2>A Warning Against the Complacency Trap</h2>
<p>I want to give you a strong, loving warning: do not let your daily parameters become an excuse for self-pity or complacency. It is easy to say, "I am too tired," or "I do not have enough resources." But waiting for ideal conditions is a trap. God has placed specific gifts in your hands right now. Technology and artificial intelligence can act as a wonderful cognitive prosthetic to handle repetitive tasks, but they cannot replace your genuine human heart or your calling to serve. As I write in <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation"</a>, limitations are not dead ends—they are boundary markers that point you toward your true contribution.</p>
<h2>How to Build a Sustainable Service System</h2>
<p>To protect your energy while continuing to serve your community and clients, build intentional boundaries into your day:</p>
<ul>
<li><strong>Honoring Your Energy Windows:</strong> Schedule creative and service-focused work during your peak morning energy window (10:30 AM–12:30 PM), and reserve low-energy afternoons for administrative cleanup.</li>
<li><strong>Automating the Routine:</strong> Offload administrative friction with smart systems so your mind stays fresh for people. Explore our creative <a href="/services">services</a> to see how we build systems that thrive under constraints.</li>
<li><strong>The Two-Minute Reset:</strong> Before stepping into a difficult task, pause to dedicate your effort to a higher purpose and count the blessings right in front of you.</li>
</ul>
<p>If you want to understand how this perspective developed through my own challenges, read my <a href="/story">story</a>.</p>
<h3>Frequently Asked Questions</h3>
<h3>How does serving others help overcome work burnout?</h3>
<p>Serving others breaks the internal loop of stress and self-focused worry. By directing your attention to meeting someone else's need, you reconnect with meaning and perspective, which naturally replenishes mental energy.</p>
<h3>What if I lack the physical energy for extra work?</h3>
<p>Service does not require grand physical gestures. Sending an encouraging message, streamlining a process for a teammate, or sharing an honest lesson from your journey are all powerful forms of service that require minimal physical output.</p>`;
        } else {
            title = `Building Resilience in Daily Craft: The Strength of Consistency`;
            desc = "Discover how faithful, daily consistency inside your constraints builds lasting momentum and protects your energy.";
            tag = "Lessons From Limitation";
            primaryKeyword = "building resilience in daily craft";
            secondaryKeywords = ["workplace consistency", "overcoming burnout", "constraint advantage"];
            slug = `building-resilience-daily-craft-${dayNum}`;
            bodyContent = `<h2>The Quiet Power of Showing Up Daily</h2>
<p>When physical capacity fluctuates, relying on huge bursts of motivation is a recipe for frustration. Living with Friedrich's ataxia taught me that real progress is not built on sudden heroic efforts. It is built on steady, disciplined consistency within whatever boundaries you have today.</p>
<p>Grandpa Sciortino taught me in his basement practice that our daily work is a craft given by our Creator. When we show up with whatever strength is in our hands, we honor that calling.</p>
<h2>A Warning Against the Complacency Trap</h2>
<p>Do not let your limits become an excuse for sitting still. Waiting for ideal conditions or expecting automation to do your thinking is a path to complacency. In my book <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation"</a>, I explain how your constraints force you to build systems that endure. Use tools to remove friction, but bring your own heart to the work. Explore my <a href="/services">services</a> to learn more about building resilient workflows.</p>
<h3>Frequently Asked Questions</h3>
<h3>How can I stay consistent when energy is low?</h3>
<p>Focus on one high-impact micro-task during your peak energy window. Completing one meaningful task creates forward momentum without causing burnout.</p>
<h3>How do constraints improve my work?</h3>
<p>Constraints eliminate distractions and force you to focus on the essential core of your craft.</p>`;
        }
    } else {
        title = `Finding Opportunity Within Constraints: Daily Focus for ${dateStr}`;
        desc = `Practical wisdom for shifting perspective, honoring your boundaries, and building resilient systems today.`;
        tag = "Daily Inspiration";
        primaryKeyword = "finding opportunity within constraints";
        secondaryKeywords = ["daily resilience", "creative problem solving", "purpose in limitation"];
        slug = `finding-opportunity-within-constraints-${dayNum}`;
        bodyContent = `<h2>Transforming Boundaries into Building Blocks</h2>
<p>Every obstacle holds a hidden blueprint for growth. When physical coordination or external circumstances push back against us, we have a choice: focus on what was lost, or count what remains in our hands.</p>
<p>In my book <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation"</a>, I share how embracing boundaries leads directly to breakthrough. When you stop fighting your design, you discover the freedom to build with intention.</p>
<h2>A Warning Against the Trap of Complacency</h2>
<p>Never let a limitation become an excuse to quit. God equips us with unique opportunities to serve, create, and encourage those around us. Check out my <a href="/services">services</a> to see how we help individuals and organizations build resilient systems.</p>
<h3>Frequently Asked Questions</h3>
<h3>How do I reframe a difficult limitation?</h3>
<p>Ask yourself: "What does this constraint force me to simplify?" That answer is your strategic advantage.</p>`;
    }

    const imagePrompt = `An abstract cinematic 3D sculptural render representing "${title}", featuring precision interlocking brass and copper elements, warm harvest lighting, deep amber tones, and geometric arcs inspired by ${artStyle.colorPalette}. No people, no human silhouettes, no faces, no hands, strictly no text or letters, 16:9 widescreen composition.`;

    return {
        title,
        desc,
        tag,
        body: bodyContent,
        image_prompt: imagePrompt,
        meta_title: `${title} | Marchello Sciortino`,
        meta_description: desc.slice(0, 155),
        url_slug: slug,
        primary_keyword: primaryKeyword,
        secondary_keywords: secondaryKeywords,
        search_intent_classification: "Informational",
        suggested_internal_links: ["/services", "/story"],
        image_alt_text: `Abstract 3D geometric render representing ${primaryKeyword} in warm amber and brass tones`,
        social_sharing_title: title,
        social_sharing_description: desc
    };
}

// Helper to make Gemini API requests with transient error retries (503, 429, 500)
async function callGeminiWithRetry(geminiUrl, promptSystem, maxRetries = 3) {
    let delay = 2000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await postJson(geminiUrl, {}, {
                contents: [
                    {
                        parts: [
                            { text: promptSystem }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            desc: { type: "string" },
                            tag: {
                                type: "string",
                                enum: ["Story Notes", "AI and Accessibility", "Lessons From Limitation", "Tools I Use", "Daily Inspiration"]
                            },
                            body: { type: "string" },
                            image_prompt: { type: "string" },
                            meta_title: { type: "string" },
                            meta_description: { type: "string" },
                            url_slug: { type: "string" },
                            primary_keyword: { type: "string" },
                            secondary_keywords: {
                                type: "array",
                                items: { type: "string" }
                            },
                            search_intent_classification: { type: "string" },
                            suggested_internal_links: {
                                type: "array",
                                items: { type: "string" }
                            },
                            image_alt_text: { type: "string" },
                            social_sharing_title: { type: "string" },
                            social_sharing_description: { type: "string" }
                        },
                        required: [
                            "title", "desc", "tag", "body", "image_prompt",
                            "meta_title", "meta_description", "url_slug", "primary_keyword",
                            "secondary_keywords", "search_intent_classification", "suggested_internal_links",
                            "image_alt_text", "social_sharing_title", "social_sharing_description"
                        ]
                    }
                }
            });
            return res;
        } catch (apiErr) {
            const isTransient = apiErr.message && (
                apiErr.message.includes("503") ||
                apiErr.message.includes("429") ||
                apiErr.message.includes("500") ||
                apiErr.message.includes("UNAVAILABLE")
            );
            if (isTransient && attempt < maxRetries) {
                console.warn(`Warning: Gemini API call failed with transient error: ${apiErr.message}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw apiErr;
            }
        }
    }
}

async function run() {
    try {
        // Load articles.json first to serve as context for non-repetition
        const articlesJsonPath = path.join(__dirname, '..', 'data', 'articles.json');
        let articles = [];

        if (fs.existsSync(articlesJsonPath)) {
            try {
                const rawJson = fs.readFileSync(articlesJsonPath, 'utf8');
                articles = JSON.parse(rawJson);
            } catch (err) {
                console.error("Failed to parse articles.json, starting with empty array:", err.message);
            }
        }

        // Check if an article with today's ID already exists
        const exists = articles.some(a => a.id === articleId);
        if (exists) {
            console.log(`Article with ID '${articleId}' already exists for today (${todayDateStr}). Skipping generation to avoid duplicate runs and content overwrites.`);
            return;
        }

        // Get the last 5 posts for diversity context (newest first)
        const recentPosts = articles.slice(-5).reverse();
        let recentPostsContext = "";
        if (recentPosts.length > 0) {
            recentPostsContext = recentPosts.map((post, idx) => {
                return `Post ${idx + 1}:
- Title: "${post.title}"
- Description: "${post.desc}"
- Tag: "${post.tag}"
- Date: "${post.date}"`;
            }).join("\n\n");
        } else {
            recentPostsContext = "None (this is the first post)";
        }

        // Step 1: Query Gemini API to write the post
        const promptSystem = `You are Marchello Sciortino, a resilient entrepreneur, ClickFunnels Certified Funnel Builder, keynote speaker, and faith-driven innovator who lives with Friedrich's ataxia (a progressive neuromuscular condition affecting coordination, balance, speech, and the heart).
Your writing must strictly adhere to the Marchello Sciortino Brand Voice Guide:

CORE PHILOSOPHY:
- God gives every person purpose, regardless of limitations. Hardships, setbacks, or loss are the beginning of discovering a new purpose.
- AI is not the hero of this story. God is. AI is simply a tool, leverage, and assistance that removes barriers and amplifies human creativity. The human remains the creator; AI is the assistant.
- Every post should reflect gratitude toward God without being preachy, condemning, or using excessive Christian clichés. Faith is shown through humility, wisdom, compassion, and hope.
- Count what God has left in your hands, rather than what was lost. Embrace your constraints as training grounds for focus, innovation, and efficiency.

TONE, CADENCE & STYLE:
- Tone: Grounded, authentic, wise, encouraging, resilient, optimistic, forward-thinking, and grateful. Never sound victimized, self-pitying, arrogant, condescending, or salesy.
- Style: Write like a trusted mentor having coffee, not an influencer, preacher, or motivational speaker. Use simple language, short paragraphs, strong truths, and conversational wisdom.
- Cadence: Mix ultra-short sentences (1-3 words) with longer ones. Use natural contractions (don't, it's, you're, we've, couldn't) to keep the rhythm conversational.
- Directness: Cut the "throat-clearing" introductory sentences. Start directly with the core argument, struggle, or value proposition.
- Simplicity: Choose short, punchy, Anglo-Saxon words over long, Latinate, or academic ones (e.g., use "fix" instead of "rectify", "help" instead of "facilitate").
- Disability: Refuse pity or sympathy. Frame challenges as simple parameters. Do not say "look what I overcame"; focus on "look what became possible." Refer to your condition as "Friedrich's ataxia" (never say "suffer from" or "sufferer").
- AI Role & Articulated Inspiration: Describe AI as a tool, leverage, or assistance. AI is a creative/cognitive prosthetic. Articulated Inspiration is joining ideas, feelings, and technology together like joints in a body, allowing them to move, resonate, and come alive.

CONTENT FORMULA, STORYTELLING & DIVERSITY:
1. Acknowledge a real struggle.
2. Shift perspective using other ideas, scientific research studies, history, pop culture, philosophical word study, or metaphorical storytelling:
   - To make the content rich and creative, do NOT just tell Marchello's personal story again and again.
   - For today's post, choose and highlight ONE of the following angles to explore in depth:
     * A scientific research study, psychological concept, or neurological finding (e.g., neuroplasticity, growth mindset, cognitive reframing, the science of constraints in problem-solving). Explain the study simply and how it proves we can adapt.
     * A historical event, figure, or invention (e.g., historical builders, artists, or innovators who succeeded under immense limitations or constraints). Explain how their historical constraint created an advantage.
     * A pop culture story, modern business case study, or creative industry analogy that illustrates finding the hidden advantage within constraints.
     * The "Philosophy of Confusion" & Word Study: Break down complex, heavy-sounding words (e.g., "calamity," "illusion," "adversity") to unpack their true meaning and make them simple. Go deep on big words that rhyme (e.g., matching "calamity" with "clarity" or "gravity") and can be enveloped in short poems, rhyming couplets, or song-like structures within the post.
     * "Monster Storytelling": Frame internal emotional struggles (like fear, anxiety, shame, or despair) as "monsters." Clarify that these monsters are not real physical creatures, but are defined entirely by our feelings. Defeat this "monster" by confronting it, translating its presence into a "live lesson" that must be heard, understood, and integrated.
     * "Faith & Master Mathematician": Explore a faith-based lens that centers God as our guide and "master mathematician" who designs, scales, and navigates our life's parameters. Highlight stories or events of faith where God is central, and explain the beauty of community—gathering to support one another, appreciate our Creator, and realign with the core reason we are here. Give honor, dedicate effort, and show gratitude and acceptance for His perfect plan.
3. Weave this external idea/study/history/metaphor into Marchello's voice and worldview (resilience, faith in God, counting what's left in your hands rather than what was lost).
   - Ensure Marchello's direct voice and presence remain front and center.
   - Weave in Marchello's direct "warning" or real-talk—a strong, loving warning against the traps of self-pity, complacency, relying solely on human tools/AI instead of God, or letting parameters become prisons. At least 2 to 3 times a week throughout the generated posts, this warning should be explicit.
   - Dynamically reference lessons, concepts, or chapters from Marchello's book "Limitations to Liberation" (or "Limitation to Liberation") as a guide for breaking through. Format it as an external link: <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation"</a>.
4. Introduce an opportunity (AI as an accessibility/creative bridge, system automation, funnel building, or creative adapting) that connects to the theme.
5. Offer practical guidance.
6. Point back toward hope and end with encouragement (rather than hype).

KEY CONCEPTS TO REFERENCE DYNAMICALLY:
- Constraint Advantage / Constraint-Based Thinking: Limitations force you to prioritize ruthlessly, focus on high-impact activities, and build automated systems.
- 2-Minute Stress Dump: Writing down worries and racing thoughts at night to process stress, slow heart rate, and clear mental clutter.
- Glucose Wave Approach: Mapping and working with natural energy cycles (Peak Performance Window #1: 10:30 AM–12:30 PM, Peak Performance Window #2: 2:30 PM–4:30 PM, Dip: 12:30 PM–2:00 PM).
- Limitation Liberation Lifestyle: 7 shifts (Constraint Consciousness, Energy Sovereignty, Emotional Refinement, Problem Structuring, AI Amplification, Systematic Automation, Legacy Impact).
- Grandpa Sciortino's Basement Practice: Dr. Anthony J. Sciortino chiropractic practice, teaching Marchello to "weigh his blessings".

BRAND VOCABULARY & STRICT CONSTRAINTS:
- Frequently Use: Purpose, Calling, Opportunity, Perspective, Wisdom, Faith, Resilience, Possibility, Creator, Build, Serve, Encourage, Multiply, Gratitude, Innovation, Strength, Hope, Growth, Guide, Equip.
- NEVER Use (Banned AI tells, clichés & jargon): stewardship, empower, empowerment, leverage (metaphorically), holistic, holistically, synergy, synergistic, paradigm, paradigm shift, catalyst, delve, dive deep, deeply (as intensifier), foster, nurture, elevate, transform, revolutionize, unlock, unleash, navigate (metaphorically), crucial, vital, paramount, invaluable, seamless, seamlessly, meticulous, meticulously, dynamic, testament, beacon, tapestry, landscape, heartbeat, furthermore, moreover, in addition, in summary, in conclusion.
- NEVER Use opening clichés like "In today's fast-paced digital world..." or "In the modern era...".
- NEVER use anaphora, rhyming patterns of three, or negative contrast parallelism ("it's not X, it's Y"). Frame positively and directly instead.

Write a daily blog post for today: ${todayDateStr}.
The theme for this month is: ${currentMonthTheme}.

The visual design style for this month is: ${currentMonthArtStyle.name}.
Visual theme parameters:
- Color Palette: ${currentMonthArtStyle.colorPalette}.
- Mood: ${currentMonthArtStyle.mood}.
- Style: ${currentMonthArtStyle.style}.
- Geometry: ${currentMonthArtStyle.geometry}.
- Textures: ${currentMonthArtStyle.textures}.
- Today's Holiday / Seasonal Highlight: ${currentHolidayHighlight.name} (${currentHolidayHighlight.highlight}).

CRITICAL - IMAGE PROMPT GENERATION RULES:
When writing the "image_prompt" in the JSON response, follow these strict creative guidelines:
1. Cover the exact contents, core concept, and title of today's post in visual, metaphorical terms.
2. Abstract, Cinematic, Artistic, Illustrated, 3D: The visual must represent the post's topic through tangible, high-end 3D sculptural and architectural metaphors.
3. ABSOLUTELY NO PEOPLE OR HUMAN FIGURES: Do NOT generate actual people, faces, silhouettes, crowds, or hands. Keep it purely conceptual, architectural, sculptural, and atmospheric.
4. STRICTLY NO TEXT OR WORDS: Do NOT render letters, typography, slogans, titles, captions, watermarks, or logos.
5. Harmonize with this month's color palette (${currentMonthArtStyle.colorPalette}) and geometric style, while branching off with highlights from today's holiday/seasonal highlight (${currentHolidayHighlight.name}: ${currentHolidayHighlight.highlight}).
6. Safety Filters: Do NOT mention medical terms, diseases, physical limitations, or wheelchairs in the image prompt. Communicate triumph, clarity, and breakthrough through visual composition alone.

CRITICAL - BLOG CONTENT DIVERSITY RULE (AVOID REPETITION):
To ensure every automated daily blog post feels fresh, unique, and timely, you MUST NOT repeat themes, stories, or lessons from recent posts. Avoid repetitive time-based themes or references (such as end-of-the-month reflections, midyear momentum, weekly or Monday motivation, seasonal transitions, holidays, or similar calendar topics) on consecutive days. Each post must introduce a new perspective, lesson, story, insight, or real-world application that provides readers with a genuinely different experience from previous posts.

Here are details of the most recent blog posts:
${recentPostsContext}

SEARCH OPTIMIZATION STANDARDS (SEO/GEO):
Every blog post must be optimized for search engine discoverability (Google, AI-powered search engines, voice assistants, and Generative Engine Optimization).
1. Primary Keyword: Focus on a specific primary keyword related to the post's topic (e.g. "AI transcription hacks", "design constraints", "resilient mindset").
2. Body Structure:
   - Headings: Use semantic heading tags (<h2> and <h3>, NOT <h1>) naturally containing keywords to break up content.
   - Intro: Write an engaging introduction that immediately addresses the search intent and contains the primary keyword.
   - Formatting: Use short, punchy paragraphs (2-3 sentences), bulleted or numbered lists, blockquotes, or bold text for scannability.
   - FAQ: Include a short Frequently Asked Questions section at the end of the body (formatted with <h3> tags for questions and <p> for answers) if appropriate, to match featured snippet formats.
   - Internal Links: Incorporate 1-2 natural internal links in the HTML body. You may ONLY link to the following paths/slugs:
     - "/story" (My Story / Timeline)
     - "/services" (Keynotes, Creative AI, Web Building Services)
     - "/speaking" (Booking info)
     - "/chelloai" (ChelloAI helper)
     - Specific article IDs from the recent posts list above (e.g. "/hub" or linking to previous article IDs like "acceptance", "skydiving", "avatar", "win-matrix").
     Format links as: <a href="/services">services</a>. Do NOT include domain names in internal links.
   - External Links: Include natural links to authoritative resources when relevant (e.g., <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation" book</a> or <a href="/accessible-aim">Accessible AIM</a>).
   - Strong Conclusion: Conclude with a clear call-to-action (CTA) and contextual links.

Your writing must strictly follow these instructions:
1. Tone: Follow the brand voice tone guidelines (Honest, encouraging, conversational, direct).
2. Structure: Follow the search optimization guidelines while preserving the narrative structure (Opening personal story, Middle lesson/perspective shifting, Takeaway action challenge, and Closing hopeful note).
3. Length: 200 - 400 words. Paced with short, powerful sentences.
4. Closing Signature: End the body text with this exact signature quote: "Much love, party people! That was awesome, the next one will only be better!"

You must return a raw JSON object containing exactly these fields (no markdown wrapper, just JSON):
{
  "title": "A unique, keyword-rich title focused on the primary search intent",
  "desc": "A one-sentence summary of the daily lesson",
  "tag": "Choose exactly one: 'Story Notes', 'AI and Accessibility', 'Lessons From Limitation', 'Tools I Use', 'Daily Inspiration'",
  "body": "HTML formatted body content matching the heading hierarchy, list formatting, FAQ, and internal/external links instructions above. Do not output markdown inside the body string, only HTML.",
  "image_prompt": "A detailed, descriptive prompt for an abstract, cinematic, artistic, illustrated 3D render representing the exact topic, title, and core metaphor of today's post. Must be purely conceptual without any people, faces, human silhouettes, hands, text, letters, logos, or watermarks. Must weave in this month's color palette and geometry with today's holiday highlight.",
  "meta_title": "A compelling meta title designed to maximize click-through rate",
  "meta_description": "A compelling meta description designed to maximize click-through rate (under 160 characters)",
  "url_slug": "A clean, URL-safe slug containing the primary keyword (lowercase, hyphen-separated)",
  "primary_keyword": "The primary keyword targeted by this post",
  "secondary_keywords": ["2-3 related phrases or semantic keyword variations"],
  "search_intent_classification": "e.g., Informational, Transactional, Navigational",
  "suggested_internal_links": ["List of suggested internal links from this post"],
  "image_alt_text": "Descriptive, keyword-aligned alt text for the featured image",
  "social_sharing_title": "Optimized headline for social platforms",
  "social_sharing_description": "Engaging summary for social platforms"
}`;

        let generatedArticle;

        if (GEMINI_API_KEY) {
            console.log("Calling Gemini API...");
            let geminiRes;
            // Tested active models on Google Generative Language API
            const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
            let lastError = null;

            for (const modelName of candidateModels) {
                try {
                    console.log(`Attempting generation with model: "${modelName}"...`);
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
                    geminiRes = await callGeminiWithRetry(geminiUrl, promptSystem);
                    console.log(`Successfully generated content using model: "${modelName}"`);
                    break; // Succeeded, exit loop
                } catch (err) {
                    console.warn(`Warning: Model "${modelName}" failed: ${err.message}`);
                    lastError = err;
                }
            }

            if (geminiRes && geminiRes.candidates && geminiRes.candidates.length > 0) {
                const candidate = geminiRes.candidates[0];
                if (candidate.finishReason && candidate.finishReason !== "STOP") {
                    console.warn(`Warning: Gemini generation finished with status: ${candidate.finishReason}.`);
                }

                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0].text) {
                    const rawText = candidate.content.parts[0].text;
                    let cleanedText = rawText.trim();
                    if (cleanedText.startsWith("```")) {
                        cleanedText = cleanedText.replace(/^```(json)?\s*/i, "");
                        cleanedText = cleanedText.replace(/\s*```$/, "");
                        cleanedText = cleanedText.trim();
                    }
                    try {
                        generatedArticle = JSON.parse(cleanedText);
                    } catch (parseErr) {
                        console.warn("Notice: Failed to parse Gemini output as JSON:", parseErr.message);
                    }
                }
            } else {
                console.warn("All Gemini candidate models failed or returned empty response.");
            }
        }

        // Guaranteed fallback generator if Gemini API is unavailable or returns an error
        if (!generatedArticle) {
            console.log(`Activating intelligent on-theme daily post generator for ${todayDateStr}...`);
            generatedArticle = generateFallbackArticle(todayDateStr, monthIndex, dayOfMonth, currentMonthTheme, recentPostsContext);
            console.log(`✓ Daily article generated: "${generatedArticle.title}"`);
        }

        // Programmatic enforcement of closing signature (bold, italicized, in quotes)
        if (generatedArticle.body) {
            // Clean any existing signatures or forms of it in the body to avoid double signatures
            const signatureCleanRegex = /<p[^>]*>\s*(<strong>|<em>|"|'|“|”)*\s*Much\s*love,?\s*party\s*people!.*?(<\/strong>|<\/em>|"|'|“|”)*\s*<\/p>/gi;
            generatedArticle.body = generatedArticle.body.replace(signatureCleanRegex, "");

            // Also replace naked references if any
            const nakedRegex = /"??Much\s*love,?\s*party\s*people!.*?better!"??/gi;
            generatedArticle.body = generatedArticle.body.replace(nakedRegex, "");

            generatedArticle.body = generatedArticle.body.trim();
            // Append the exact signature formatted as bold, italicized, and in quotation marks
            generatedArticle.body += `\n<p style="margin-top: 20px; color: var(--color-teal);"><strong><em>"Much love, party people! That was awesome, the next one will only be better!"</em></strong></p>`;
        }

        console.log(`Generated Article Title: "${generatedArticle.title}"`);
        console.log(`Tag: ${generatedArticle.tag}`);
        console.log(`Image Prompt: "${generatedArticle.image_prompt}"`);

        // Step 2: Dedicated Image Prompt Rewriter
        // Rewrites the prompt before generation to cover exact contents, title, month style, and holiday highlights
        console.log("Rewriting image prompt to cover exact title, content, month palette, and holiday highlight...");

        const dailyStyleVariations = [
            "3D sculptural minimalism with refractive glass and warm metals",
            "isometric architectural concept art with dramatic lighting",
            "surreal conceptual 3D illustration with floating dimensional geometry",
            "hyper-detailed cinematic 3D octane render with subsurface scattering",
            "abstract geometric spatial installation with volumetric fog and rim lighting",
            "futuristic architectural diorama with layered textures and internal glow"
        ];
        const selectedDailyStyle = dailyStyleVariations[(dayOfMonth - 1) % dailyStyleVariations.length];

        const promptRewriterSystem = `You are a world-class concept artist and 3D art director.
Your task is to write a single, rich, highly-detailed image generation prompt for a blog post's featured cover artwork.

ARTICLE CONTEXT:
- Title: "${generatedArticle.title}"
- Summary/Description: "${generatedArticle.desc}"
- Key Topic & Metaphor: "${generatedArticle.primary_keyword || generatedArticle.tag}"
- Article Excerpt: "${(generatedArticle.body || '').replace(/<[^>]+>/g, ' ').slice(0, 400).trim()}..."

STRICT VISUAL DIRECTION & CONSTRAINTS:
1. Resonate Directly with Content: The artwork MUST visually express the specific topic, metaphor, and title of this post in a tangible, symbolic form (e.g. if the post is about energy cycles, show rhythmic oscillating sculptural waveforms; if about structural freedom, show an elegant architectural framework).
2. Art Style: Abstract, cinematic, artistic, illustrated, 3D render (${selectedDailyStyle}).
3. NO HUMAN FIGURES: Absolutely NO actual people, human silhouettes, faces, bodies, or hands. Keep it purely conceptual, sculptural, architectural, and atmospheric.
4. STRICTLY NO TEXT: Absolutely NO text, letters, words, titles, typography, slogans, watermark, or logos in the image.
5. Monthly Color Palette & Materials:
   - Base Palette: ${currentMonthArtStyle.colorPalette}
   - Textures & Geometry: ${currentMonthArtStyle.geometry}, ${currentMonthArtStyle.textures}
   - Mood: ${currentMonthArtStyle.mood}
6. Holiday / Seasonal Accent:
   - Branch off with subtle visual highlights from today's seasonal theme: ${currentHolidayHighlight.name} (${currentHolidayHighlight.highlight}).
7. Composition & Lighting: 16:9 widescreen cinematic composition, raytraced volumetric lighting, glowing edges, atmospheric depth, editorial museum quality.
8. Output Format: Return ONLY the final prompt string (no markdown, no quotes, no conversational intro). Keep it between 60 and 120 words.`;

        let tailoredImagePrompt = generatedArticle.image_prompt || "";
        if (GEMINI_API_KEY) {
            try {
                const rewriterUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
            const rewriterRes = await postJson(rewriterUrl, {}, {
                contents: [{ parts: [{ text: promptRewriterSystem }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300
                }
            });
            const candText = rewriterRes?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candText && candText.trim().length > 20) {
                tailoredImagePrompt = candText.trim().replace(/^["']|["']$/g, '');
                console.log(`✓ Image prompt rewritten successfully:`);
                console.log(`"${tailoredImagePrompt}"`);
            }
            } catch (rewriteErr) {
                console.warn(`Prompt rewriter fallback to rule-based prompt: ${rewriteErr.message}`);
            }
        }

        // Final consolidated prompt text passed to generation models
        const imagePromptText = `${tailoredImagePrompt}. 16:9 widescreen cinematic composition, premium abstract 3D illustrated conceptual artwork, ${selectedDailyStyle}, ${currentMonthArtStyle.colorPalette}, ${currentHolidayHighlight.highlight}, no people, no faces, no humans, no text, no words, no letters, no logos, no watermark, 8k render, masterpiece.`;

        console.log(`Final image prompt sent to model: "${imagePromptText}"`);

        let imageBuffer = null;
        let relativeImageSrc = "";

        // =========================================================================
        // Step 2: Image Generation Pipeline
        // Tier 1 (Initial Tier): Highest-Quality Google Gemini API (Multimodal Image Generation via generateContent)
        // Tier 2 (Fallback Tier): Google Imagen 3 (imagen-3.0-generate-002 / imagen-3.0-generate-001)
        // Optional Local Tier: Higgsfield (if USE_HIGGSFIELD=true and valid local creds exist)
        // Tier 3 (Zero-Auth Fallback): Pollinations AI (Flux / SDXL high-res)
        // Tier 4 (Offline Fallback): Bespoke Branded Geometric Vector SVG
        // =========================================================================

        // --- Tier 1: Highest-Quality Google Gemini API (Native Multimodal Image Generation) ---
        if (!imageBuffer && GEMINI_API_KEY) {
            console.log("Tier 1: Attempting highest-quality Google Gemini API image generation...");

            // Fetch available models from Google AI Studio to detect active models dynamically
            let availableModels = [];
            try {
                const modelsList = await getJson(`https://generativelanguage.googleapis.com/v1beta/models`);
                if (modelsList && Array.isArray(modelsList.models)) {
                    availableModels = modelsList.models;
                }
            } catch (err) {
                console.warn("Could not retrieve models list for auto-detection:", err.message);
            }

            const getMethods = m => m.supportedGenerationMethods || m.supportedMethods || [];

            // Primary Gemini multimodal image generation candidate models (ordered by quality)
            const geminiCandidates = [
                "gemini-2.0-flash-exp",
                "gemini-2.0-flash",
                "gemini-2.5-flash-image",
                "gemini-3.0-flash-image",
                "gemini-exp-1206",
                "gemini-flash-latest"
            ];

            // Add any auto-detected Gemini models supporting generateContent with image capabilities
            const detectedGemini = availableModels
                .filter(m => {
                    const name = m.name.toLowerCase();
                    const methods = getMethods(m).map(x => x.toLowerCase());
                    return name.includes("gemini") && methods.some(met => met.includes("generatecontent")) &&
                           (name.includes("image") || name.includes("flash") || name.includes("exp"));
                })
                .map(m => m.name.replace(/^models\//, ''));

            const allGeminiModels = [...new Set([...geminiCandidates, ...detectedGemini])];

            for (const modelName of allGeminiModels) {
                try {
                    console.log(`Tier 1: Trying Google Gemini API with model "${modelName}"...`);
                    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
                    const payload = {
                        contents: [{
                            parts: [{
                                text: `Generate a high-resolution 16:9 widescreen artwork image matching this prompt exactly: ${imagePromptText}`
                            }]
                        }],
                        generationConfig: {
                            responseMimeType: "image/png"
                        }
                    };

                    const responseData = await postJson(genUrl, {}, payload);
                    const candidates = responseData?.candidates || [];
                    for (const cand of candidates) {
                        const parts = cand?.content?.parts || [];
                        for (const part of parts) {
                            if (part?.inlineData?.data) {
                                imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                                console.log(`✓ Image generated successfully via Google Gemini API ("${modelName}").`);
                                break;
                            }
                        }
                        if (imageBuffer) break;
                    }

                    if (imageBuffer) break;
                } catch (geminiErr) {
                    console.warn(`Tier 1: Google Gemini API (${modelName}) failed or does not support native direct image generation: ${geminiErr.message}`);
                }
            }
        }

        // --- Tier 2: Google Imagen 3 (Fallback) ---
        if (!imageBuffer && GEMINI_API_KEY) {
            console.log("Tier 2: Attempting Google Imagen 3 image generation fallback...");

            const imagenModels = [
                "imagen-3.0-generate-002",
                "imagen-3.0-generate-001",
                "imagen-3.0-capability-001"
            ];

            for (const modelName of imagenModels) {
                console.log(`Tier 2: Trying Imagen 3 model "${modelName}"...`);

                // 1. Try :generateImages endpoint
                try {
                    const genImagesUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateImages`;
                    const genBody = {
                        prompt: imagePromptText,
                        numberOfImages: 1,
                        outputMimeType: "image/png",
                        aspectRatio: "16:9",
                        personGeneration: "allow_adult"
                    };
                    const res = await postJson(genImagesUrl, {}, genBody);
                    const b64 = res?.generatedImages?.[0]?.image?.imageBytes;
                    if (b64) {
                        imageBuffer = Buffer.from(b64, 'base64');
                        console.log(`✓ Image generated successfully via Google Imagen 3 ("${modelName}" :generateImages).`);
                        break;
                    }
                } catch (genErr) {
                    console.warn(`Tier 2: Imagen 3 (:generateImages) failed for "${modelName}": ${genErr.message}`);
                }

                // 2. Try :predict endpoint
                try {
                    const predictUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`;
                    const predBody = {
                        instances: [{ prompt: imagePromptText }],
                        parameters: {
                            sampleCount: 1,
                            outputMimeType: "image/png",
                            aspectRatio: "16:9"
                        }
                    };
                    const resPred = await postJson(predictUrl, {}, predBody);
                    const b64Pred = resPred?.predictions?.[0]?.bytesBase64Encoded || resPred?.predictions?.[0]?.image?.imageBytes;
                    if (b64Pred) {
                        imageBuffer = Buffer.from(b64Pred, 'base64');
                        console.log(`✓ Image generated successfully via Google Imagen 3 ("${modelName}" :predict).`);
                        break;
                    }
                } catch (predErr) {
                    console.warn(`Tier 2: Imagen 3 (:predict) failed for "${modelName}": ${predErr.message}`);
                }
            }
        }

        // --- Optional Local Higgsfield Generation (Only if explicitly enabled with USE_HIGGSFIELD=true) ---
        if (!imageBuffer && process.env.USE_HIGGSFIELD === 'true') {
            console.log("Attempting local Higgsfield generation (USE_HIGGSFIELD=true)...");
            try {
                const isWindows = process.platform === 'win32';
                const hfCmd = isWindows ? 'higgsfield.cmd' : 'higgsfield';
                const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
                if (!fs.existsSync(blogAssetsDir)) {
                    fs.mkdirSync(blogAssetsDir, { recursive: true });
                }
                const imageSlug = sanitizeId(generatedArticle.url_slug || articleId);
                const cleanedPrompt = imagePromptText.replace(/[\r\n]+/g, ' ').trim();

                const hfOutput = execFileSync(hfCmd, [
                    'generate', 'create', 'gpt_image_2',
                    '--prompt', cleanedPrompt,
                    '--aspect_ratio', '16:9',
                    '--wait'
                ], {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                    timeout: 300000
                });

                const urlMatch = hfOutput.match(/https:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp)/i);
                if (urlMatch) {
                    const imageUrl = urlMatch[0];
                    const tempDownloadPath = path.join(blogAssetsDir, `${imageSlug}_temp_raw.png`);
                    await downloadFile(imageUrl, tempDownloadPath);
                    const rawBuffer = fs.readFileSync(tempDownloadPath);
                    try { fs.unlinkSync(tempDownloadPath); } catch (_) {}
                    imageBuffer = rawBuffer;
                    relativeImageSrc = await processAndSaveBlogImages(rawBuffer, imageSlug, blogAssetsDir);
                    console.log("✓ Image generated successfully via local Higgsfield.");
                }
            } catch (hfErr) {
                console.warn(`Local Higgsfield attempt failed: ${hfErr.message}`);
            }
        }

        // Attempt 3: Pollinations AI (Flux / SDXL high-resolution image generation - zero-key, zero-auth fallback)
        if (!imageBuffer) {
            console.log("Attempting image generation via Pollinations AI (Flux / SDXL)...");
            try {
                const cleanPrompt = imagePromptText.replace(/[\r\n]+/g, ' ').trim();
                const seed = Math.floor(Math.random() * 10000000);
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 1500))}?width=1280&height=720&nologo=true&seed=${seed}`;
                console.log("Querying Pollinations AI generation endpoint...");
                const fetchedBuf = await fetchBuffer(pollinationsUrl);
                if (fetchedBuf && fetchedBuf.length > 5000) {
                    imageBuffer = fetchedBuf;
                    console.log(`Image generated successfully via Pollinations AI (${fetchedBuf.length} bytes).`);
                } else {
                    console.warn("Pollinations AI response was empty or too small.");
                }
            } catch (pollErr) {
                console.warn(`Pollinations AI generation failed: ${pollErr.message}`);
            }
        }

        // Attempt 4: Bespoke Algorithmic Geometric SVG Generation (Guaranteed offline/network-outage fallback)
        if (!imageBuffer) {
            console.log("Generating bespoke brand geometric vector artwork...");
            try {
                const svgContent = generateBrandedThemeSvg(currentMonthArtStyle, monthIndex, generatedArticle.title, generatedArticle.tag);
                imageBuffer = Buffer.from(svgContent, 'utf8');
                console.log("Bespoke brand geometric artwork generated successfully.");
            } catch (svgErr) {
                console.warn(`Bespoke SVG generation failed: ${svgErr.message}`);
            }
        }

        if (imageBuffer) {
            if (!relativeImageSrc) {
                // Step 3: Write and compress image locally if not already processed
                const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
                const imageSlug = sanitizeId(generatedArticle.url_slug || articleId);
                relativeImageSrc = await processAndSaveBlogImages(imageBuffer, imageSlug, blogAssetsDir);
            }
        } else {
            throw new Error("CRITICAL: Failed to generate featured image via Higgsfield, Google Gemini/Imagen, Pollinations AI, or SVG. Aborting post generation.");
        }

        // Step 4: Append new post and write back
        const newPost = {
            id: articleId,
            title: generatedArticle.title,
            tag: generatedArticle.tag,
            desc: generatedArticle.desc,
            date: todayDateStr,
            image: relativeImageSrc,
            body: generatedArticle.body,
            // SEO and Discovery Assets
            meta_title: generatedArticle.meta_title,
            meta_description: generatedArticle.meta_description,
            url_slug: generatedArticle.url_slug,
            primary_keyword: generatedArticle.primary_keyword,
            secondary_keywords: generatedArticle.secondary_keywords || [],
            search_intent_classification: generatedArticle.search_intent_classification,
            suggested_internal_links: generatedArticle.suggested_internal_links || [],
            image_alt_text: generatedArticle.image_alt_text,
            social_sharing_title: generatedArticle.social_sharing_title,
            social_sharing_description: generatedArticle.social_sharing_description
        };

        // Remove any existing post with the same ID (safeguard for multiple runs on same day)
        articles = articles.filter(a => a.id !== articleId);
        articles.push(newPost);

        console.log(`Writing article back to: ${articlesJsonPath}`);
        fs.writeFileSync(articlesJsonPath, JSON.stringify(articles, null, 4), 'utf8');
        console.log("Database updated successfully. Daily generation complete.");

    } catch (e) {
        console.error("Daily Generation Process Failed:", e);
        process.exit(1);
    }
}

run();
