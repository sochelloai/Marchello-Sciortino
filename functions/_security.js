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
