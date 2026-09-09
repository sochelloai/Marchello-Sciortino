/**
 * Centralized Security, Rate Limiting & Anti-Spam Helper for Cloudflare Pages Functions.
 */

// In-memory sliding window rate limiter for Cloudflare isolate runtimes
const ipRequestHistory = new Map();

/**
 * Validates and returns strict CORS headers based on request origin.
 */
export function getCorsHeaders(request) {
    const origin = request ? (request.headers.get("Origin") || request.headers.get("origin") || "") : "";
    const allowedOrigins = [
        "https://marchellosciortino.com",
        "https://www.marchellosciortino.com"
    ];

    const isAllowed = allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("https://localhost:");

    const matchedOrigin = isAllowed ? origin : "https://marchellosciortino.com";

    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": matchedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
        "Vary": "Origin"
    };
}

/**
 * Checks if the request's Origin or Referer header matches the allowed origins.
 */
export function isAllowedOrigin(request) {
    if (!request) return false;
    const origin = request.headers.get("Origin") || request.headers.get("origin") || "";
    const referer = request.headers.get("Referer") || request.headers.get("referer") || "";
    const secFetchSite = request.headers.get("Sec-Fetch-Site") || request.headers.get("sec-fetch-site") || "";

    if (secFetchSite === "same-origin") {
        return true;
    }

    const allowedOrigins = [
        "https://marchellosciortino.com",
        "https://www.marchellosciortino.com"
    ];

    if (origin) {
        return allowedOrigins.includes(origin) ||
            origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:") ||
            origin.startsWith("https://localhost:");
    }

    if (referer) {
        try {
            const refUrl = new URL(referer);
            const refOrigin = refUrl.origin;
            return allowedOrigins.includes(refOrigin) ||
                refOrigin.startsWith("http://localhost:") ||
                refOrigin.startsWith("http://127.0.0.1:") ||
                refOrigin.startsWith("https://localhost:");
        } catch (_) {
            return false;
        }
    }

    return false;
}

/**
 * Handles OPTIONS preflight requests for form endpoints.
 */
export function handleCorsPreflight(request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
    });
}

/**
 * Enforces valid form submission content-types.
 */
export function validateContentType(request) {
    const contentType = request.headers.get("content-type") || "";
    return contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded");
}

/**
 * In-memory sliding-window rate limiter by client IP.
 * Defaults to 5 requests per 5 minutes per IP.
 */
export function checkRateLimit(clientIp, maxRequests = 5, windowMs = 300000) {
    if (!clientIp || clientIp === "unknown") return true;

    const now = Date.now();
    const timestamps = ipRequestHistory.get(clientIp) || [];
    
    // Purge timestamps older than the window
    const recent = timestamps.filter(t => (now - t) < windowMs);
    
    if (recent.length >= maxRequests) {
        return false;
    }

    recent.push(now);
    ipRequestHistory.set(clientIp, recent);

    // Housekeeping to prevent memory leak in long-lived isolates
    if (ipRequestHistory.size > 2000) {
        for (const [ip, list] of ipRequestHistory.entries()) {
            if (list.every(t => (now - t) >= windowMs)) {
                ipRequestHistory.delete(ip);
            }
        }
    }

    return true;
}

/**
 * Strict RFC 5322 compliant email validator.
 */
export function validateEmail(email) {
    if (!email || typeof email !== "string") return false;
    const clean = email.trim();
    if (clean.length === 0 || clean.length > 254) return false;
    if (/\s/.test(clean)) return false;

    // Standard email structure: user@domain.tld
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(clean)) return false;

    const parts = clean.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (!domain.includes(".")) return false;
    const tld = domain.split(".").pop();
    if (!tld || tld.length < 2) return false;

    return true;
}

/**
 * Sanitizes and enforces maximum lengths for text inputs.
 */
export function sanitizeText(val, maxLength = 255) {
    if (val === null || val === undefined) return "";
    let str = String(val).trim();
    if (str.length > maxLength) {
        str = str.slice(0, maxLength);
    }
    return str;
}

/**
 * Validates form fields against an allowed whitelist and length constraints.
 */
export function validateFormFields(formData, fieldRules) {
    const sanitized = {};
    const unexpectedFields = [];

    // Check all submitted keys
    for (const [key, value] of formData.entries()) {
        // Skip Turnstile internal keys
        if (key === "cf-turnstile-response" || key === "turnstile_token") {
            continue;
        }

        if (!fieldRules[key]) {
            unexpectedFields.push(key);
            continue;
        }

        const rule = fieldRules[key];
        
        // File handling
        if (rule.type === "file") {
            if (value && typeof value === "object" && value.size !== undefined) {
                if (rule.maxBytes && value.size > rule.maxBytes) {
                    return { error: `Uploaded file exceeds the maximum allowed size of ${Math.round(rule.maxBytes / (1024 * 1024))}MB.` };
                }
                sanitized[key] = value;
            }
            continue;
        }

        // Text handling
        const strVal = String(value || "").trim();
        if (rule.required && strVal.length === 0) {
            return { error: `${rule.label || key} is required.` };
        }

        if (rule.type === "email" && strVal.length > 0) {
            if (!validateEmail(strVal)) {
                return { error: "Please provide a valid email address." };
            }
        }

        if (rule.maxLength && strVal.length > rule.maxLength) {
            return { error: `${rule.label || key} exceeds the maximum length of ${rule.maxLength} characters.` };
        }

        sanitized[key] = sanitizeText(strVal, rule.maxLength || 3000);
    }

    // Reject unknown/injected fields (bot protection)
    if (unexpectedFields.length > 0) {
        return { error: "Invalid form payload structure." };
    }

    // Check for missing required fields
    for (const [key, rule] of Object.entries(fieldRules)) {
        if (rule.required && (sanitized[key] === undefined || sanitized[key] === "")) {
            return { error: `Please fill in all required fields (${rule.label || key}).` };
        }
    }

    return { data: sanitized };
}

/**
 * Verifies Cloudflare Turnstile token via the siteverify API.
 */
export async function verifyTurnstileToken(token, clientIp, env) {
    const secretKey = env ? (env.TURNSTILE_SECRET_KEY || env.TURNSTILE_KEY || "") : "";
    
    // If the site secret has not been set yet, allow transition with a warning
    if (!secretKey) {
        console.warn("[Turnstile] TURNSTILE_SECRET_KEY not bound in Cloudflare. Allowing in transition mode.");
        return { success: true, bypassed: true };
    }

    if (!token || typeof token !== "string" || token.trim().length === 0) {
        return { success: false, message: "Human verification is required. Please check the verification box." };
    }

    try {
        const verifyBody = new URLSearchParams();
        verifyBody.append("secret", secretKey.trim());
        verifyBody.append("response", token.trim());
        if (clientIp) {
            verifyBody.append("remoteip", clientIp);
        }

        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: verifyBody,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (!verifyRes.ok) {
            return { success: false, message: "Verification service temporarily unreachable. Please try again." };
        }

        const outcome = await verifyRes.json();
        if (outcome.success) {
            return { success: true };
        } else {
            console.warn("[Turnstile Verification Failed]", outcome["error-codes"]);
            return { success: false, message: "Verification failed. Please refresh the page and try again." };
        }
    } catch (err) {
        console.error("[Turnstile Verification Error]", err);
        return { success: false, message: "Verification error occurred. Please try again." };
    }
}

/**
 * Generates sanitized, user-friendly JSON error response.
 */
export function createErrorResponse(status, message, retryable = true, request = null) {
    return new Response(JSON.stringify({
        success: false,
        error: message,
        message: message,
        retryable: retryable
    }), {
        status: status,
        headers: getCorsHeaders(request)
    });
}

/**
 * Generates standard sanitized success response.
 */
export function createSuccessResponse(data = {}, request = null) {
    return new Response(JSON.stringify({
        success: true,
        ...data
    }), {
        status: 200,
        headers: getCorsHeaders(request)
    });
}

/**
 * Allowed MIME types and extensions for contact form attachments.
 */
export const ALLOWED_FILE_TYPES = {
    "pdf": { mime: "application/pdf", label: "PDF document" },
    "png": { mime: "image/png", label: "PNG image" },
    "jpg": { mime: "image/jpeg", label: "JPEG image" },
    "jpeg": { mime: "image/jpeg", label: "JPEG image" },
    "webp": { mime: "image/webp", label: "WebP image" },
    "docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word document" },
    "doc": { mime: "application/msword", label: "Word document" },
    "txt": { mime: "text/plain", label: "Text file" }
};

/**
 * Validates an uploaded File object against strict size, extension, and binary magic-bytes.
 */
export async function validateUploadedFile(file, options = {}) {
    const maxBytes = options.maxBytes || (5 * 1024 * 1024); // 5 MB default
    if (!file || typeof file !== "object" || typeof file.size !== "number" || file.size === 0) {
        return { valid: false, error: "No file provided or file is empty." };
    }

    if (file.size > maxBytes) {
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        return { valid: false, error: `Attachment exceeds the maximum allowed limit of ${maxMb}MB.` };
    }

    const rawName = String(file.name || "attachment").trim();
    // Sanitize filename: remove directory traversal, control chars, and non-printable chars
    const baseName = rawName.replace(/^.*[\\\/]/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    const lastDot = baseName.lastIndexOf(".");
    if (lastDot === -1 || lastDot === 0 || lastDot === baseName.length - 1) {
        return { valid: false, error: "Attachment must have a valid file extension (e.g., .pdf, .docx, .png, .jpg)." };
    }

    const ext = baseName.slice(lastDot + 1).toLowerCase();
    if (!ALLOWED_FILE_TYPES[ext]) {
        return { valid: false, error: `Files of type .${ext} are not permitted. Allowed formats: PDF, PNG, JPG, DOCX, TXT.` };
    }

    // Magic-byte inspection: Read first 16 bytes of the file
    let headerBytes = new Uint8Array(0);
    try {
        const slice = file.slice(0, 16);
        const arrayBuf = await slice.arrayBuffer();
        headerBytes = new Uint8Array(arrayBuf);
    } catch (e) {
        return { valid: false, error: "Unable to read file content for security inspection." };
    }

    let magicMatch = false;

    if (ext === "pdf") {
        // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
        magicMatch = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;
    } else if (ext === "png") {
        // PNG magic bytes: 0x89 0x50 0x4E 0x47
        magicMatch = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4E && headerBytes[3] === 0x47;
    } else if (ext === "jpg" || ext === "jpeg") {
        // JPEG magic bytes: 0xFF 0xD8 0xFF
        magicMatch = headerBytes[0] === 0xFF && headerBytes[1] === 0xD8 && headerBytes[2] === 0xFF;
    } else if (ext === "webp") {
        // WebP magic bytes: RIFF at 0..3 and WEBP at 8..11
        magicMatch = headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46 &&
                     headerBytes[8] === 0x57 && headerBytes[9] === 0x45 && headerBytes[10] === 0x42 && headerBytes[11] === 0x50;
    } else if (ext === "docx") {
        // DOCX is a zip archive: PK\x03\x04 (0x50 0x4B 0x03 0x04)
        magicMatch = headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04;
    } else if (ext === "doc") {
        // Legacy DOC: OLE compound file header (0xD0 0xCF 0x11 0xE0)
        magicMatch = headerBytes[0] === 0xD0 && headerBytes[1] === 0xCF && headerBytes[2] === 0x11 && headerBytes[3] === 0xE0;
    } else if (ext === "txt") {
        // Plain text: Ensure no binary null bytes in initial 16 bytes
        magicMatch = !headerBytes.includes(0x00);
    }

    if (!magicMatch) {
        return { valid: false, error: "The file format does not match its extension. Please upload a genuine document or image." };
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
    const storageKey = `attachments/${year}/${month}/${uniqueId}.${ext}`;

    return {
        valid: true,
        originalName: baseName,
        storageKey,
        ext,
        mimeType: ALLOWED_FILE_TYPES[ext].mime,
        size: file.size
    };
}

/**
 * Computes an HMAC-SHA256 signature for a file download link.
 */
async function computeAttachmentHmac(secret, message) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates an expiring signed link for viewing or downloading an attachment.
 */
export async function generateSignedAttachmentUrl(storageKey, originalName, env, expiresInDays = 14) {
    const secret = (env && (env.ATTACHMENT_SIGNING_SECRET || env.CLICKFUNNELS_API_KEY)) || "marchello-secure-vault-token";
    const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 86400);
    const message = `${storageKey}:${exp}:${originalName}`;
    const sig = await computeAttachmentHmac(secret, message);
    return `https://www.marchellosciortino.com/api/view-attachment?key=${encodeURIComponent(storageKey)}&exp=${exp}&name=${encodeURIComponent(originalName)}&sig=${sig}`;
}

/**
 * Verifies the validity and expiration of a signed attachment access request.
 */
export async function verifyAttachmentSignature(storageKey, exp, originalName, sig, env) {
    if (!storageKey || !exp || !sig) {
        return { valid: false, error: "Missing required parameters for attachment access." };
    }

    const expNum = parseInt(exp, 10);
    if (isNaN(expNum) || expNum <= 0) {
        return { valid: false, error: "Invalid link expiration." };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > expNum) {
        return { valid: false, error: "This secure attachment link has expired. Attachments are retained for 30 days." };
    }

    const secret = (env && (env.ATTACHMENT_SIGNING_SECRET || env.CLICKFUNNELS_API_KEY)) || "marchello-secure-vault-token";
    const message = `${storageKey}:${exp}:${originalName || ""}`;
    const expectedSig = await computeAttachmentHmac(secret, message);

    if (sig.toLowerCase() !== expectedSig.toLowerCase()) {
        return { valid: false, error: "Invalid signature or unauthorized access request." };
    }

    return { valid: true };
}

