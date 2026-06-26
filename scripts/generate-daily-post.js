const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read API keys from environment
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
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(downloadFile(res.headers.location, destPath, redirectCount + 1));
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
                            image_prompt: { type: "string" }
                        },
                        required: ["title", "desc", "tag", "body", "image_prompt"]
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
        // Step 1: Query Gemini API to write the post
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
3. Length: 200 - 400 words. Paced with short, powerful sentences.
4. Word Restrictions:
   - NEVER use corporate jargon: "unlock", "empower", "optimize", "leverage", "synergy", "game-changer", "dive deep".
   - NEVER use clichés: "mindset is everything", "never give up".
   - Never seek pity or sympathy. Refer to your condition as "Friedrich's ataxia", never say "suffer from".
5. Topics: Connect personal resilience with faith, creativity, AI tools as accessibility amplifiers, or funnel building.
6. Closing Signature: End the body text with this exact signature quote: "Much love, party people! That was awesome, the next one will only be better!"

You must return a raw JSON object containing exactly these fields (no markdown wrapper, just JSON):
{
  "title": "A compelling, distinct title for the post",
  "desc": "A one-sentence summary of the daily lesson",
  "tag": "Choose exactly one: 'Story Notes', 'AI and Accessibility', 'Lessons From Limitation', 'Tools I Use', 'Daily Inspiration'",
  "body": "HTML formatted body content (using paragraphs <p>, blockquotes <blockquote>, lists, bold text. Do not output markdown inside the body string, only HTML).",
  "image_prompt": "A detailed, descriptive prompt for DALL-E 3 to generate a premium featured image. The image should be an emotionally compelling, cinematic visual metaphor (no text, minimal professional portrait style, rich colors/lighting, symbolic and clean) representing the theme of the article."
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

        // Programmatic enforcement of closing signature
        const closingQuoteText = "Much love, party people! That was awesome, the next one will only be better!";
        if (generatedArticle.body && !generatedArticle.body.includes(closingQuoteText)) {
            // Trim any trailing whitespace/tags to clean up formatting
            generatedArticle.body = generatedArticle.body.trim();
            
            // If the body ends with a closing paragraph, replace or append cleanly
            const pCloseTag = "</p>";
            if (generatedArticle.body.endsWith(pCloseTag)) {
                generatedArticle.body = generatedArticle.body.substring(0, generatedArticle.body.length - pCloseTag.length) + 
                    ` <br><br><em>${closingQuoteText}</em></p>`;
            } else {
                generatedArticle.body += `\n<p style="margin-top: 20px; font-style: italic; font-weight: 500; color: var(--color-teal);">"${closingQuoteText}"</p>`;
            }
        }

        console.log(`Generated Article Title: "${generatedArticle.title}"`);
        console.log(`Tag: ${generatedArticle.tag}`);
        console.log(`Image Prompt: "${generatedArticle.image_prompt}"`);

        // Step 2: Query Gemini API to generate the image
        console.log("Calling Gemini Image API...");
        const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
        const imageBody = {
            contents: [
                {
                    parts: [
                        {
                            text: generatedArticle.image_prompt + " minimal professional editorial style, atmospheric visual metaphor, cinematic lighting, no text, no captions."
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "image/png"
            }
        };

        let imageBuffer = null;
        let relativeImageSrc = "";
        try {
            const imageRes = await postJson(geminiImageUrl, {}, imageBody);
            const part = imageRes?.candidates?.[0]?.content?.parts?.[0];
            if (part && part.inlineData && part.inlineData.data) {
                imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                console.log(`Image generated successfully via Gemini.`);
            } else {
                console.error("Gemini Image API returned an invalid response structure:", JSON.stringify(imageRes, null, 2));
            }
        } catch (apiErr) {
            console.error("Gemini Image API HTTP request failed:", apiErr.message);
        }

        if (imageBuffer) {
            // Step 3: Write image locally
            const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
            if (!fs.existsSync(blogAssetsDir)) {
                fs.mkdirSync(blogAssetsDir, { recursive: true });
            }

            const localImageName = `${articleId}.png`;
            const localImagePath = path.join(blogAssetsDir, localImageName);
            relativeImageSrc = `assets/blog/${localImageName}`;

            try {
                console.log(`Writing image to: ${localImagePath}`);
                fs.writeFileSync(localImagePath, imageBuffer);
                console.log("Image write complete.");
            } catch (writeErr) {
                console.error("Failed to write generated image. Falling back to default banner:", writeErr.message);
                relativeImageSrc = "assets/antigravity-fallback.png";
            }
        } else {
            console.warn("Warning: Failed to generate custom image via Gemini. Falling back to default banner...");
            relativeImageSrc = "assets/antigravity-fallback.png";
        }

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
