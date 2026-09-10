export async function onRequest(context) {
    const { request } = context;

    // Enforce allowed HTTP methods: only GET and HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: {
                'Allow': 'GET, HEAD',
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }

    const url = new URL(request.url);
    const rawFile = url.searchParams.get('file');
    const rawFilename = url.searchParams.get('name') || 'track.mp3';

    if (!rawFile) {
        return new Response('Missing file parameter', {
            status: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }

    // Decode and detect any path traversal attempts (e.g. .., %2e%2e, backslashes, null bytes)
    let decodedFile;
    try {
        decodedFile = decodeURIComponent(rawFile);
    } catch (_) {
        return new Response('Invalid file parameter encoding', {
            status: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }

    // Reject path manipulation or traversal patterns
    if (
        decodedFile.includes('..') ||
        decodedFile.includes('\\') ||
        decodedFile.includes('\0') ||
        decodedFile.includes('//')
    ) {
        return new Response('Invalid file path', {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }

    // Normalize path and ensure it strictly resides within /assets/free-gifts/
    let resolvedUrl;
    try {
        resolvedUrl = new URL(decodedFile, url.origin);
    } catch (_) {
        return new Response('Invalid file URL', {
            status: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }

    const normalizedPath = resolvedUrl.pathname;
    if (!normalizedPath.startsWith('/assets/free-gifts/') || !normalizedPath.endsWith('.mp3')) {
        return new Response('Forbidden file path or disallowed file type', {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }

    // Sanitize filename for safe Content-Disposition HTTP header usage
    const cleanFilename = rawFilename
        .replace(/[^a-zA-Z0-9._ -]/g, '_')
        .replace(/[\r\n]/g, '')
        .trim() || 'track.mp3';

    // Fast-path for HEAD requests
    if (request.method === 'HEAD') {
        return new Response(null, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${cleanFilename}"`,
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
                "X-Robots-Tag": "noindex, nofollow"
            }
        });
    }

    try {
        let assetRes;
        if (context.env && context.env.ASSETS) {
            assetRes = await context.env.ASSETS.fetch(resolvedUrl);
        } else {
            assetRes = await fetch(resolvedUrl);
        }

        if (!assetRes.ok) {
            return new Response('Track not found', {
                status: 404,
                headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
            });
        }

        const headers = new Headers();
        headers.set("Content-Type", "audio/mpeg");
        headers.set("Content-Disposition", `attachment; filename="${cleanFilename}"`);
        const len = assetRes.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Robots-Tag", "noindex, nofollow");

        return new Response(assetRes.body, {
            status: 200,
            headers
        });
    } catch (e) {
        console.error("[Download Track Error]", e && e.message ? e.message : "Unknown error");
        return new Response('Error processing download request', {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
        });
    }
}
