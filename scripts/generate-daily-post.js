const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// Automated daily post generator - trigger regeneration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not defined in the environment.");
    console.error("-> To fix this on GitHub Actions, navigate to Settings -> Secrets and variables -> Actions in your repository, and create a Repository Secret named GEMINI_API_KEY.");
    process.exit(1);
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
const currentYear = centralDate.getFullYear();
const currentMonthTheme = MONTHLY_THEMES[monthIndex];
const currentMonthArtStyle = MONTHLY_ART_STYLES[monthIndex];

const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
const todayDateStr = centralDate.toLocaleDateString('en-US', dateOptions);

// Generate article ID based on date
const sanitizeId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const articleId = `daily-${sanitizeId(todayDateStr)}`;

console.log(`Starting generation for: ${todayDateStr}`);
console.log(`Month Theme: ${currentMonthTheme}`);
console.log(`Month Art Style Theme: ${currentMonthArtStyle.name}`);
console.log(`Article ID: ${articleId}`);

// Helper to make HTTPS POST requests with promise
function postJson(url, headers, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
            timeout: 180000, // 3 minutes timeout in milliseconds
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
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

// Helper to make HTTPS GET requests with promise
function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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
When generating the "image_prompt" in the JSON response, make sure it matches these visual theme elements (e.g., suggest geometric shapes, layouts, colors, and textures that fit this specific monthly theme).

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
  "image_prompt": "A detailed descriptive prompt for generating a premium featured image representing the article's theme. The prompt must strictly follow the Marchello Brand Image Style Guide for this month: it must be a purely symbolic visual metaphor using this month's geometry and color palette. It must communicate optimism, hope, and human potential. Do NOT mention any medical terms, diseases, physical limitations, or wheelchairs to avoid safety filters. Do NOT request text, logos, watermarks, or UI elements.",
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

        console.log("Calling Gemini API...");
        let geminiRes;
        const candidateModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        let lastError = null;

        for (const modelName of candidateModels) {
            try {
                console.log(`Attempting generation with model: "${modelName}"...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
                geminiRes = await callGeminiWithRetry(geminiUrl, promptSystem);
                console.log(`Successfully generated content using model: "${modelName}"`);
                break; // Succeeded, exit loop
            } catch (err) {
                console.warn(`Warning: Model "${modelName}" failed: ${err.message}`);
                lastError = err;
            }
        }

        if (!geminiRes) {
            console.error("All Gemini candidate models failed.");
            try {
                console.log("Running diagnostics: Fetching available models for this API key...");
                const diagUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
                const modelsList = await getJson(diagUrl);
                console.log("Available models returned by API:");
                if (modelsList && modelsList.models) {
                    modelsList.models.forEach(m => {
                        console.log(`- ${m.name} (supports: ${m.supportedMethods ? m.supportedMethods.join(', ') : 'none'})`);
                    });
                } else {
                    console.log(JSON.stringify(modelsList, null, 2));
                }
            } catch (diagErr) {
                console.error("Diagnostics failed to fetch model list:", diagErr.message);
            }
            throw lastError || new Error("Failed to generate content with any Gemini model.");
        }

        if (!geminiRes || !geminiRes.candidates || geminiRes.candidates.length === 0) {
            console.error("Gemini API returned an empty or invalid response:", JSON.stringify(geminiRes, null, 2));
            throw new Error("No candidates returned from Gemini API. This can happen if content safety filters are triggered.");
        }

        const candidate = geminiRes.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== "STOP") {
            console.warn(`Warning: Gemini generation finished with status: ${candidate.finishReason}. Safety or recitation filters may have restricted the output.`);
        }

        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0 || !candidate.content.parts[0].text) {
            console.error("Gemini candidate is missing content parts text:", JSON.stringify(candidate, null, 2));
            throw new Error(`Invalid response structure from Gemini. Finish reason: ${candidate.finishReason}`);
        }

        const rawText = candidate.content.parts[0].text;
        let cleanedText = rawText.trim();

        // Strip markdown code block wrapping if present
        if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```(json)?\s*/i, "");
            cleanedText = cleanedText.replace(/\s*```$/, "");
            cleanedText = cleanedText.trim();
        }

        let generatedArticle;
        try {
            generatedArticle = JSON.parse(cleanedText);
        } catch (parseErr) {
            console.error("Failed to parse Gemini output as JSON.");
            console.error("Raw Gemini output was:", rawText);
            console.error("Cleaned text was:", cleanedText);
            throw new Error(`JSON parsing error: ${parseErr.message}`);
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

        // Step 2: Generate the image (Try Higgsfield first, then Google Imagen 3 / Gemini)
        let imageBuffer = null;
        let relativeImageSrc = "";
        // Define unified Marchello Brand Image Style Guide parameters (customized dynamically for this month)
        const brandStyleInstructions = [
            `Style: Premium abstract conceptual artwork, geometric composition, layered symbolism, ${currentMonthArtStyle.style}, modern visual storytelling, sophisticated artistic balance, museum-quality digital illustration, contemporary brand design, editorial artwork, generous negative space, crisp details.`,
            `Mood: ${currentMonthArtStyle.mood}.`,
            `Color Palette: ${currentMonthArtStyle.colorPalette}.`,
            `Geometry: ${currentMonthArtStyle.geometry}, architectural balance, dimensional depth.`,
            "Lighting: cinematic volumetric light beams, soft glowing edges, internal glow, ambient illumination.",
            `Textures & Surfaces: ${currentMonthArtStyle.textures}, transparent layers, depth fog.`,
            "Quality Standards: ultra-high-resolution, clean luxury aesthetic, no clutter, no stock-photo appearance, strictly no text, no captions, no logos, no watermarks, no borders, no UI elements."
        ].join(" ");

        const imagePromptText = `${generatedArticle.image_prompt}. ${brandStyleInstructions}`;

        // Attempt 1: Higgsfield Generation (GPT Image 2)
        console.log("Attempting image generation via Higgsfield (gpt_image_2)...");
        try {
            const isWindows = process.platform === 'win32';
            const hfCmd = isWindows ? 'higgsfield.cmd' : 'higgsfield';

            // Configure Higgsfield Auth (auth_version 2)
            const token = process.env.HIGGSFIELD_AUTH_TOKEN || "oat_OWE6AA6KB8SWEBH92S39YF4YT2GPD68G";
            const refreshToken = process.env.HIGGSFIELD_REFRESH_TOKEN || "NDC1MDHLMTITNTK2NS01ODQ4LTG0MJKTZGRJN2YXOWNLMZVK";
            
            try {
                const os = require('os');
                const configDir = path.join(os.homedir(), '.config', 'higgsfield');
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }
                const credPath = path.join(configDir, 'credentials.json');
                
                let hasValidLocalCreds = false;
                if (fs.existsSync(credPath)) {
                    try {
                        const existing = JSON.parse(fs.readFileSync(credPath, 'utf8'));
                        if (existing && existing.access_token && (!existing.expires_at || existing.expires_at * 1000 > Date.now())) {
                            hasValidLocalCreds = true;
                        }
                    } catch (e) {}
                }

                if (!hasValidLocalCreds) {
                    let creds;
                    if (process.env.HIGGSFIELD_CREDENTIALS) {
                        try {
                            creds = JSON.parse(process.env.HIGGSFIELD_CREDENTIALS);
                        } catch (e) {
                            console.warn("Could not parse HIGGSFIELD_CREDENTIALS, using token defaults.");
                        }
                    }
                    
                    if (!creds) {
                        creds = {
                            auth_version: 2,
                            access_token: token,
                            refresh_token: refreshToken,
                            expires_at: 2147483647,
                            token_type: "bearer",
                            scope: "offline_access user:org:read email profile"
                        };
                    }
                    fs.writeFileSync(credPath, JSON.stringify(creds, null, 2), 'utf8');
                }

                // Pre-seed workspace_id
                const workspaceId = process.env.HIGGSFIELD_WORKSPACE_ID || "83b91fe8-4f53-47f2-9a2d-5bf6695f51a3";
                const confPath = path.join(configDir, 'config.json');
                if (!fs.existsSync(confPath)) {
                    fs.writeFileSync(confPath, JSON.stringify({ workspace_id: workspaceId }, null, 2), 'utf8');
                }
            } catch (authErr) {
                console.warn("Could not write Higgsfield credentials file:", authErr.message);
            }

            // Auto-detect and select an active workspace if needed
            try {
                const wsOutput = execSync(`${hfCmd} workspace list --json`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                    timeout: 15000
                });
                const wsList = JSON.parse(wsOutput);
                if (Array.isArray(wsList) && wsList.length > 0) {
                    const selected = wsList.find(w => w.is_selected) || wsList[0];
                    if (selected && selected.id) {
                        execSync(`${hfCmd} workspace set ${selected.id}`, {
                            encoding: 'utf8',
                            stdio: ['pipe', 'pipe', 'pipe'],
                            timeout: 10000
                        });
                        console.log(`Using Higgsfield workspace: "${selected.name || 'default'}" (${selected.id})`);
                    }
                }
            } catch (wsErr) {
                console.warn("Workspace selection notice:", wsErr.message);
            }

            const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
            if (!fs.existsSync(blogAssetsDir)) {
                fs.mkdirSync(blogAssetsDir, { recursive: true });
            }
            const imageSlug = sanitizeId(generatedArticle.url_slug || articleId);
            const localImageName = `${imageSlug}.png`;
            const localImagePath = path.join(blogAssetsDir, localImageName);
            
            // Clean and escape prompt for CLI arguments
            const escapedPrompt = imagePromptText.replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"');
            const hfExecCommand = `${hfCmd} generate create gpt_image_2 --prompt "${escapedPrompt}" --aspect_ratio 1:1 --wait`;

            console.log(`Executing Higgsfield generation command...`);
            const hfOutput = execSync(hfExecCommand, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 300000 // 5-minute timeout for high-res generation
            });

            // Extract image URL from Higgsfield stdout
            const urlMatch = hfOutput.match(/https:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp)/i);
            if (urlMatch) {
                const imageUrl = urlMatch[0];
                console.log(`Downloading generated Higgsfield image from: ${imageUrl}`);
                await downloadFile(imageUrl, localImagePath);
                imageBuffer = fs.readFileSync(localImagePath);
                relativeImageSrc = `assets/blog/${localImageName}`;
                console.log("Image downloaded and saved successfully via Higgsfield.");
            } else {
                console.warn("Higgsfield CLI command completed but no image URL was found in output:", hfOutput);
            }
        } catch (hfErr) {
            console.warn(`Higgsfield generation attempt failed: ${hfErr.message}`);
        }

        if (!imageBuffer && GEMINI_API_KEY) {
            console.log("Attempting Google image generation...");

            // 1. Fetch available models from Google AI Studio to adapt programmatically
            let availableModels = [];
            try {
                console.log("Querying ModelService.ListModels for enabled models...");
                const modelsList = await getJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
                if (modelsList && modelsList.models) {
                    availableModels = modelsList.models;
                }
            } catch (err) {
                console.warn("Could not retrieve models list for auto-detection:", err.message);
            }

            // Helper to get methods from Google model object
            const getMethods = m => m.supportedGenerationMethods || m.supportedMethods || [];

            // 2. Identify candidate image models in the list
            const imageModels = availableModels.filter(m =>
                m.name.includes("imagen") ||
                m.name.includes("image") ||
                (getMethods(m).some(method => method.toLowerCase().includes("image")))
            );

            if (imageModels.length > 0) {
                console.log(`Detected ${imageModels.length} image generation models on this key:`);
                imageModels.forEach(m => {
                    const methods = getMethods(m);
                    console.log(`- ${m.name} (methods: ${methods.length > 0 ? methods.join(', ') : 'none'})`);
                });

                for (const model of imageModels) {
                    console.log(`Attempting image generation using auto-detected model: "${model.name}"...`);

                    // Attempt based on supported methods
                    const methods = getMethods(model).map(m => m.split('/').pop() || m);

                    if (methods.includes("generateContent")) {
                        try {
                            console.log(`Calling generateContent on "${model.name}"...`);
                            const url = `https://generativelanguage.googleapis.com/v1beta/${model.name}:generateContent?key=${GEMINI_API_KEY}`;
                            const body = {
                                contents: [{ parts: [{ text: imagePromptText }] }],
                                generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
                            };
                            const res = await postJson(url, {}, body);
                            const part = res?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                            const b64 = part?.inlineData?.data;
                            if (b64) {
                                imageBuffer = Buffer.from(b64, 'base64');
                                console.log(`Image generated successfully via "${model.name}" (generateContent).`);
                                break;
                            }
                        } catch (err) {
                            console.warn(`Auto-detected method generateContent failed for "${model.name}": ${err.message}`);
                        }
                    }

                    if (methods.includes("predict")) {
                        try {
                            console.log(`Calling predict on "${model.name}"...`);
                            const url = `https://generativelanguage.googleapis.com/v1beta/${model.name}:predict?key=${GEMINI_API_KEY}`;
                            const body = {
                                instances: [{ prompt: imagePromptText }],
                                parameters: { sampleCount: 1, outputMimeType: "image/png", aspectRatio: "1:1" }
                            };
                            const res = await postJson(url, {}, body);
                            const b64 = res?.predictions?.[0]?.bytesBase64Encoded || res?.predictions?.[0]?.image?.imageBytes;
                            if (b64) {
                                imageBuffer = Buffer.from(b64, 'base64');
                                console.log(`Image generated successfully via "${model.name}" (predict).`);
                                break;
                            }
                        } catch (err) {
                            console.warn(`Auto-detected method predict failed for "${model.name}": ${err.message}`);
                        }
                    }

                    if (methods.includes("generateImages")) {
                        try {
                            console.log(`Calling generateImages on "${model.name}"...`);
                            const url = `https://generativelanguage.googleapis.com/v1beta/${model.name}:generateImages?key=${GEMINI_API_KEY}`;
                            const body = {
                                prompt: imagePromptText,
                                numberOfImages: 1,
                                outputMimeType: "image/png",
                                aspectRatio: "1:1"
                            };
                            const res = await postJson(url, {}, body);
                            const b64 = res?.generatedImages?.[0]?.image?.imageBytes;
                            if (b64) {
                                imageBuffer = Buffer.from(b64, 'base64');
                                console.log(`Image generated successfully via "${model.name}" (generateImages).`);
                                break;
                            }
                        } catch (err) {
                            console.warn(`Auto-detected method generateImages failed for "${model.name}": ${err.message}`);
                        }
                    }
                }
            }

            // 3. If auto-detection yielded nothing or failed, use static fallback candidates
            if (!imageBuffer) {
                console.log("No auto-detected models succeeded. Attempting static fallback candidates...");
                const staticCandidates = [
                    {
                        name: "imagen-3.0-generate-002",
                        method: "predict",
                        url: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`,
                        body: { instances: [{ prompt: imagePromptText }], parameters: { sampleCount: 1, outputMimeType: "image/png", aspectRatio: "1:1" } },
                        parser: res => res?.predictions?.[0]?.bytesBase64Encoded || res?.predictions?.[0]?.image?.imageBytes
                    },
                    {
                        name: "imagen-3.0-generate-002",
                        method: "generateImages",
                        url: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${GEMINI_API_KEY}`,
                        body: { prompt: imagePromptText, numberOfImages: 1, outputMimeType: "image/png", aspectRatio: "1:1" },
                        parser: res => res?.generatedImages?.[0]?.image?.imageBytes
                    },
                    {
                        name: "gemini-2.5-flash-image",
                        method: "generateContent",
                        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
                        body: { contents: [{ parts: [{ text: imagePromptText }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } },
                        parser: res => res?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data
                    }
                ];

                for (const cand of staticCandidates) {
                    console.log(`Attempting static fallback model: "${cand.name}" via "${cand.method}"...`);
                    try {
                        const res = await postJson(cand.url, {}, cand.body);
                        const b64 = cand.parser(res);
                        if (b64) {
                            imageBuffer = Buffer.from(b64, 'base64');
                            console.log(`Image generated successfully via static fallback: "${cand.name}" (${cand.method}).`);
                            break;
                        } else {
                            console.warn(`Response from static candidate "${cand.name}" did not parse correctly.`);
                        }
                    } catch (candErr) {
                        console.warn(`Static candidate "${cand.name}" (${cand.method}) failed: ${candErr.message}`);
                    }
                }
            }
        }

        // Attempt 3: Pollinations AI (Flux / SDXL high-resolution image generation - zero-key, zero-auth fallback)
        if (!imageBuffer) {
            console.log("Attempting image generation via Pollinations AI (Flux / SDXL)...");
            try {
                const cleanPrompt = imagePromptText.replace(/[\r\n]+/g, ' ').trim();
                const seed = Math.floor(Math.random() * 10000000);
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 1500))}?width=1024&height=1024&nologo=true&seed=${seed}`;
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
                // Step 3: Write image locally if not already downloaded and saved
                const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
                if (!fs.existsSync(blogAssetsDir)) {
                    fs.mkdirSync(blogAssetsDir, { recursive: true });
                }

                const imageSlug = sanitizeId(generatedArticle.url_slug || articleId);
                
                // Detect file format from buffer content
                let ext = 'png';
                if (imageBuffer.length > 2 && imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
                    ext = 'jpg';
                } else if (imageBuffer.toString('utf8', 0, 100).includes('<svg')) {
                    ext = 'svg';
                }

                const localImageName = `${imageSlug}.${ext}`;
                const localImagePath = path.join(blogAssetsDir, localImageName);
                relativeImageSrc = `assets/blog/${localImageName}`;

                try {
                    console.log(`Writing image to: ${localImagePath}`);
                    fs.writeFileSync(localImagePath, imageBuffer);
                    console.log("Image write complete.");
                } catch (writeErr) {
                    throw new Error(`CRITICAL: Failed to write generated image to disk: ${writeErr.message}. Aborting post generation.`);
                }
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
