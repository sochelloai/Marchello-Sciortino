export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrlStr = url.searchParams.get("url");

    if (!targetUrlStr) {
        return new Response("Missing url parameter", { status: 400 });
    }

    try {
        const targetUrl = new URL(targetUrlStr);
        const host = targetUrl.hostname.toLowerCase();

        // Security check: restrict proxy to allowed portfolio domains
        const allowedDomains = [
            "limitationstoliberation.com",
            "www.limitationstoliberation.com",
            "jesus-bello.pages.dev",
            "ai-song-quiz-app.pages.dev",
            "stlmc-website.pages.dev"
        ];

        const isAllowed = allowedDomains.some(domain => host === domain || host.endsWith("." + domain));
        if (!isAllowed) {
            return new Response("Forbidden: This proxy is restricted to allowed portfolio domains only.", { status: 403 });
        }

        // Fetch target webpage
        const response = await fetch(targetUrlStr, {
            headers: {
                "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        // Strip framing-restrictive headers
        const newHeaders = new Headers(response.headers);
        newHeaders.delete("content-security-policy");
        newHeaders.delete("x-frame-options");
        
        // Ensure framing is allowed and CORS headers are set
        newHeaders.set("Access-Control-Allow-Origin", "*");
        
        let html = await response.text();

        // Inject <base href="..."> inside <head> to resolve all relative assets
        const baseTag = `<base href="${targetUrl.origin}${targetUrl.pathname}">`;
        if (html.includes("<head>")) {
            html = html.replace("<head>", `<head>${baseTag}`);
        } else if (html.includes("<html>")) {
            html = html.replace("<html>", `<html><head>${baseTag}</head>`);
        } else {
            html = baseTag + html;
        }

        return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    } catch (err) {
        return new Response("Proxy error: " + err.message, { status: 500 });
    }
}
