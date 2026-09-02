export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const file = url.searchParams.get('file');
    const filename = url.searchParams.get('name') || 'track.mp3';

    if (!file || !file.startsWith('/assets/free-gifts/')) {
        return new Response('Invalid file parameter', { status: 400 });
    }

    // Sanitize filename for safe HTTP header usage
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._ -]/g, '_');

    // Fast-path for HEAD requests
    if (request.method === 'HEAD') {
        return new Response(null, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${cleanFilename}"`,
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });
    }

    try {
        let assetRes;
        if (context.env && context.env.ASSETS) {
            assetRes = await context.env.ASSETS.fetch(new URL(file, url.origin));
        } else {
            assetRes = await fetch(new URL(file, url.origin));
        }

        if (!assetRes.ok) {
            return new Response(`Track not found (${assetRes.status})`, { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Type", file.endsWith('.mp3') ? "audio/mpeg" : (assetRes.headers.get("content-type") || "application/octet-stream"));
        headers.set("Content-Disposition", `attachment; filename="${cleanFilename}"`);
        const len = assetRes.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(assetRes.body, {
            status: 200,
            headers
        });
    } catch (e) {
        return new Response(`Error downloading track: ${e.message}`, { status: 500 });
    }
}
