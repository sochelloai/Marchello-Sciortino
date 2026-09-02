export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const origin = url.origin;

    // Fast-path for HEAD requests
    if (request.method === 'HEAD') {
        return new Response(null, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="Win_Anyway_Full_Album.zip"',
                "Content-Length": "66156645",
                "Cache-Control": "public, max-age=86400"
            }
        });
    }

    const partPaths = [
        '/assets/free-gifts/win-anyway/album_part_1.bin',
        '/assets/free-gifts/win-anyway/album_part_2.bin',
        '/assets/free-gifts/win-anyway/album_part_3.bin',
        '/assets/free-gifts/win-anyway/album_part_4.bin'
    ];

    try {
        const fetchPart = async (partPath) => {
            if (context.env && context.env.ASSETS) {
                return context.env.ASSETS.fetch(new URL(partPath, origin));
            }
            return fetch(new URL(partPath, origin));
        };

        const responses = await Promise.all(partPaths.map(p => fetchPart(p)));
        for (const res of responses) {
            if (!res.ok) {
                return new Response(`Failed to load album part (${res.status})`, { status: 500 });
            }
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        const streamPromise = (async () => {
            try {
                for (const res of responses) {
                    const reader = res.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writer.write(value);
                    }
                }
            } catch (err) {
                console.error('[Stream Error]', err);
            } finally {
                await writer.close();
            }
        })();

        if (context.waitUntil) {
            context.waitUntil(streamPromise);
        }

        return new Response(readable, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="Win_Anyway_Full_Album.zip"',
                "Content-Length": "66156645",
                "Cache-Control": "public, max-age=86400"
            }
        });
    } catch (e) {
        return new Response(`Error assembling album: ${e.message}`, { status: 500 });
    }
}
