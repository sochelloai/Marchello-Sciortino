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
    // Try to extract workspaces/\d+ or any number
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
    getCorsHeaders,
    handleCorsPreflight,
    validateContentType,
    checkRateLimit,
    validateFormFields,
    verifyTurnstileToken,
    createErrorResponse,
    createSuccessResponse
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
        return createErrorResponse(429, "Too many submission attempts. Please wait a few minutes before trying again.", true, request);
    }
    
    // Retrieve credentials and configs from Cloudflare Environment Variables / Secrets
    const apiKey = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_API_KEY"));
    const subdomain = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_SUBDOMAIN"));
    const workspaceId = cleanWorkspaceId(getEnvVal(env, "CLICKFUNNELS_WORKSPACE_ID"));
    const tagName = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_TAG_NAME")) || "ms-contact-form";

    // Configuration Validation (Friendly visitor error without leaking internal secret names)
    if (!apiKey || !subdomain || !workspaceId) {
        console.error("[Configuration Error] Missing ClickFunnels credentials in environment.");
        return createErrorResponse(500, "The contact service is temporarily unavailable. Please try again later.", true, request);
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
            name: { type: "text", required: false, maxLength: 100, label: "Name" },
            email: { type: "email", required: true, maxLength: 254, label: "Email" },
            subject: { type: "text", required: false, maxLength: 150, label: "Subject" },
            description: { type: "text", required: false, maxLength: 3000, label: "Message" },
            interest: { type: "text", required: false, maxLength: 100, label: "Area of Interest" },
            file: { type: "file", maxBytes: 10 * 1024 * 1024 }
        };

        const validation = validateFormFields(formData, fieldRules);
        if (validation.error) {
            return createErrorResponse(400, validation.error, true, request);
        }

        const { name, email, subject, description, interest, file } = validation.data;

        // Upload attachment to file hosting to get a public download link
        let attachmentUrl = "";
        if (file && typeof file === "object" && file.size > 0) {
            const catboxForm = new FormData();
            catboxForm.append("reqtype", "fileupload");
            catboxForm.append("fileToUpload", file);

            try {
                const catboxResponse = await fetch("https://catbox.moe/user/api.php", {
                    method: "POST",
                    body: catboxForm
                });
                if (catboxResponse.ok) {
                    const resultText = await catboxResponse.text();
                    if (resultText && resultText.startsWith("http")) {
                        attachmentUrl = resultText.trim();
                    } else {
                        console.error(`Catbox returned non-URL response: ${resultText}`);
                    }
                } else {
                    console.error(`Catbox upload failed with status ${catboxResponse.status}`);
                }
            } catch (uploadError) {
                console.error("Failed to upload to Catbox:", uploadError);
            }

            // Fallback: If catbox failed or returned an error, try tmpfiles.org
            if (!attachmentUrl) {
                try {
                    const tmpForm = new FormData();
                    tmpForm.append("file", file);
                    const tmpResponse = await fetch("https://tmpfiles.org/api/v1/upload", {
                        method: "POST",
                        body: tmpForm
                    });
                    if (tmpResponse.ok) {
                        const tmpData = await tmpResponse.json();
                        if (tmpData && tmpData.status === "success" && tmpData.data && tmpData.data.url) {
                            attachmentUrl = tmpData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
                        }
                    } else {
                        console.error(`Tmpfiles upload failed with status ${tmpResponse.status}`);
                    }
                } catch (tmpError) {
                    console.error("Failed to upload to Tmpfiles fallback:", tmpError);
                }
            }
        }

        // Sanitize the subdomain if a full URL was pasted
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

        // --- STEP 1: Find or Create Tag ID for Contact Form ---
        const primaryTagName = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_CONTACT_TAG_NAME")) || 
                               cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_TAG_NAME")) || 
                               "ms-contact-form";
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
                    matched = tagsList.find(t => t.name && (normalizeTag(t.name) === "contactform" || normalizeTag(t.name) === "contact" || normalizeTag(t.name) === "mscontactform"));
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

        // --- STEP 2: Create or Update Contact ---
        let contactId = null;
        const createContactUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts`;
        
        const contactPayload = {
            email_address: email,
            first_name: name || "",
            custom_attributes: {
                attachments: attachmentUrl || "",
                i_want_to: interest || "",
                description: description || "",
                subject: subject || ""
            }
        };

        const contactBody = {
            contact: contactPayload
        };

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
                    
                    // Update existing contact custom attributes (preserving previous attributes and NEVER overwriting tags)
                    try {
                        const existingAttrs = (contactsList[0] && typeof contactsList[0].custom_attributes === 'object' && contactsList[0].custom_attributes !== null)
                            ? contactsList[0].custom_attributes
                            : {};
                        const updateBody = {
                            contact: {
                                first_name: name || contactsList[0].first_name || "",
                                custom_attributes: {
                                    ...existingAttrs,
                                    attachments: attachmentUrl || existingAttrs.attachments || "",
                                    i_want_to: interest || existingAttrs.i_want_to || "",
                                    description: description || existingAttrs.description || "",
                                    subject: subject || existingAttrs.subject || ""
                                }
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
                const searchErrBody = await searchResponse.clone().text();
                await logErrorResponse("Search Contact", searchResponse);
                throw new Error(`[DEBUG] CF Search failed. URL: ${searchUrl}. Status: ${searchResponse.status}. Body: ${searchErrBody}`);
            }

            if (!contactId) {
                const errBody = await contactResponse.clone().text();
                throw new Error(`[DEBUG] CF Create failed. URL: ${createContactUrl}. Status: ${contactResponse.status}. Body: ${errBody}. Subdomain: [${cleanSubdomain}]. Workspace: [${cleanWorkspaceId}]. API Key Len: ${apiKey ? apiKey.length : 0}`);
            }
        }

        // --- STEP 3: Explicitly Apply the Tag to the Contact ---
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
                    const errBody = await logErrorResponse("Apply Tag", applyTagResponse);
                    console.error(`Failed to apply tag: ${applyTagResponse.status} - ${errBody}`);
                }
            } catch (applyErr) {
                console.error("[ClickFunnels] Error calling applied_tags:", applyErr);
            }
        }

        return createSuccessResponse({
            contactId: contactId,
            message: "Thank you. Your message has been received."
        }, request);

    } catch (error) {
        console.error("[Contact API Error]", error && error.message ? error.message : error);
        return createErrorResponse(500, "We could not process your submission right now. Please try again in a moment.", true, request);
    }
}

async function logErrorResponse(stepName, response) {
    let body = "";
    try {
        body = await response.clone().text();
    } catch (e) {
        body = "(failed to read body)";
    }
    console.error(`[ClickFunnels] ${stepName} failed with status ${response.status}: ${body}`);
    return body;
}
