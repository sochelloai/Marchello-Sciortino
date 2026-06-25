const fs = require('fs');
const path = require('path');
const https = require('https');

// Read API keys from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not defined in the environment.");
    process.exit(1);
}
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not defined in the environment.");
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

// Calculate Date in Central Time (US)
const centralDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const monthIndex = centralDate.getMonth(); // 0-11
const currentYear = centralDate.getFullYear();
const currentMonthTheme = MONTHLY_THEMES[monthIndex];

const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
const todayDateStr = centralDate.toLocaleDateString('en-US', dateOptions);

// Generate article ID based on date
const sanitizeId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const articleId = `daily-${sanitizeId(todayDateStr)}`;

console.log(`Starting generation for: ${todayDateStr}`);
console.log(`Month Theme: ${currentMonthTheme}`);
console.log(`Article ID: ${articleId}`);

// Helper to make HTTPS POST requests with promise
function postJson(url, headers, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
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
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

// Helper to download binary files
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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

async function run() {
    try {
        // Step 1: Query Gemini API to write the post
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
        const promptSystem = `You are Marchello Sciortino, a resilient entrepreneur, keynote speaker, and faith-driven innovator who lives with Friedrich's ataxia (a progressive neuromuscular condition).
Your voice is deeply personal, resilient, faith-filled, and technological.
Write a daily blog post for today: ${todayDateStr}.
The theme for this month is: ${currentMonthTheme}.

Your writing must strictly follow these instructions:
1. Tone: Honest, encouraging, conversational, and direct. Avoid sounding corporate, overly polished, or preachy.
2. Structure: 
   - Opening: A personal story, observation, or current event/calendar observance for today.
   - Middle: Lesson learned, shift in perspective (treating limitations as simple design parameters).
   - Takeaway: A practical, actionable challenge or reflection.
   - Closing: Hopeful, uplifting note.
3. Length: 400 - 800 words. Paced with short, powerful sentences.
4. Word Restrictions:
   - NEVER use corporate jargon: "unlock", "empower", "optimize", "leverage", "synergy", "game-changer", "dive deep".
   - NEVER use clichés: "mindset is everything", "never give up".
   - Never seek pity or sympathy. Refer to your condition as "Friedrich's ataxia", never say "suffer from".
5. Topics: Connect personal resilience with faith, creativity, AI tools as accessibility amplifiers, or funnel building.

You must return a raw JSON object containing exactly these fields (no markdown wrapper, just JSON):
{
  "title": "A compelling, distinct title for the post",
  "desc": "A one-sentence summary of the daily lesson",
  "tag": "Choose exactly one: 'Story Notes', 'AI and Accessibility', 'Lessons From Limitation', 'Tools I Use', 'Daily Inspiration'",
  "body": "HTML formatted body content (using paragraphs <p>, blockquotes <blockquote>, lists, bold text. Do not output markdown inside the body string, only HTML).",
  "image_prompt": "A detailed, descriptive prompt for DALL-E 3 to generate a premium featured image. The image should be an emotionally compelling, cinematic visual metaphor (no text, minimal professional portrait style, rich colors/lighting, symbolic and clean) representing the theme of the article."
}`;

        console.log("Calling Gemini API...");
        const geminiRes = await postJson(geminiUrl, {}, {
            contents: [
                {
                    parts: [
                        { text: promptSystem }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const rawText = geminiRes.candidates[0].content.parts[0].text;
        const generatedArticle = JSON.parse(rawText.trim());

        console.log(`Generated Article Title: "${generatedArticle.title}"`);
        console.log(`Tag: ${generatedArticle.tag}`);
        console.log(`Image Prompt: "${generatedArticle.image_prompt}"`);

        // Step 2: Query OpenAI DALL-E 3 API to generate the image
        console.log("Calling OpenAI DALL-E 3 API...");
        const openaiUrl = "https://api.openai.com/v1/images/generations";
        const openaiHeaders = {
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        };
        const dallEBody = {
            model: "dall-e-3",
            prompt: generatedArticle.image_prompt + " minimal professional editorial style, atmospheric visual metaphor, cinematic lighting, no text, no captions.",
            n: 1,
            size: "1024x1024"
        };

        const openaiRes = await postJson(openaiUrl, openaiHeaders, dallEBody);
        const imageUrl = openaiRes.data[0].url;
        console.log(`Image generated at URL: ${imageUrl}`);

        // Step 3: Download image and write locally
        const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
        if (!fs.existsSync(blogAssetsDir)) {
            fs.mkdirSync(blogAssetsDir, { recursive: true });
        }

        const localImageName = `${articleId}.png`;
        const localImagePath = path.join(blogAssetsDir, localImageName);
        const relativeImageSrc = `assets/blog/${localImageName}`;

        console.log(`Downloading image to: ${localImagePath}`);
        await downloadFile(imageUrl, localImagePath);
        console.log("Image download complete.");

        // Step 4: Load articles.json, append new post, write back
        const articlesJsonPath = path.join(__dirname, '..', 'data', 'articles.json');
        let articles = [];
        
        if (fs.existsSync(articlesJsonPath)) {
            const rawJson = fs.readFileSync(articlesJsonPath, 'utf8');
            articles = JSON.parse(rawJson);
        }

        const newPost = {
            id: articleId,
            title: generatedArticle.title,
            tag: generatedArticle.tag,
            desc: generatedArticle.desc,
            date: todayDateStr,
            image: relativeImageSrc,
            body: generatedArticle.body
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
