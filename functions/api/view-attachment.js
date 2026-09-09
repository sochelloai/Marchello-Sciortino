/**
 * Secure Expiring Attachment Viewer & Downloader
 * 
 * Verifies HMAC-SHA256 signatures before streaming files from Cloudflare R2.
 * Enforces a 14-day link lifetime, 30-day retention, and strict sandboxed download headers.
 */

import {
    verifyAttachmentSignature,
    handleCorsPreflight,
    createErrorResponse
} from "../_security.js";

export async function onRequestOptions(context) {
    return handleCorsPreflight(context.request);
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);

    const key = url.searchParams.get("key");
    const exp = url.searchParams.get("exp");
    const name = url.searchParams.get("name") || "attachment";
    const sig = url.searchParams.get("sig");

    if (!key || !exp || !sig) {
        return createErrorResponse(400, "Missing required attachment access parameters.", false, request);
    }

    // 1. Verify cryptographic signature & expiration
    const verifyResult = await verifyAttachmentSignature(key, exp, name, sig, env);
    if (!verifyResult.valid) {
        return createErrorResponse(403, verifyResult.error || "Unauthorized attachment access request.", false, request);
    }

    // 2. Retrieve Cloudflare R2 bucket binding
    const r2Bucket = env ? (env.CONTACT_ATTACHMENTS || env.ATTACHMENTS_BUCKET || env.R2_ATTACHMENTS) : null;
    if (!r2Bucket || typeof r2Bucket.get !== "function") {
        console.error("[R2 Error] CONTACT_ATTACHMENTS binding missing or invalid.");
        return createErrorResponse(503, "Attachment storage service temporarily unavailable.", true, request);
    }

    // 3. Fetch object from private R2 storage
    const object = await r2Bucket.get(key);
    if (!object) {
        return createErrorResponse(404, "The requested attachment was not found or has expired under the 30-day retention policy.", false, request);
    }

    // 4. Sanitize download filename
    const safeName = (name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");

    // 5. Serve object stream with strict sandboxed security headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    headers.set("Cache-Control", "private, max-age=86400");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

    return new Response(object.body, {
        headers
    });
}
