/**
 * Universal Secure Free Gifts Download Endpoint
 * Handles secure streaming of free gift PDFs, MP3s, and ZIP assets
 * with explicit Content-Disposition: attachment for native cross-platform downloads.
 */

export async function onRequest(context) {
    const { request, env } = context;

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
    const rawFilename = url.searchParams.get('name') || '';

    if (!rawFile) {
        return new Response('Missing file parameter', {
            status: 400,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    // Decode and detect any path traversal attempts
    let decodedFile;
    try {
        decodedFile = decodeURIComponent(rawFile);
    } catch (_) {
        return new Response('Invalid file parameter encoding', {
            status: 400,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    // Strict path traversal and security verification
    if (
        decodedFile.includes('..') ||
        decodedFile.includes('\\') ||
        decodedFile.includes('\0') ||
        decodedFile.includes('//')
    ) {
        return new Response('Invalid file path', {
            status: 403,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    // Normalize path and ensure it strictly resides within /assets/free-gifts/
    let resolvedUrl;
    try {
        resolvedUrl = new URL(decodedFile, url.origin);
    } catch (_) {
        return new Response('Invalid file URL', {
            status: 400,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    const normalizedPath = resolvedUrl.pathname;
    if (!normalizedPath.startsWith('/assets/free-gifts/')) {
        return new Response('Forbidden file path', {
            status: 403,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    // Whitelist allowed file extensions for free gifts
    const extMatch = normalizedPath.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    const mimeTypes = {
        'pdf': 'application/pdf',
        'mp3': 'audio/mpeg',
        'zip': 'application/zip',
        'bin': 'application/octet-stream',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
    };

    const contentType = mimeTypes[ext];
    if (!contentType) {
        return new Response('Disallowed file type', {
            status: 403,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }

    // Extract default filename from path if not provided
    const defaultFilename = normalizedPath.split('/').pop() || `download.${ext}`;
    const baseFilename = rawFilename ? rawFilename : defaultFilename;

    // Sanitize filename for safe Content-Disposition HTTP header usage (prevent CRLF injection & quotes)
    let cleanFilename = baseFilename
        .replace(/[^a-zA-Z0-9._ -]/g, '_')
        .replace(/[\r\n]/g, '')
        .trim();

    if (!cleanFilename.toLowerCase().endsWith(`.${ext}`)) {
        cleanFilename += `.${ext}`;
    }

    // Allow ?inline=1 for viewing in browser if requested, default to attachment
    const isInline = url.searchParams.get('inline') === '1';
    const disposition = isInline ? `inline; filename="${cleanFilename}"` : `attachment; filename="${cleanFilename}"`;

    // Fast-path for HEAD requests
    if (request.method === 'HEAD') {
        return new Response(null, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": disposition,
                "Cache-Control": "public, max-age=86400",
                "X-Content-Type-Options": "nosniff",
                "X-Robots-Tag": "noindex, nofollow"
            }
        });
    }

    try {
        let assetRes;
        if (env && env.ASSETS) {
            assetRes = await env.ASSETS.fetch(resolvedUrl);
        } else {
            assetRes = await fetch(resolvedUrl);
        }

        if (!assetRes.ok) {
            return new Response('Requested gift file not found', {
                status: 404,
                headers: { 
                    'Content-Type': 'text/plain; charset=utf-8', 
                    'X-Content-Type-Options': 'nosniff' 
                }
            });
        }

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Disposition", disposition);
        const len = assetRes.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        headers.set("Cache-Control", "public, max-age=86400");
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Robots-Tag", "noindex, nofollow");

        return new Response(assetRes.body, {
            status: 200,
            headers
        });
    } catch (e) {
        console.error("[Download Gift Error]", e && e.message ? e.message : "Unknown error");
        return new Response('Error processing gift download request', {
            status: 500,
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8', 
                'X-Content-Type-Options': 'nosniff' 
            }
        });
    }
}
