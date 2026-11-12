const fs = require('fs');
const path = require('path');
const https = require('https');

// Automated daily post generator — Strictly powered by Google Gemini API
const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_API_KEY = rawApiKey.replace(/^["']|["']$/g, '').trim();

if (!GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not defined in the environment.");
    console.error("-> Ensure the repository secret GEMINI_API_KEY is configured in GitHub Settings -> Secrets and variables -> Actions with a permanent Google AI Studio key (starts with 'AIza').");
    process.exit(1);
}

if (GEMINI_API_KEY.startsWith('ya29.')) {
    console.warn("WARNING: GEMINI_API_KEY starts with 'ya29.' (a short-lived OAuth2 access token that expires after ~1 hour). Use a permanent Google AI Studio API key ('AIza...') in GitHub Secrets for unattended daily runs.");
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
    5: "June — Courage, Midyear Reflection & Momentum (focus on summer energy, consistency, Father's Day, and staying consistent)",
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
    return list[(dayOfMonth - 1) % list.length];
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

// Affiliate link configurations for Higgsfield AI
const HIGGSFIELD_AFFILIATE_URL = "https://higgsfield.ai?fpr=marchello-73dbdc";

// Diverse anchor text variations for Higgsfield
const HIGGSFIELD_ANCHOR_VARIATIONS = [
    "Higgsfield",
    "Try Higgsfield today",
    "Higgsfield AI",
    "explore Higgsfield",
    "create with Higgsfield",
    "try out Higgsfield",
    "Higgsfield creative suite",
    "Higgsfield's AI tools",
    "test Higgsfield for yourself",
    "give Higgsfield a try",
    "explore Higgsfield AI",
    "design with Higgsfield",
    "try Higgsfield",
    "Higgsfield platform",
    "Higgsfield's creative platform"
];

// Determine if today should feature Higgsfield (at least 3 times a week)
function shouldFeatureHiggsfield(date, articlesList = []) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    // Designated core days: Tuesday (2), Thursday (4), Sunday (0) = 3 days/week
    if ([0, 2, 4].includes(dayOfWeek)) return true;

    // Rolling 7-day safety check: if fewer than 3 posts in the trailing 7 days mentioned Higgsfield, trigger catch-up
    const trailing7 = articlesList.slice(-7);
    const count = trailing7.filter(p => p.body && p.body.includes(HIGGSFIELD_AFFILIATE_URL)).length;
    if (count < 3 && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 3)) {
        return true;
    }
    return false;
}

// Select varied anchor text based on date seed while guaranteeing no consecutive duplicate anchors
function getHiggsfieldAnchorText(seedNumber, articlesList = []) {
    let idx = Math.abs(seedNumber) % HIGGSFIELD_ANCHOR_VARIATIONS.length;
    let candidate = HIGGSFIELD_ANCHOR_VARIATIONS[idx];

    // Inspect the most recent post featuring Higgsfield to avoid repeating the same anchor consecutively
    for (let i = articlesList.length - 1; i >= 0; i--) {
        const body = articlesList[i]?.body || '';
        if (body.includes('higgsfield.ai')) {
            const match = body.match(/<a[^>]*href=["'][^"']*higgsfield\.ai[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
            if (match && match[1]) {
                const lastAnchor = match[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
                if (lastAnchor === candidate.toLowerCase()) {
                    idx = (idx + 1) % HIGGSFIELD_ANCHOR_VARIATIONS.length;
                    candidate = HIGGSFIELD_ANCHOR_VARIATIONS[idx];
                }
            }
            break;
        }
    }

    return candidate;
}

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
            if (googleHeaders['x-goog-api-key'] || googleHeaders['Authorization']) {
                u.searchParams.delete('key');
            }
        }

        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
            timeout: 180000, // 3 minutes timeout
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
                        reject(new Error(`HTTP ${res.statusCode}: Failed to parse JSON response.`));
                    }
                } else {
                    const err = new Error(`HTTP ${res.statusCode}: ${data.slice(0, 600)}`);
                    err.statusCode = res.statusCode;
                    reject(err);
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
            timeout: 30000,
            headers: reqHeaders
        };

        const req = https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (parseErr) {
                        reject(new Error(`HTTP ${res.statusCode}: Failed to parse JSON response.`));
                    }
                } else {
                    const err = new Error(`HTTP ${res.statusCode}: ${data.slice(0, 600)}`);
                    err.statusCode = res.statusCode;
                    reject(err);
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error("GET request timed out after 30 seconds."));
        });

        req.on('error', reject);
    });
}

// Fetch all models available to the configured GEMINI_API_KEY (handling pagination)
async function fetchAllAvailableModels() {
    const allModels = [];
    let pageToken = '';
    for (let page = 0; page < 5; page++) {
        const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
        const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100${tokenParam}`;
        const res = await getJson(url);
        if (res && Array.isArray(res.models)) {
            allModels.push(...res.models);
        }
        if (res && res.nextPageToken) {
            pageToken = res.nextPageToken;
        } else {
            break;
        }
    }
    return allModels;
}

// Rank discovered text models (newest Flash / stable models first)
function buildTextModelCandidates(availableModels) {
    const getMethods = m => (m.supportedGenerationMethods || m.supportedMethods || []).map(x => x.toLowerCase());
    const excludedSubstrings = [
        'image', 'banana', 'tts', 'audio', 'embedding', 'imagen', 'veo',
        'aqa', 'vision', 'robotics', 'computer-use', 'live', 'gemma', 'learnlm'
    ];

    const discovered = availableModels
        .filter(m => {
            const id = (m.name || '').replace(/^models\//, '').toLowerCase();
            if (!id.startsWith('gemini-')) return false;
            if (!getMethods(m).includes('generatecontent')) return false;
            return !excludedSubstrings.some(ex => id.includes(ex));
        })
        .map(m => m.name.replace(/^models\//, ''));

    const scoreTextModel = (id) => {
        const lower = id.toLowerCase();
        let score = 0;
        if (lower.startsWith('gemini-3')) score += 300;
        else if (lower.startsWith('gemini-2.5')) score += 200;
        else if (lower === 'gemini-flash-latest') score += 250;
        else if (lower.startsWith('gemini-2.0')) score += 100;

        if (lower.includes('flash') && !lower.includes('lite')) score += 50;
        else if (lower.includes('pro')) score += 35;
        else if (lower.includes('flash-lite')) score += 25;

        if (!lower.includes('exp') && !lower.includes('001')) score += 15;
        if (!lower.includes('preview')) score += 10;
        return score;
    };

    discovered.sort((a, b) => scoreTextModel(b) - scoreTextModel(a));

    const fallbackIds = [
        "gemini-flash-latest",
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.0-flash"
    ];

    return [...new Set([...discovered, ...fallbackIds])];
}

// Rank discovered native Gemini image-generation models (strictly Gemini multimodal generateContent, never Imagen)
function buildImageModelCandidates(availableModels) {
    const getMethods = m => (m.supportedGenerationMethods || m.supportedMethods || []).map(x => x.toLowerCase());

    const discovered = availableModels
        .filter(m => {
            const id = (m.name || '').replace(/^models\//, '').toLowerCase();
            if (!id.startsWith('gemini-')) return false;
            if (!getMethods(m).includes('generatecontent')) return false;
            if (id.includes('embedding') || id.includes('tts') || id.includes('audio')) return false;
            return id.includes('image') || id.includes('banana');
        })
        .map(m => m.name.replace(/^models\//, ''));

    const scoreImageModel = (id) => {
        const lower = id.toLowerCase();
        let score = 0;
        if (lower.includes('3.1-flash-image') && !lower.includes('lite')) score += 400;
        else if (lower.includes('nano-banana-2')) score += 390;
        else if (lower.includes('3-pro-image')) score += 380;
        else if (lower.includes('3') && lower.includes('image') && !lower.includes('lite')) score += 350;
        else if (lower.includes('2.5-flash-image')) score += 320;
        else if (lower.includes('lite-image')) score += 250;
        else score += 200;

        if (!lower.includes('exp')) score += 20;
        if (!lower.includes('preview')) score += 10;
        return score;
    };

    discovered.sort((a, b) => scoreImageModel(b) - scoreImageModel(a));

    const knownImageModels = [
        "gemini-3.1-flash-image",
        "gemini-3.1-flash-image-preview",
        "gemini-3-pro-image",
        "gemini-3-pro-image-preview",
        "gemini-nano-banana-2.1",
        "gemini-2.5-flash-image",
        "gemini-2.5-flash-image-preview",
        "gemini-3.1-flash-lite-image"
    ];

    return [...new Set([...discovered, ...knownImageModels])];
}

// Generic helper to execute a POST to Gemini with transient error retries (429, 500, 503, UNAVAILABLE)
async function postGeminiWithRetry(geminiUrl, payload, maxRetries = 3) {
    let delay = 2500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await postJson(geminiUrl, {}, payload);
        } catch (apiErr) {
            const msg = apiErr.message || '';
            const status = apiErr.statusCode || 0;
            const isTransient = (
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504 ||
                msg.includes("UNAVAILABLE") ||
                msg.includes("DEADLINE_EXCEEDED") ||
                msg.includes("timed out")
            );
            if (isTransient && attempt < maxRetries) {
                console.warn(`Warning: Transient Gemini API error (status ${status || 'timeout'}). Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw apiErr;
            }
        }
    }
}

// Extract final non-thought text part from a Gemini candidate
function extractCandidateText(candidate) {
    const parts = candidate?.content?.parts || [];
    const nonThoughtTextParts = parts.filter(p => !p.thought && typeof p.text === 'string' && p.text.trim().length > 0);
    if (nonThoughtTextParts.length > 0) {
        return nonThoughtTextParts[nonThoughtTextParts.length - 1].text;
    }
    const anyTextPart = parts.find(p => typeof p.text === 'string' && p.text.trim().length > 0);
    return anyTextPart ? anyTextPart.text : null;
}

// Extract final non-thought image inlineData buffer from a Gemini candidate
function extractCandidateImageBuffer(responseData) {
    const candidates = responseData?.candidates || [];
    for (const cand of candidates) {
        const parts = cand?.content?.parts || [];
        const nonThoughtImages = parts.filter(p => !p.thought && p?.inlineData?.data);
        if (nonThoughtImages.length > 0) {
            const chosen = nonThoughtImages[nonThoughtImages.length - 1];
            return Buffer.from(chosen.inlineData.data, 'base64');
        }
        const anyImages = parts.filter(p => p?.inlineData?.data);
        if (anyImages.length > 0) {
            const chosen = anyImages[anyImages.length - 1];
            return Buffer.from(chosen.inlineData.data, 'base64');
        }
    }
    return null;
}

// Automatically compress and optimize blog images using sharp (16:9 1280x720, .webp + .jpg + .png side-by-side)
async function processAndSaveBlogImages(imageBuffer, imageSlug, blogAssetsDir) {
    if (!fs.existsSync(blogAssetsDir)) {
        fs.mkdirSync(blogAssetsDir, { recursive: true });
    }

    const sharp = require('sharp');
    const base = sharp(imageBuffer).resize(1280, 720, {
        fit: 'cover',
        position: 'center'
    });

    // Optimize WebP (target <= 120 KB)
    let webpQuality = 82;
    let webpBuf = await base.clone().webp({ quality: webpQuality, effort: 5 }).toBuffer();
    while (webpBuf.length > 120 * 1024 && webpQuality > 54) {
        webpQuality -= 8;
        webpBuf = await base.clone().webp({ quality: webpQuality, effort: 5 }).toBuffer();
    }

    // Optimize JPEG (target <= 150 KB)
    let jpgQuality = 82;
    let jpgBuf = await base.clone().jpeg({ quality: jpgQuality, mozjpeg: true }).toBuffer();
    while (jpgBuf.length > 150 * 1024 && jpgQuality > 54) {
        jpgQuality -= 8;
        jpgBuf = await base.clone().jpeg({ quality: jpgQuality, mozjpeg: true }).toBuffer();
    }

    // Optimize quantized PNG (target <= 400 KB)
    let pngBuf = await base.clone().png({ quality: 75, palette: true, compressionLevel: 9 }).toBuffer();
    if (pngBuf.length > 400 * 1024) {
        pngBuf = await base.clone().png({ colours: 128, quality: 65, palette: true, compressionLevel: 9 }).toBuffer();
    }

    const webpPath = path.join(blogAssetsDir, `${imageSlug}.webp`);
    const jpgPath = path.join(blogAssetsDir, `${imageSlug}.jpg`);
    const pngPath = path.join(blogAssetsDir, `${imageSlug}.png`);

    fs.writeFileSync(webpPath, webpBuf);
    fs.writeFileSync(jpgPath, jpgBuf);
    fs.writeFileSync(pngPath, pngBuf);

    console.log(`Blog image compressed successfully for "${imageSlug}":`);
    console.log(`- WebP (q=${webpQuality}): ${(webpBuf.length / 1024).toFixed(1)} KB`);
    console.log(`- JPEG (q=${jpgQuality}): ${(jpgBuf.length / 1024).toFixed(1)} KB`);
    console.log(`- PNG  (palette): ${(pngBuf.length / 1024).toFixed(1)} KB`);

    return `assets/blog/${imageSlug}.webp`;
}

async function run() {
    try {
        // Load articles.json first to serve as context for non-repetition
        const articlesJsonPath = path.join(__dirname, '..', 'data', 'articles.json');
        let articles = [];

        if (fs.existsSync(articlesJsonPath)) {
            const rawJson = fs.readFileSync(articlesJsonPath, 'utf8');
            articles = JSON.parse(rawJson);
        }

        // Check if an article with today's ID already exists
        const exists = articles.some(a => a.id === articleId);
        if (exists) {
            console.log(`Article with ID '${articleId}' already exists for today (${todayDateStr}). Skipping generation to avoid duplicate runs and content overwrites.`);
            return;
        }

        // Step 0: Verify Gemini API connectivity & discover active models for this API key
        console.log("Verifying Gemini API key and discovering available models...");
        let availableModels = [];
        try {
            availableModels = await fetchAllAvailableModels();
            console.log(`Connected to Google Gemini API (${availableModels.length} models listed).`);
        } catch (authErr) {
            throw new Error(`Failed to authenticate or list models from Google Gemini API: ${authErr.message}`);
        }

        const textCandidateModels = buildTextModelCandidates(availableModels);
        const imageCandidateModels = buildImageModelCandidates(availableModels);
        console.log(`Top text model candidates: ${textCandidateModels.slice(0, 5).join(', ')}`);
        console.log(`Top Gemini image model candidates: ${imageCandidateModels.slice(0, 5).join(', ')}`);

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

        // Evaluate Higgsfield affiliate feature for today (at least 3 times a week)
        const isHiggsfieldDay = shouldFeatureHiggsfield(centralDate, articles);
        const selectedAnchorText = getHiggsfieldAnchorText(dayOfMonth + centralDate.getDay() + (monthIndex * 7), articles);
        console.log(`Higgsfield Affiliate Feature Scheduled Today: ${isHiggsfieldDay ? 'YES' : 'NO'}`);
        if (isHiggsfieldDay) {
            console.log(`Selected Higgsfield Anchor Text: "${selectedAnchorText}"`);
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
   - Dynamically reference lessons, concepts, or chapters from Marchello's book "Limitations to Liberation" (or "Limitation to Liberation") as a guide for breaking through. Format it as an external link: <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation"</a>.${isHiggsfieldDay ? `
   - FEATURE HIGGSFIELD AI (AFFILIATE PARTNER):
     * Today's post MUST organically discuss Marchello's go-to AI creative platform: Higgsfield.
     * Real-World Use & Endorsement: Marchello frequently uses Higgsfield for AI image generation, video creation, workflow integration, and design work. It provides an expansive variety of creative tools that act as an empowering creative amplifier and cognitive prosthetic. Share this genuine recommendation ("I use it all the time and it is very great. With a larger variety of AI creative tools, I recommend this.").
     * Exact Required Link & Anchor: You MUST include this exact link with the designated anchor text: <a href="${HIGGSFIELD_AFFILIATE_URL}" target="_blank" rel="noopener noreferrer">${selectedAnchorText}</a>.
     * Organic Placement: Weave this link naturally into the lesson or action steps where creative systems, visual workflows, or assistive AI tools are discussed.` : ''}
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
   - External Links: Include natural links to authoritative resources when relevant (e.g., <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation" book</a>${isHiggsfieldDay ? `, <a href="${HIGGSFIELD_AFFILIATE_URL}" target="_blank" rel="noopener noreferrer">${selectedAnchorText}</a>` : ''}, or <a href="/accessible-aim">Accessible AIM</a>).
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

        const articlePayload = {
            contents: [{ parts: [{ text: promptSystem }] }],
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
                        secondary_keywords: { type: "array", items: { type: "string" } },
                        search_intent_classification: { type: "string" },
                        suggested_internal_links: { type: "array", items: { type: "string" } },
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
        };

        let generatedArticle = null;
        let activeTextModel = null;
        let lastTextError = null;

        for (const modelName of textCandidateModels) {
            try {
                console.log(`Attempting article generation with Gemini model: "${modelName}"...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
                const geminiRes = await postGeminiWithRetry(geminiUrl, articlePayload);
                const candidate = geminiRes?.candidates?.[0];
                const rawText = extractCandidateText(candidate);

                if (!rawText) {
                    throw new Error(`Empty text candidate returned (finishReason: ${candidate?.finishReason || 'unknown'}).`);
                }

                let cleanedText = rawText.trim();
                if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
                }

                const parsed = JSON.parse(cleanedText);
                if (!parsed.title || !parsed.body) {
                    throw new Error("Parsed JSON missing required title or body.");
                }

                generatedArticle = parsed;
                activeTextModel = modelName;
                console.log(`✓ Successfully generated article using model: "${modelName}"`);
                break;
            } catch (err) {
                console.warn(`Warning: Text model "${modelName}" failed: ${err.message}`);
                lastTextError = err;
            }
        }

        if (!generatedArticle) {
            throw new Error(`CRITICAL: All Gemini text models failed to generate today's article. Last error: ${lastTextError ? lastTextError.message : 'Unknown error'}`);
        }

        // Programmatic enforcement of Higgsfield affiliate feature on scheduled days
        if (isHiggsfieldDay && generatedArticle.body && !generatedArticle.body.includes(HIGGSFIELD_AFFILIATE_URL)) {
            console.log(`Notice: Post body omitted Higgsfield link. Programmatically integrating affiliate link with anchor "${selectedAnchorText}"...`);
            const endorsementParagraph = `<p>When it comes to visual storytelling, image creation, video workflows, and design integration, I rely heavily on <a href="${HIGGSFIELD_AFFILIATE_URL}" target="_blank" rel="noopener noreferrer">${selectedAnchorText}</a>. With its wide variety of creative AI tools, it acts as a practical creative amplifier in my daily stack.</p>`;

            if (generatedArticle.body.includes('<h3>Frequently Asked Questions</h3>')) {
                generatedArticle.body = generatedArticle.body.replace('<h3>Frequently Asked Questions</h3>', `${endorsementParagraph}\n<h3>Frequently Asked Questions</h3>`);
            } else {
                generatedArticle.body = `${generatedArticle.body}\n${endorsementParagraph}`;
            }
        }

        // Programmatic enforcement of closing signature (bold, italicized, in quotes)
        if (generatedArticle.body) {
            const signatureCleanRegex = /<p[^>]*>\s*(<strong>|<em>|"|'|“|”)*\s*Much\s*love,?\s*party\s*people!.*?(<\/strong>|<\/em>|"|'|“|”)*\s*<\/p>/gi;
            generatedArticle.body = generatedArticle.body.replace(signatureCleanRegex, "");

            const nakedRegex = /"??Much\s*love,?\s*party\s*people!.*?better!"??/gi;
            generatedArticle.body = generatedArticle.body.replace(nakedRegex, "");

            generatedArticle.body = generatedArticle.body.trim();
            generatedArticle.body += `\n<p style="margin-top: 20px; color: var(--color-teal);"><strong><em>"Much love, party people! That was awesome, the next one will only be better!"</em></strong></p>`;
        }

        // Ensure globally unique URL slug and image filename (preventing overwrites or URL collisions)
        const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
        let baseSlug = sanitizeId(generatedArticle.url_slug || generatedArticle.title || articleId);
        if (!baseSlug) baseSlug = articleId;

        const slugAlreadyUsed = articles.some(a => a.id !== articleId && sanitizeId(a.url_slug || '') === baseSlug);
        const imageAlreadyExists = fs.existsSync(path.join(blogAssetsDir, `${baseSlug}.webp`));
        if (slugAlreadyUsed || imageAlreadyExists) {
            baseSlug = `${baseSlug}-${sanitizeId(todayDateStr)}`;
        }
        generatedArticle.url_slug = baseSlug;

        console.log(`Generated Article Title: "${generatedArticle.title}"`);
        console.log(`Tag: ${generatedArticle.tag}`);
        console.log(`Unique URL Slug: ${generatedArticle.url_slug}`);

        // Step 2: Dedicated Image Prompt Rewriter
        console.log("Rewriting image prompt to resonate directly with title, metaphor, month palette, and seasonal highlight...");

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
        const rewriterModels = activeTextModel
            ? [activeTextModel, ...textCandidateModels.filter(m => m !== activeTextModel)]
            : textCandidateModels;

        for (const rwModel of rewriterModels.slice(0, 3)) {
            try {
                const rewriterUrl = `https://generativelanguage.googleapis.com/v1beta/models/${rwModel}:generateContent`;
                const rewriterRes = await postGeminiWithRetry(rewriterUrl, {
                    contents: [{ parts: [{ text: promptRewriterSystem }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 400
                    }
                });
                const candText = extractCandidateText(rewriterRes?.candidates?.[0]);
                if (candText && candText.trim().length > 25) {
                    tailoredImagePrompt = candText.trim().replace(/^["']|["']$/g, '');
                    console.log(`✓ Image prompt rewritten successfully via "${rwModel}".`);
                    break;
                }
            } catch (rewriteErr) {
                console.warn(`Prompt rewriter attempt with "${rwModel}" failed: ${rewriteErr.message}`);
            }
        }

        const imagePromptText = `${tailoredImagePrompt}. 16:9 widescreen cinematic composition, premium abstract 3D illustrated conceptual artwork, ${selectedDailyStyle}, ${currentMonthArtStyle.colorPalette}, ${currentHolidayHighlight.highlight}, strictly no people, no human silhouettes, no faces, no hands, strictly no text, no words, no letters, no logos, no watermark, 8k render, masterpiece.`;
        console.log(`Final image prompt: "${imagePromptText}"`);

        // Step 3: Strictly Enforced Google Gemini API Multimodal Image Generation
        console.log("Generating featured artwork via Google Gemini API multimodal generateContent...");
        let imageBuffer = null;
        let lastImageError = null;

        const generationConfigs = [
            {
                label: "TEXT+IMAGE (16:9)",
                config: {
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: { aspectRatio: "16:9" }
                }
            },
            {
                label: "TEXT+IMAGE",
                config: {
                    responseModalities: ["TEXT", "IMAGE"]
                }
            },
            {
                label: "IMAGE",
                config: {
                    responseModalities: ["IMAGE"]
                }
            }
        ];

        for (const modelName of imageCandidateModels) {
            for (const variant of generationConfigs) {
                try {
                    console.log(`Attempting Gemini image generation with "${modelName}" [${variant.label}]...`);
                    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
                    const payload = {
                        contents: [{
                            parts: [{
                                text: `Generate a high-resolution 16:9 widescreen abstract 3D conceptual artwork matching this art direction (strictly no people, no faces, no hands, no text, no letters, no logos, no watermarks): ${imagePromptText}`
                            }]
                        }],
                        generationConfig: variant.config
                    };

                    const responseData = await postGeminiWithRetry(genUrl, payload);
                    imageBuffer = extractCandidateImageBuffer(responseData);

                    if (imageBuffer && imageBuffer.length > 5000) {
                        console.log(`✓ Image generated successfully via Google Gemini API ("${modelName}" [${variant.label}], ${(imageBuffer.length / 1024).toFixed(1)} KB raw).`);
                        break;
                    } else {
                        imageBuffer = null;
                        console.warn(`Notice: "${modelName}" [${variant.label}] returned no inline image data.`);
                    }
                } catch (geminiErr) {
                    lastImageError = geminiErr;
                    console.warn(`Gemini image attempt ("${modelName}" [${variant.label}]) failed: ${geminiErr.message}`);
                    // Skip remaining config variants if the model itself is 404 Not Found or 403 Forbidden
                    if (geminiErr.statusCode === 404 || geminiErr.statusCode === 403) {
                        break;
                    }
                }
            }
            if (imageBuffer) break;
        }

        if (!imageBuffer) {
            throw new Error(`CRITICAL: Failed to generate featured image via Google Gemini API across all candidate models. Last error: ${lastImageError ? lastImageError.message : 'No image buffer returned'}`);
        }

        // Step 4: Compress and save side-by-side .webp, .jpg, and .png
        const relativeImageSrc = await processAndSaveBlogImages(imageBuffer, generatedArticle.url_slug, blogAssetsDir);

        // Step 5: Append new post and write back
        const newPost = {
            id: articleId,
            title: generatedArticle.title,
            tag: generatedArticle.tag,
            desc: generatedArticle.desc,
            date: todayDateStr,
            image: relativeImageSrc,
            body: generatedArticle.body,
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

        articles = articles.filter(a => a.id !== articleId);
        articles.push(newPost);

        console.log(`Writing article back to: ${articlesJsonPath}`);
        fs.writeFileSync(articlesJsonPath, JSON.stringify(articles, null, 4) + '\n', 'utf8');
        console.log("Database updated successfully. Daily generation complete.");

    } catch (e) {
        console.error("Daily Generation Process Failed:", e.message || e);
        process.exit(1);
    }
}

run();
