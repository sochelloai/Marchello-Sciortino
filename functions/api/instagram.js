/**
 * Cloudflare Pages Function: /api/instagram
 * Fetches the latest media from Marchello's Instagram feed using the Instagram Basic Display API.
 * Includes caching and fallback assets in case the API token is not yet configured or is expired.
 */

// Local fallback assets to use if the API request fails or is unconfigured
const FALLBACK_POSTS = [
    { media_url: "assets/headshot_1.jpg", caption: "Marchello Sciortino" },
    { media_url: "assets/timeline-1.png", caption: "Losing Mobility and adapting" },
    { media_url: "assets/ai-content-creation.jpg", caption: "AI Content Creation" },
    { media_url: "assets/book_cover_mockup.png", caption: "From Limitations to Liberation book cover" },
    { media_url: "assets/chello-ai-twin.png", caption: "ChelloAI digital twin" },
    { media_url: "assets/timeline-faith.png", caption: "Walking by faith" },
    { media_url: "assets/determined-acceptance.png", caption: "Determined Acceptance" },
    { media_url: "assets/timeline-3.png", caption: "Diagnosis years" },
    { media_url: "assets/headshot_2.jpg", caption: "Marchello Sciortino" },
    { media_url: "assets/timeline-2.png", caption: "Gym class balance challenges" },
    { media_url: "assets/chello_ai_avatar.png", caption: "ChelloAI avatar" },
    { media_url: "assets/timeline-4.png", caption: "Wheelchair transition" },
    { media_url: "assets/ring_anyway_coaching.png", caption: "Ring Anyway Coaching" },
    { media_url: "assets/shift-your-perspective.png", caption: "Shift your perspective" },
    { media_url: "assets/timeline-5.png", caption: "Finding design path" },
    { media_url: "assets/headshot_3.jpg", caption: "Marchello Sciortino" }
];

// Helper to clean environment variable values (strips accidental quotes, prefixes, and whitespace)
function cleanEnvVar(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1).trim();
    }
    if (clean.toLowerCase().startsWith("bearer ")) {
        clean = clean.slice(7).trim();
    }
    // Remove any accidental zero-width spaces or hidden unicode formatting
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    return clean;
}

// Case-insensitive multi-key environment variable resolver
function getEnvVal(env, ...keysToTry) {
    if (!env) return "";
    for (const key of keysToTry) {
        if (env[key] !== undefined && env[key] !== null) {
            const v = cleanEnvVar(env[key]);
            if (v) return v;
        }
    }
    const envKeys = Object.keys(env);
    for (const key of keysToTry) {
        const targetClean = key.trim().toLowerCase();
        for (const k of envKeys) {
            if (k.trim().toLowerCase() === targetClean) {
                const v = cleanEnvVar(env[k]);
                if (v) return v;
            }
        }
    }
    return "";
}

// Default public business account ID for Marchello Website Feed
const DEFAULT_INSTAGRAM_BUSINESS_ID = "17841400436172857";

export async function onRequestGet(context) {
    const { env, request } = context;
    const requestUrl = new URL(request.url);
    const bypassCache = requestUrl.searchParams.has('nocache') || request.headers.get('cache-control') === 'no-cache';
    
    // Cloudflare Cache API setup (cache live data for 1 hour if not bypassing)
    const cache = caches.default;
    const cacheKey = new Request(requestUrl.toString(), request);
    if (!bypassCache) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
    }

    // Read token STRICTLY from encrypted Cloudflare secret with flexible key resolution
    const accessToken = getEnvVal(env, "INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_TOKEN", "INSTA_ACCESS_TOKEN", "IG_ACCESS_TOKEN", "INSTAGRAM_API_KEY");
    const businessAccountId = getEnvVal(env, "INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_BUSINESS_ID", "INSTAGRAM_ACCOUNT_ID") || DEFAULT_INSTAGRAM_BUSINESS_ID;

    // Helper for successful response headers
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
    };

    const noCacheHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate"
    };

    // If the encrypted secret is not detected in Cloudflare runtime, gracefully return curated fallback posts
    if (!accessToken) {
        return new Response(JSON.stringify({
            source: "fallback",
            status: "missing_secret",
            message: "INSTAGRAM_ACCESS_TOKEN secret not yet bound to this deployment. A new build/deployment binds secrets into Cloudflare runtime.",
            data: FALLBACK_POSTS
        }), { 
            status: 200, 
            headers: noCacheHeaders
        });
    }

    try {
        const isInstagramToken = accessToken.startsWith("IG") || accessToken.startsWith("ig");
        const encodedToken = encodeURIComponent(accessToken);

        // Define candidate endpoints to try in order of token type
        const candidates = [];

        if (isInstagramToken) {
            // Instagram Basic Display / Professional Login User Token
            candidates.push({
                url: `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${encodedToken}`,
                method: "GET"
            });
            candidates.push({
                url: `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${encodedToken}`,
                method: "GET"
            });
        }

        // Meta Graph API with business ID parameter
        candidates.push({
            url: `https://graph.facebook.com/v19.0/${businessAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${encodedToken}`,
            method: "GET"
        });

        // Meta Graph API with Authorization Bearer header
        candidates.push({
            url: `https://graph.facebook.com/v19.0/${businessAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24`,
            headers: { "Authorization": `Bearer ${accessToken}` },
            method: "GET"
        });

        // Additional fallback: graph.instagram.com/me/media if token wasn't prefixed with IG
        if (!isInstagramToken) {
            candidates.push({
                url: `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${encodedToken}`,
                method: "GET"
            });
            candidates.push({
                url: `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${encodedToken}`,
                method: "GET"
            });
        }

        let payload = null;
        let lastErrorStatus = null;
        let lastMetaError = null;
        const candidateSummary = [];

        for (const candidate of candidates) {
            try {
                const fetchOptions = {
                    method: candidate.method || "GET"
                };
                if (candidate.headers) {
                    fetchOptions.headers = candidate.headers;
                }

                const urlObj = new URL(candidate.url);
                const response = await fetch(candidate.url, fetchOptions);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                        payload = data;
                        break;
                    }
                } else {
                    lastErrorStatus = response.status;
                    let errSnippet = "status " + response.status;
                    try {
                        const errJson = await response.json();
                        if (errJson && errJson.error) {
                            lastMetaError = {
                                message: errJson.error.message || "Meta API error",
                                type: errJson.error.type || "",
                                code: errJson.error.code || response.status,
                                subcode: errJson.error.error_subcode || null
                            };
                            errSnippet = `code ${errJson.error.code}: ${errJson.error.message}`;
                            console.error(`[Instagram API] ${urlObj.hostname}${urlObj.pathname} -> ${errSnippet}`);
                        }
                    } catch (_) {}
                    candidateSummary.push(`${urlObj.hostname}${urlObj.pathname} (${errSnippet})`);
                }
            } catch (candErr) {
                console.error("[Instagram Candidate Error]", candErr && candErr.message ? candErr.message : candErr);
                candidateSummary.push(`${candidate.url} (network error: ${candErr.message})`);
            }
        }

        if (!payload || !payload.data || !Array.isArray(payload.data) || payload.data.length === 0) {
            const summaryStr = candidateSummary.length > 0 ? candidateSummary.join(" | ") : "No candidates succeeded";
            const errReason = lastMetaError
                ? `Meta returned ${lastErrorStatus || 400}: ${lastMetaError.message} (code ${lastMetaError.code}) [Summary: ${summaryStr}]`
                : `No media records returned (status ${lastErrorStatus || "unknown"}) [Summary: ${summaryStr}]`;
            throw new Error(errReason);
        }

        // Format posts for the marquee
        const posts = payload.data.map(item => ({
            id: item.id,
            media_url: item.media_type === "VIDEO" ? (item.thumbnail_url || item.media_url) : item.media_url,
            permalink: item.permalink || "https://www.instagram.com/marchellosciortino/",
            caption: item.caption || "Follow Marchello on Instagram",
            media_type: item.media_type || "IMAGE",
            timestamp: item.timestamp || ""
        }));

        const successRes = new Response(JSON.stringify({
            source: "live",
            status: "active",
            data: posts.length > 0 ? posts : FALLBACK_POSTS
        }), { status: 200, headers: corsHeaders });

        if (posts.length > 0 && !bypassCache) {
            context.waitUntil(cache.put(cacheKey, successRes.clone()));
        }
        return successRes;

    } catch (error) {
        console.error("[Instagram Fetch Exception]", error && error.message ? error.message : "Unknown error");
        
        // Return fallback posts with safe diagnostic message
        return new Response(JSON.stringify({
            source: "fallback_on_error",
            status: "api_error",
            message: error && error.message ? error.message : "Could not fetch Instagram feed",
            data: FALLBACK_POSTS
        }), { status: 200, headers: noCacheHeaders });
    }
}
