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

export async function onRequestGet(context) {
    const { env, request } = context;
    
    // Cloudflare Cache API setup (cache for 4 hours)
    const cache = caches.default;
    const cacheKey = new Request(new URL(request.url).toString(), request);
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
        return cachedResponse;
    }

    const accessToken = env.INSTAGRAM_ACCESS_TOKEN;

    // Helper to return headers
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=14400" // Cache in browser for 4 hours
    };

    // If token is missing, return fallback posts immediately (do not cache fallback)
    if (!accessToken) {
        return new Response(JSON.stringify({
            source: "fallback",
            data: FALLBACK_POSTS
        }), { 
            status: 200, 
            headers: {
                ...corsHeaders,
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });
    }

    try {
        // Fetch posts from Instagram Graph API
        const businessAccountId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "17841400436172857";
        const instagramUrl = `https://graph.facebook.com/v19.0/${businessAccountId.trim()}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken.trim()}`;
        const response = await fetch(instagramUrl);

        if (!response.ok) {
            throw new Error(`Instagram API responded with status ${response.status}`);
        }

        const payload = await response.json();
        
        if (!payload.data || !Array.isArray(payload.data)) {
            throw new Error("Invalid payload structure from Instagram API");
        }

        // Format posts for the marquee
        const posts = payload.data.map(item => ({
            id: item.id,
            media_url: item.media_type === "VIDEO" ? (item.thumbnail_url || item.media_url) : item.media_url,
            permalink: item.permalink,
            caption: item.caption || ""
        }));

        const successRes = new Response(JSON.stringify({
            source: "live",
            data: posts.length > 0 ? posts : FALLBACK_POSTS
        }), { status: 200, headers: corsHeaders });

        context.waitUntil(cache.put(cacheKey, successRes.clone()));
        return successRes;

    } catch (error) {
        console.error("Instagram fetch error:", error);
        
        // Fail gracefully and return the static fallback posts
        const errorFallbackRes = new Response(JSON.stringify({
            source: "fallback_on_error",
            error: error.message,
            data: FALLBACK_POSTS
        }), { status: 200, headers: corsHeaders });

        return errorFallbackRes;
    }
}
