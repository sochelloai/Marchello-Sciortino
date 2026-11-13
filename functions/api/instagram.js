/**
 * Cloudflare Pages Function: /api/instagram
 * Fetches the latest media from Marchello's Instagram feed using Meta / Instagram Graph APIs.
 * Supports:
 * - Current Meta Graph API versions (unversioned, v24.0, v22.0) + automatic Page / IG Business ID discovery
 * - Instagram Login API (graph.instagram.com) + automatic 60-day token refresh persisted to R2
 * - CAROUSEL_ALBUM children extraction and VIDEO/REELS thumbnail resolution (compliant with Meta's 2026 media_url rules)
 */

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

const DEFAULT_INSTAGRAM_BUSINESS_ID = "17841400436172857";
const R2_TOKEN_KEY = "_system/instagram-token-state.json";
const R2_FEED_CACHE_KEY = "_system/instagram-feed-cache.json";

function cleanEnvVar(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1).trim();
    }
    if (clean.toLowerCase().startsWith("bearer ")) {
        clean = clean.slice(7).trim();
    }
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    return clean;
}

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

async function readR2Json(env, key) {
    try {
        if (!env || !env.CONTACT_ATTACHMENTS || typeof env.CONTACT_ATTACHMENTS.get !== "function") {
            return null;
        }
        const obj = await env.CONTACT_ATTACHMENTS.get(key);
        if (!obj) return null;
        return await obj.json();
    } catch (_) {
        return null;
    }
}

async function writeR2Json(env, key, data) {
    try {
        if (!env || !env.CONTACT_ATTACHMENTS || typeof env.CONTACT_ATTACHMENTS.put !== "function") {
            return;
        }
        await env.CONTACT_ATTACHMENTS.put(key, JSON.stringify(data), {
            httpMetadata: { contentType: "application/json" }
        });
    } catch (_) {}
}

function isLikelyVideoStreamUrl(url) {
    if (!url || typeof url !== "string") return false;
    return /\.mp4(\?|$)/i.test(url) || /video/i.test(url.split("?")[0]);
}

function resolveDisplayImageUrl(item) {
    if (!item) return "";
    const mediaType = (item.media_type || "").toUpperCase();
    const productType = (item.media_product_type || "").toUpperCase();

    if (mediaType === "VIDEO" || productType === "REELS") {
        if (item.thumbnail_url) return item.thumbnail_url;
        if (item.media_url && !isLikelyVideoStreamUrl(item.media_url)) return item.media_url;
    }

    if (mediaType === "CAROUSEL_ALBUM") {
        if (item.media_url && !isLikelyVideoStreamUrl(item.media_url)) {
            return item.media_url;
        }
        if (item.thumbnail_url) {
            return item.thumbnail_url;
        }
        const children = item.children && Array.isArray(item.children.data) ? item.children.data : [];
        for (const child of children) {
            const cType = (child.media_type || "").toUpperCase();
            if (cType === "VIDEO" && child.thumbnail_url) return child.thumbnail_url;
            if (child.media_url && !isLikelyVideoStreamUrl(child.media_url)) return child.media_url;
            if (child.thumbnail_url) return child.thumbnail_url;
        }
    }

    if (item.media_url && !isLikelyVideoStreamUrl(item.media_url)) {
        return item.media_url;
    }
    if (item.thumbnail_url) {
        return item.thumbnail_url;
    }
    return "";
}

function classifyMetaError(metaErr, status) {
    if (!metaErr) return status === 401 || status === 403 ? "auth_error" : "upstream_error";
    const code = Number(metaErr.code);
    const msg = String(metaErr.message || "").toLowerCase();
    if (code === 190 || msg.includes("expired") || msg.includes("session has been invalidated")) {
        return "token_expired";
    }
    if (code === 10 || code === 200 || msg.includes("permission")) {
        return "permission_error";
    }
    if (code === 100 && (msg.includes("version") || msg.includes("deprecated"))) {
        return "api_version_error";
    }
    if (code === 100) {
        return "invalid_parameter_or_node";
    }
    return "upstream_error";
}

async function maybeRefreshAndPersistToken(env, workingToken, sourceHost, discoveredPageToken, discoveredIgBusinessId) {
    const now = Date.now();
    const existing = await readR2Json(env, R2_TOKEN_KEY);

    // If we discovered a permanent Page Access Token via /me/accounts, store it so it never expires
    if (discoveredPageToken) {
        await writeR2Json(env, R2_TOKEN_KEY, {
            token: discoveredPageToken,
            token_type: "page_permanent",
            ig_business_id: discoveredIgBusinessId || DEFAULT_INSTAGRAM_BUSINESS_ID,
            updated_at: now
        });
        return;
    }

    const isIgToken = workingToken.startsWith("IG") || workingToken.startsWith("ig") || sourceHost === "graph.instagram.com";
    const lastRefreshed = existing && existing.refreshed_at ? Number(existing.refreshed_at) : 0;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (isIgToken && (now - lastRefreshed > sevenDaysMs)) {
        try {
            const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(workingToken)}`;
            const res = await fetch(refreshUrl);
            if (res.ok) {
                const j = await res.json();
                if (j && j.access_token) {
                    await writeR2Json(env, R2_TOKEN_KEY, {
                        token: cleanEnvVar(j.access_token),
                        token_type: "ig_long_lived",
                        expires_in: j.expires_in || 5184000,
                        refreshed_at: now,
                        updated_at: now
                    });
                    return;
                }
            }
        } catch (_) {}
    }

    if (!existing || existing.token !== workingToken) {
        await writeR2Json(env, R2_TOKEN_KEY, {
            token: workingToken,
            token_type: isIgToken ? "ig_long_lived" : "meta_graph",
            ig_business_id: discoveredIgBusinessId || DEFAULT_INSTAGRAM_BUSINESS_ID,
            refreshed_at: lastRefreshed || now,
            updated_at: now
        });
    }
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const requestUrl = new URL(request.url);
    const bypassCache = requestUrl.searchParams.has("nocache") || request.headers.get("cache-control") === "no-cache";

    const cache = typeof caches !== "undefined" ? caches.default : null;
    const cacheKey = new Request(requestUrl.toString(), request);
    if (!bypassCache && cache) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
    }

    const envToken = getEnvVal(env, "INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_TOKEN", "INSTA_ACCESS_TOKEN", "IG_ACCESS_TOKEN", "INSTAGRAM_API_KEY");
    const configuredBusinessId = getEnvVal(env, "INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_BUSINESS_ID", "INSTAGRAM_ACCOUNT_ID") || DEFAULT_INSTAGRAM_BUSINESS_ID;

    // Also check R2 persisted auto-refreshed token state
    const r2TokenState = await readR2Json(env, R2_TOKEN_KEY);
    const r2Token = r2TokenState && r2TokenState.token ? cleanEnvVar(r2TokenState.token) : "";
    const r2BusinessId = (r2TokenState && r2TokenState.ig_business_id) ? cleanEnvVar(r2TokenState.ig_business_id) : "";

    // Build prioritized list of distinct tokens to try (newest R2 refreshed token + Cloudflare env secret)
    const tokensToTry = [...new Set([r2Token, envToken].filter(Boolean))];

    const corsHeaders = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
        "X-Content-Type-Options": "nosniff"
    };

    const noCacheHeaders = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff"
    };

    if (tokensToTry.length === 0) {
        return new Response(JSON.stringify({
            source: "fallback",
            status: "missing_secret",
            reason: "missing_secret",
            message: "Displaying featured posts.",
            data: FALLBACK_POSTS
        }), {
            status: 200,
            headers: noCacheHeaders
        });
    }

    const richFields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}";
    const basicFields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

    let payload = null;
    let winningToken = "";
    let winningHost = "";
    let discoveredPageToken = "";
    let discoveredIgId = r2BusinessId || configuredBusinessId;
    let lastErrorStatus = null;
    let lastMetaError = null;
    const candidateSummary = [];

    try {
        for (const token of tokensToTry) {
            const isInstagramToken = token.startsWith("IG") || token.startsWith("ig");
            const encodedToken = encodeURIComponent(token);
            const candidates = [];

            if (isInstagramToken) {
                candidates.push({
                    host: "graph.instagram.com",
                    url: `https://graph.instagram.com/me/media?fields=${richFields}&limit=24&access_token=${encodedToken}`
                });
                candidates.push({
                    host: "graph.instagram.com",
                    url: `https://graph.instagram.com/v22.0/me/media?fields=${basicFields}&limit=24&access_token=${encodedToken}`
                });
                candidates.push({
                    host: "graph.instagram.com",
                    url: `https://graph.instagram.com/me/media?fields=${basicFields}&limit=24&access_token=${encodedToken}`
                });
            }

            // Active Meta Graph API endpoints (v24.0, v22.0, and unversioned — replacing retired v19.0/v20.0)
            for (const igId of [...new Set([discoveredIgId, configuredBusinessId, DEFAULT_INSTAGRAM_BUSINESS_ID].filter(Boolean))]) {
                candidates.push({
                    host: "graph.facebook.com",
                    url: `https://graph.facebook.com/v22.0/${igId}/media?fields=${richFields}&limit=24&access_token=${encodedToken}`
                });
                candidates.push({
                    host: "graph.facebook.com",
                    url: `https://graph.facebook.com/v24.0/${igId}/media?fields=${basicFields}&limit=24&access_token=${encodedToken}`
                });
                candidates.push({
                    host: "graph.facebook.com",
                    url: `https://graph.facebook.com/${igId}/media?fields=${basicFields}&limit=24`,
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }

            if (!isInstagramToken) {
                candidates.push({
                    host: "graph.instagram.com",
                    url: `https://graph.instagram.com/me/media?fields=${basicFields}&limit=24&access_token=${encodedToken}`
                });
            }

            for (const candidate of candidates) {
                try {
                    const fetchOptions = { method: "GET" };
                    if (candidate.headers) fetchOptions.headers = candidate.headers;

                    const urlObj = new URL(candidate.url);
                    const response = await fetch(candidate.url, fetchOptions);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && Array.isArray(data.data) && data.data.length > 0) {
                            payload = data;
                            winningToken = token;
                            winningHost = candidate.host;
                            break;
                        }
                    } else {
                        lastErrorStatus = response.status;
                        let errSnippet = `status ${response.status}`;
                        try {
                            const errJson = await response.json();
                            if (errJson && errJson.error) {
                                lastMetaError = {
                                    message: errJson.error.message || "Meta API error",
                                    type: errJson.error.type || "",
                                    code: errJson.error.code || response.status,
                                    subcode: errJson.error.error_subcode || null
                                };
                                errSnippet = `code ${errJson.error.code} (sub ${errJson.error.error_subcode || "none"}): ${errJson.error.message}`;
                                console.error(`[Instagram API] ${urlObj.hostname}${urlObj.pathname} -> ${errSnippet}`);
                            }
                        } catch (_) {}
                        candidateSummary.push(`${urlObj.hostname}${urlObj.pathname} (${errSnippet})`);
                    }
                } catch (candErr) {
                    console.error("[Instagram Candidate Error]", candErr && candErr.message ? candErr.message : candErr);
                }
            }

            if (payload) break;

            // If direct /{ig-user-id}/media failed on a Facebook User/System token, try discovering Page Token & IG Business Account via /me/accounts
            if (!isInstagramToken) {
                try {
                    const accountsUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token,instagram_business_account{id}&limit=25&access_token=${encodedToken}`;
                    const accRes = await fetch(accountsUrl);
                    if (accRes.ok) {
                        const accData = await accRes.json();
                        const pages = (accData && Array.isArray(accData.data)) ? accData.data : [];
                        for (const page of pages) {
                            const pageIgId = page?.instagram_business_account?.id;
                            const pageToken = page?.access_token ? cleanEnvVar(page.access_token) : token;
                            if (pageIgId) {
                                const mediaUrl = `https://graph.facebook.com/v22.0/${pageIgId}/media?fields=${richFields}&limit=24&access_token=${encodeURIComponent(pageToken)}`;
                                const mRes = await fetch(mediaUrl);
                                if (mRes.ok) {
                                    const mData = await mRes.json();
                                    if (mData && Array.isArray(mData.data) && mData.data.length > 0) {
                                        payload = mData;
                                        winningToken = pageToken;
                                        winningHost = "graph.facebook.com";
                                        discoveredPageToken = page?.access_token ? pageToken : "";
                                        discoveredIgId = pageIgId;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (_) {}
            }

            if (payload) break;
        }

        if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) {
            const summaryStr = candidateSummary.length > 0 ? candidateSummary.join(" | ") : "No candidates succeeded";
            console.error(`[Instagram API Summary] ${summaryStr}`);
            throw new Error("Instagram API returned no live media");
        }

        const posts = payload.data
            .map(item => {
                const displayUrl = resolveDisplayImageUrl(item);
                if (!displayUrl) return null;
                const mediaType = (item.media_type || "IMAGE").toUpperCase();
                const productType = (item.media_product_type || "").toUpperCase();
                return {
                    id: item.id,
                    media_url: displayUrl,
                    permalink: item.permalink || "https://www.instagram.com/marchellosciortino/",
                    caption: item.caption || "Follow Marchello on Instagram",
                    media_type: productType === "REELS" ? "VIDEO" : mediaType,
                    timestamp: item.timestamp || ""
                };
            })
            .filter(Boolean);

        if (posts.length === 0) {
            throw new Error("No renderable media URLs found in Instagram payload");
        }

        // Background: refresh token if needed + save last-known-good live feed snapshot to R2
        if (context.waitUntil) {
            context.waitUntil((async () => {
                await maybeRefreshAndPersistToken(env, winningToken, winningHost, discoveredPageToken, discoveredIgId);
                await writeR2Json(env, R2_FEED_CACHE_KEY, {
                    updated_at: Date.now(),
                    posts
                });
            })());
        }

        const successRes = new Response(JSON.stringify({
            source: "live",
            status: "active",
            count: posts.length,
            data: posts
        }), { status: 200, headers: corsHeaders });

        if (!bypassCache && cache) {
            context.waitUntil(cache.put(cacheKey, successRes.clone()));
        }
        return successRes;

    } catch (error) {
        console.error("[Instagram Fetch Exception]", error && error.message ? error.message : "Unknown error");

        // Check if R2 has a recent last-known-good live feed snapshot (< 72h old so signed CDN URLs are still valid)
        const cachedFeed = await readR2Json(env, R2_FEED_CACHE_KEY);
        const maxStaleMs = 72 * 60 * 60 * 1000;
        if (cachedFeed && Array.isArray(cachedFeed.posts) && cachedFeed.posts.length > 0 && (Date.now() - Number(cachedFeed.updated_at || 0) < maxStaleMs)) {
            return new Response(JSON.stringify({
                source: "live_cached",
                status: "active_cached",
                reason: classifyMetaError(lastMetaError, lastErrorStatus),
                data: cachedFeed.posts
            }), { status: 200, headers: noCacheHeaders });
        }

        const reason = classifyMetaError(lastMetaError, lastErrorStatus);
        return new Response(JSON.stringify({
            source: "fallback_on_error",
            status: "api_error",
            reason,
            meta_code: lastMetaError ? lastMetaError.code : null,
            meta_subcode: lastMetaError ? lastMetaError.subcode : null,
            message: "Could not load live feed. Displaying featured posts.",
            data: FALLBACK_POSTS
        }), { status: 200, headers: noCacheHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-Content-Type-Options": "nosniff"
        }
    });
}
