const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read API keys from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
        const promptSystem = `You are Marchello Sciortino, a resilient entrepreneur, keynote speaker, and faith-driven innovator who lives with Friedrich's ataxia (a progressive neuromuscular condition).
Your voice is deeply personal, resilient, faith-filled, and technological.
Write a daily blog post for today: ${todayDateStr}.
The theme for this month is: ${currentMonthTheme}.

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
   - External Links: Include natural links to authoritative resources when relevant (e.g., <a href="https://www.limitationstoliberation.com/" target="_blank">"Limitations to Liberation" book</a> or <a href="https://www.accessibleaim.com/" target="_blank">Accessible AIM</a>).
   - Strong Conclusion: Conclude with a clear call-to-action (CTA) and contextual links.

Your writing must strictly follow these instructions:
1. Tone: Honest, encouraging, conversational, and direct. Avoid sounding corporate, overly polished, or preachy.
2. Structure: Follow the search optimization guidelines while preserving the narrative structure (Opening personal story, Middle lesson/perspective shifting, Takeaway action challenge, and Closing hopeful note).
3. Length: 200 - 400 words. Paced with short, powerful sentences.
4. Word Restrictions:
   - NEVER use corporate jargon: "unlock", "empower", "optimize", "leverage", "synergy", "game-changer", "dive deep".
   - NEVER use clichés: "mindset is everything", "never give up".
   - Never seek pity or sympathy. Refer to your condition as "Friedrich's ataxia", never say "suffer from".
5. Topics: Connect personal resilience with faith, creativity, AI tools as accessibility amplifiers, or funnel building.
6. Closing Signature: End the body text with this exact signature quote: "Much love, party people! That was awesome, the next one will only be better!"

You must return a raw JSON object containing exactly these fields (no markdown wrapper, just JSON):
{
  "title": "A unique, keyword-rich title focused on the primary search intent",
  "desc": "A one-sentence summary of the daily lesson",
  "tag": "Choose exactly one: 'Story Notes', 'AI and Accessibility', 'Lessons From Limitation', 'Tools I Use', 'Daily Inspiration'",
  "body": "HTML formatted body content matching the heading hierarchy, list formatting, FAQ, and internal/external links instructions above. Do not output markdown inside the body string, only HTML.",
  "image_prompt": "A detailed, descriptive prompt for generating a premium featured image representing the theme.",
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

        // Step 2: Generate the image (Try OpenAI DALL-E 3 first, then Google Imagen 3)
        let imageBuffer = null;
        let relativeImageSrc = "";
        const imagePromptText = generatedArticle.image_prompt + " minimal professional editorial style, atmospheric visual metaphor, cinematic lighting, no text, no captions.";

        if (OPENAI_API_KEY) {
            console.log("Calling OpenAI DALL-E 3 API...");
            try {
                const openaiUrl = "https://api.openai.com/v1/images/generations";
                const headers = {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                };
                const body = {
                    model: "dall-e-3",
                    prompt: imagePromptText,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json"
                };
                const res = await postJson(openaiUrl, headers, body);
                const b64Data = res?.data?.[0]?.b64_json;
                if (b64Data) {
                    imageBuffer = Buffer.from(b64Data, 'base64');
                    console.log("Image generated successfully via OpenAI DALL-E 3.");
                } else {
                    console.error("OpenAI response did not contain image data:", JSON.stringify(res, null, 2));
                }
            } catch (openaiErr) {
                console.error("OpenAI DALL-E 3 image generation failed:", openaiErr.message);
            }
        } else {
            console.log("Skipping OpenAI DALL-E 3: OPENAI_API_KEY not found in environment.");
        }

        if (!imageBuffer) {
            console.log("Attempting fallback image generation via Google Imagen 3...");
            try {
                const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${GEMINI_API_KEY}`;
                const imageBody = {
                    prompt: imagePromptText,
                    numberOfImages: 1,
                    outputMimeType: "image/png",
                    aspectRatio: "1:1"
                };
                const res = await postJson(geminiImageUrl, {}, imageBody);
                const b64Data = res?.generatedImages?.[0]?.image?.imageBytes;
                if (b64Data) {
                    imageBuffer = Buffer.from(b64Data, 'base64');
                    console.log("Image generated successfully via Google Imagen 3.");
                } else {
                    console.error("Google Imagen 3 response did not contain imageBytes:", JSON.stringify(res, null, 2));
                }
            } catch (imagenErr) {
                console.error("Google Imagen 3 image generation failed:", imagenErr.message);
            }
        }

        if (imageBuffer) {
            // Step 3: Write image locally
            const blogAssetsDir = path.join(__dirname, '..', 'assets', 'blog');
            if (!fs.existsSync(blogAssetsDir)) {
                fs.mkdirSync(blogAssetsDir, { recursive: true });
            }

            const imageSlug = sanitizeId(generatedArticle.url_slug || articleId);
            const localImageName = `${imageSlug}.png`;
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
            console.warn("Warning: Failed to generate custom image. Falling back to default banner...");
            relativeImageSrc = "assets/antigravity-fallback.png";
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
