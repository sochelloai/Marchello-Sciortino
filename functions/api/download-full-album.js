export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const origin = url.origin;

    const parts = [
        `${origin}/assets/free-gifts/win-anyway/album_part_1.bin`,
        `${origin}/assets/free-gifts/win-anyway/album_part_2.bin`,
        `${origin}/assets/free-gifts/win-anyway/album_part_3.bin`,
        `${origin}/assets/free-gifts/win-anyway/album_part_4.bin`
    ];

    try {
        const responses = await Promise.all(parts.map(p => fetch(p)));
        for (const res of responses) {
            if (!res.ok) {
                return new Response(`Failed to load album part (${res.status})`, { status: 500 });
            }
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        (async () => {
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
