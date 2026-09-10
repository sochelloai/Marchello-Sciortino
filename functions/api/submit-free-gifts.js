function cleanEnvVar(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    return clean.trim();
}

function cleanWorkspaceId(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    clean = clean.trim();
    const match = clean.match(/\/workspaces\/(\d+)/);
    if (match) {
        return match[1];
    }
    const digitMatch = clean.match(/\b\d+\b/);
    if (digitMatch) {
        return digitMatch[0];
    }
    return clean;
}

function getEnvVal(env, keyName) {
    if (!env) return "";
    if (env[keyName] !== undefined) return env[keyName];
    const keys = Object.keys(env);
    for (const k of keys) {
        if (k.trim().toLowerCase() === keyName.toLowerCase()) {
            return env[k];
        }
    }
    return "";
}

import {
    handleCorsPreflight,
    validateContentType,
    checkRateLimit,
    validateFormFields,
    verifyTurnstileToken,
    createErrorResponse,
    createSuccessResponse,
    logSanitizedError
} from "../_security.js";

export async function onRequestOptions(context) {
    return handleCorsPreflight(context.request);
}

export async function onRequestPost(context) {
    const { env, request } = context;

    // 1. Content-Type Validation
    if (!validateContentType(request)) {
        return createErrorResponse(415, "Unsupported form media type. Please submit standard form data.", false, request);
    }

    // 2. Server-Side Rate Limiting (5 requests per 5 minutes per IP)
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(clientIp, 5, 300000)) {
        return createErrorResponse(429, "Too many unlock attempts. Please wait a few minutes before trying again.", true, request);
    }

    // Retrieve ClickFunnels credentials from environment variables / secrets
    const apiKey = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_API_KEY"));
    const subdomain = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_SUBDOMAIN"));
    const workspaceId = cleanWorkspaceId(getEnvVal(env, "CLICKFUNNELS_WORKSPACE_ID"));
    const primaryTagName = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_FREE_GIFTS_TAG_NAME")) || 
                           cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_TAG_NAME")) || 
                           "free-gifts";

    // Configuration Validation (Friendly visitor error without leaking internal secret names)
    if (!apiKey || !subdomain || !workspaceId) {
        console.error("[Configuration Error] Missing ClickFunnels credentials in environment.");
        return createErrorResponse(500, "The download unlock service is temporarily unavailable. Please try again later.", true, request);
    }

    try {
        const formData = await request.formData();
        const turnstileToken = formData.get("cf-turnstile-response") || formData.get("turnstile_token") || "";

        // 3. Cloudflare Turnstile Verification
        const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp, env);
        if (!turnstileResult.success) {
            return createErrorResponse(403, turnstileResult.message, true, request);
        }

        // 4. Field Validation & Length Limits
        const fieldRules = {
            email: { type: "email", required: true, maxLength: 254, label: "Email" },
            gift_title: { type: "text", required: false, maxLength: 200, label: "Gift Title" },
            item: { type: "text", required: false, maxLength: 200, label: "Item Title" }
        };

        const validation = validateFormFields(formData, fieldRules);
        if (validation.error) {
            return createErrorResponse(400, validation.error, true, request);
        }

        const email = validation.data.email;
        const giftTitle = validation.data.gift_title || validation.data.item || "";

        // Sanitize the subdomain if full URL is supplied
        let cleanSubdomain = subdomain.trim();
        if (cleanSubdomain.includes("://")) {
            cleanSubdomain = cleanSubdomain.split("://")[1];
        }
        if (cleanSubdomain.includes(".")) {
            cleanSubdomain = cleanSubdomain.split(".")[0];
        }

        const commonHeaders = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MarchelloSciortinoWebsite/1.0"
        };

        const cleanWorkspaceId = workspaceId;

        // --- STEP 1: Find or Create Tag ID for Free Gifts ---
        let tagId = null;
        let resolvedTagName = primaryTagName;

        const normalizeTag = (str) => (str || "").toLowerCase().replace(/[\s_-]+/g, "");
        const targetNorm = normalizeTag(primaryTagName);

        // 1a. List existing workspace tags to locate any matching tag
        const listTagsUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags`;
        try {
            const tagsResponse = await fetch(listTagsUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (tagsResponse.ok) {
                const tagsData = await tagsResponse.json();
                const tagsList = Array.isArray(tagsData) ? tagsData : (tagsData.contacts_tags || tagsData.tags || []);
                
                let matched = tagsList.find(t => t.name && t.name.toLowerCase() === primaryTagName.toLowerCase());
                if (!matched) {
                    matched = tagsList.find(t => t.name && normalizeTag(t.name) === targetNorm);
                }
                if (!matched) {
                    matched = tagsList.find(t => t.name && (normalizeTag(t.name) === "freegifts" || normalizeTag(t.name) === "freegift"));
                }

                if (matched) {
                    tagId = parseInt(matched.id, 10);
                    resolvedTagName = matched.name;
                }
            } else {
                await logErrorResponse("List Workspace Tags", tagsResponse);
            }
        } catch (tagListErr) {
            console.error("[ClickFunnels] Error fetching tags list:", tagListErr);
        }

        // 1b. If not found in workspace list, try query filter fallback
        if (!tagId) {
            try {
                const filterUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags?filter%5Bname%5D=${encodeURIComponent(primaryTagName)}`;
                const filterResponse = await fetch(filterUrl, {
                    method: "GET",
                    headers: commonHeaders
                });
                if (filterResponse.ok) {
                    const filterData = await filterResponse.json();
                    const list = Array.isArray(filterData) ? filterData : (filterData.contacts_tags || filterData.tags || []);
                    if (list.length > 0 && list[0].id) {
                        tagId = parseInt(list[0].id, 10);
                        resolvedTagName = list[0].name;
                    }
                }
            } catch (filterErr) {
                console.error("[ClickFunnels] Error querying tag filter:", filterErr);
            }
        }

        // 1c. If tag still does not exist, create it with a valid 6-character hex color code
        if (!tagId) {
            try {
                const createTagUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags`;
                const createTagResponse = await fetch(createTagUrl, {
                    method: "POST",
                    headers: commonHeaders,
                    body: JSON.stringify({
                        contacts_tag: {
                            name: primaryTagName,
                            color: "#0AD8AD"
                        }
                    })
                });

                if (createTagResponse.ok) {
                    const newTagData = await createTagResponse.json();
                    tagId = parseInt(newTagData.id, 10);
                    resolvedTagName = newTagData.name || primaryTagName;
                } else {
                    const errBody = await logErrorResponse("Create Tag", createTagResponse);
                    if (createTagResponse.status === 422 || errBody.includes("taken")) {
                        const retryList = await fetch(listTagsUrl, { method: "GET", headers: commonHeaders });
                        if (retryList.ok) {
                            const rData = await retryList.json();
                            const rList = Array.isArray(rData) ? rData : (rData.contacts_tags || rData.tags || []);
                            const rMatch = rList.find(t => t.name && (t.name.toLowerCase() === primaryTagName.toLowerCase() || normalizeTag(t.name) === targetNorm));
                            if (rMatch) {
                                tagId = parseInt(rMatch.id, 10);
                                resolvedTagName = rMatch.name;
                            }
                        }
                    }
                }
            } catch (createErr) {
                console.error("[ClickFunnels] Error creating tag:", createErr);
            }
        }

        // --- STEP 2: Create or Update Contact with Tag and Custom Attributes ---
        let contactId = null;
        const createContactUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts`;
        
        const customAttributes = {
            unlocked_free_gifts: "true"
        };
        if (giftTitle) {
            customAttributes.last_unlocked_gift = giftTitle;
        }

        const contactPayload = {
            email_address: email,
            custom_attributes: customAttributes
        };

        const contactBody = { contact: contactPayload };

        const contactResponse = await fetch(createContactUrl, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify(contactBody)
        });

        if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            contactId = contactData.id || contactData.public_id;
        } else {
            await logErrorResponse("Create Contact", contactResponse);
            // Fallback: If contact already exists or fails, try to fetch it by email address
            const searchUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts?filter%5Bemail_address%5D=${encodeURIComponent(email)}`;
            const searchResponse = await fetch(searchUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const contactsList = Array.isArray(searchData) ? searchData : (searchData.contacts || []);
                if (contactsList.length > 0) {
                    contactId = contactsList[0].id || contactsList[0].public_id;
                    
                    try {
                        const existingAttrs = (contactsList[0] && typeof contactsList[0].custom_attributes === 'object' && contactsList[0].custom_attributes !== null)
                            ? contactsList[0].custom_attributes
                            : {};
                        const mergedAttrs = {
                            ...existingAttrs,
                            ...customAttributes
                        };
                        const updateBody = {
                            contact: {
                                custom_attributes: mergedAttrs
                            }
                        };
                        const updateUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/contacts/${contactId}`;
                        const updateResponse = await fetch(updateUrl, {
                            method: "PUT",
                            headers: commonHeaders,
                            body: JSON.stringify(updateBody)
                        });
                        if (!updateResponse.ok) {
                            await logErrorResponse("Update Contact", updateResponse);
                        }
                    } catch (updateErr) {
                        console.error("Failed to update existing contact's custom attributes:", updateErr);
                    }
                }
            } else {
                await logErrorResponse("Search Contact", searchResponse);
            }
        }

        if (!contactId) {
            console.error("[ClickFunnels] Failed to create or locate contact in ClickFunnels.");
            return createErrorResponse(502, "Could not unlock access in ClickFunnels. Please try again.", true, request);
        }

        // --- STEP 3: Explicitly Apply the Tag to the Contact via Applied Tags ---
        let tagApplied = Boolean(tagId);
        if (contactId && tagId) {
            try {
                const applyTagUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/contacts/${contactId}/applied_tags`;
                const applyTagResponse = await fetch(applyTagUrl, {
                    method: "POST",
                    headers: commonHeaders,
                    body: JSON.stringify({
                        contacts_applied_tag: {
                            tag_id: tagId
                        }
                    })
                });

                if (applyTagResponse.ok) {
                    tagApplied = true;
                } else if (applyTagResponse.status === 422) {
                    tagApplied = true;
                } else {
                    await logErrorResponse("Apply Tag", applyTagResponse);
                }
            } catch (applyErr) {
                console.error("[ClickFunnels] Error applying tag to contact:", applyErr);
            }
        }

        return createSuccessResponse({
            contactId: contactId,
            message: "Access granted! Your free downloads are now unlocked."
        }, request);

    } catch (error) {
        console.error("[Free Gifts API Error]", error && error.message ? error.message : error);
        return createErrorResponse(500, "We could not unlock your downloads right now. Please try again in a moment.", true, request);
    }
}

async function logErrorResponse(stepName, response) {
    return logSanitizedError("ClickFunnels", stepName, response);
}
